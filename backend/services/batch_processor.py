import datetime
import json
import uuid
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from backend.models.database import (
    SourceCustomer, ProtectedCustomer, BatchRecord,
    SessionSource, SessionProtected, SessionVault, SessionPolicy, SessionBatch, SessionAudit
)
from backend.security.crypto import crypto_engine
from backend.security.vault import vault_service
from backend.services.policy import policy_service
from backend.services.audit import audit_service
from backend.schemas.schemas import BatchStatusResponse

class BatchProcessor:
    """
    Production batch processor supporting:
    - Chunked extraction from source database
    - Dynamic application of persisted protection policies
    - Format-Preserving Encryption (FPE) and deterministic Tokenization
    - Secure Vault storage with AES-256-GCM
    - Idempotent upserts by customer_id
    - Zero plaintext logging
    """

    def run_batch(
        self,
        batch_size: int = 100,
        mode: str = "upsert",
        actor: str = "system_operator",
        role: str = "ADMIN"
    ) -> BatchStatusResponse:
        batch_id = f"BAT-{uuid.uuid4().hex[:8].upper()}"
        start_time = datetime.datetime.utcnow()

        # Create sessions for separated databases
        source_session = SessionSource()
        protected_session = SessionProtected()
        vault_session = SessionVault()
        policy_session = SessionPolicy()
        batch_session = SessionBatch()
        audit_session = SessionAudit()

        try:
            # 1. Fetch active policies
            policy_map = policy_service.get_policy_map(policy_session)
            # Default actions if not explicitly configured
            mobile_action = policy_map.get("mobile", "FPE")
            email_action = policy_map.get("email", "TOKENIZE")
            name_action = policy_map.get("name", "TOKENIZE")

            # 2. Query total rows in source
            total_rows = source_session.query(SourceCustomer).count()

            # 3. Create initial BatchRecord
            batch_record = BatchRecord(
                batch_id=batch_id,
                source_name="source_customers",
                status="RUNNING",
                start_time=start_time,
                batch_size=batch_size,
                total_rows=total_rows,
                processed_count=0,
                success_count=0,
                error_count=0
            )
            batch_session.add(batch_record)
            batch_session.commit()

            processed_count = 0
            success_count = 0
            error_count = 0
            error_summaries: List[str] = []

            # 4. Chunked extraction and transformation
            offset = 0
            while offset < total_rows:
                chunk = source_session.query(SourceCustomer).order_by(SourceCustomer.customer_id).offset(offset).limit(batch_size).all()
                if not chunk:
                    break

                for src_row in chunk:
                    processed_count += 1
                    try:
                        # --- Transform Mobile (FPE / Tokenize / Keep) ---
                        if mobile_action == "FPE":
                            mobile_protected = crypto_engine.encrypt_phone_fpe(src_row.mobile)
                            # Store in vault under mobile token/fpe representation for authorized reverse resolution
                            vault_service.store_mapping(
                                token=f"TEL_{mobile_protected}",
                                plaintext=src_row.mobile,
                                field_type="MOBILE",
                                session=vault_session
                            )
                        elif mobile_action == "TOKENIZE":
                            mobile_protected = crypto_engine.generate_token(src_row.mobile, prefix="TEL", length=6)
                            vault_service.store_mapping(
                                token=mobile_protected,
                                plaintext=src_row.mobile,
                                field_type="MOBILE",
                                session=vault_session
                            )
                        else:  # KEEP
                            mobile_protected = src_row.mobile

                        # --- Transform Email (Tokenize / Keep) ---
                        if email_action == "TOKENIZE":
                            email_protected = crypto_engine.tokenize_email(src_row.email)
                            vault_service.store_mapping(
                                token=email_protected,
                                plaintext=src_row.email,
                                field_type="EMAIL",
                                session=vault_session
                            )
                        else:  # KEEP
                            email_protected = src_row.email

                        # --- Transform Name (Tokenize / Keep) ---
                        if name_action == "TOKENIZE":
                            name_protected = crypto_engine.tokenize_name(src_row.name)
                            vault_service.store_mapping(
                                token=name_protected,
                                plaintext=src_row.name,
                                field_type="NAME",
                                session=vault_session
                            )
                        else:  # KEEP
                            name_protected = src_row.name

                        # --- Idempotent Upsert into Protected Database ---
                        existing = protected_session.query(ProtectedCustomer).filter(
                            ProtectedCustomer.customer_id == src_row.customer_id
                        ).first()

                        if existing:
                            existing.name_token = name_protected
                            existing.email_token = email_protected
                            existing.mobile_fpe = mobile_protected
                            existing.city = src_row.city
                            existing.segment = src_row.segment
                            existing.protection_status = "PROTECTED"
                            existing.updated_at = datetime.datetime.utcnow()
                        else:
                            new_protected = ProtectedCustomer(
                                customer_id=src_row.customer_id,
                                name_token=name_protected,
                                email_token=email_protected,
                                mobile_fpe=mobile_protected,
                                city=src_row.city,
                                segment=src_row.segment,
                                protection_status="PROTECTED",
                                updated_at=datetime.datetime.utcnow()
                            )
                            protected_session.add(new_protected)

                        success_count += 1

                    except Exception as err:
                        error_count += 1
                        # Strictly avoid plaintext in error messages
                        sanitized_err = f"Transform failed for subject '{src_row.customer_id}': {type(err).__name__}"
                        if len(error_summaries) < 10:
                            error_summaries.append(sanitized_err)

                # Commit chunk to databases
                protected_session.commit()
                offset += batch_size

                # Update live progress in batch_record
                batch_record.processed_count = processed_count
                batch_record.success_count = success_count
                batch_record.error_count = error_count
                batch_session.commit()

            # 5. Finalize Batch
            end_time = datetime.datetime.utcnow()
            batch_record.status = "COMPLETED" if error_count == 0 else "COMPLETED_WITH_ERRORS"
            batch_record.end_time = end_time
            if error_summaries:
                batch_record.error_details_json = json.dumps(error_summaries)
            batch_session.commit()

            # 6. Immutable Audit Log
            audit_service.record_event(
                actor=actor,
                role=role,
                action="BATCH_PROTECT",
                result="SUCCESS" if error_count == 0 else "PARTIAL_SUCCESS",
                session=audit_session,
                reference=batch_id,
                metadata={
                    "total_rows": total_rows,
                    "processed_count": processed_count,
                    "success_count": success_count,
                    "error_count": error_count,
                    "batch_size": batch_size,
                    "policies_applied": {
                        "mobile": mobile_action,
                        "email": email_action,
                        "name": name_action
                    }
                }
            )

            return BatchStatusResponse(
                batch_id=batch_id,
                source_name="source_customers",
                status=batch_record.status,
                start_time=start_time,
                end_time=end_time,
                batch_size=batch_size,
                total_rows=total_rows,
                processed_count=processed_count,
                success_count=success_count,
                error_count=error_count,
                error_details=error_summaries if error_summaries else None
            )

        finally:
            source_session.close()
            protected_session.close()
            vault_session.close()
            policy_session.close()
            batch_session.close()
            audit_session.close()

    def get_batch(self, batch_id: str, session: Session) -> Optional[BatchStatusResponse]:
        record = session.query(BatchRecord).filter(BatchRecord.batch_id == batch_id).first()
        if not record:
            return None
        errors = json.loads(record.error_details_json) if record.error_details_json else None
        return BatchStatusResponse(
            batch_id=record.batch_id,
            source_name=record.source_name,
            status=record.status,
            start_time=record.start_time,
            end_time=record.end_time,
            batch_size=record.batch_size,
            total_rows=record.total_rows,
            processed_count=record.processed_count,
            success_count=record.success_count,
            error_count=record.error_count,
            error_details=errors
        )

    def list_batches(self, session: Session, limit: int = 20) -> List[BatchStatusResponse]:
        records = session.query(BatchRecord).order_by(BatchRecord.start_time.desc()).limit(limit).all()
        results = []
        for r in records:
            errors = json.loads(r.error_details_json) if r.error_details_json else None
            results.append(BatchStatusResponse(
                batch_id=r.batch_id,
                source_name=r.source_name,
                status=r.status,
                start_time=r.start_time,
                end_time=r.end_time,
                batch_size=r.batch_size,
                total_rows=r.total_rows,
                processed_count=r.processed_count,
                success_count=r.success_count,
                error_count=r.error_count,
                error_details=errors
            ))
        return results

batch_processor = BatchProcessor()
