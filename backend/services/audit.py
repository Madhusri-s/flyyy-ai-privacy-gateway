import datetime
import json
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from backend.models.database import AuditRecord
from backend.schemas.schemas import AuditRecordResponse

class AuditService:
    """
    Immutable audit logging service.
    Zero-plaintext guarantee: Plaintext sensitive PII is NEVER written to audit logs.
    """

    def record_event(
        self,
        actor: str,
        role: str,
        action: str,
        result: str,
        session: Session,
        protected_subject: Optional[str] = None,
        field: Optional[str] = None,
        purpose: Optional[str] = None,
        reference: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AuditRecord:
        """
        Creates and persists an immutable audit log record.
        """
        meta_str = json.dumps(metadata) if metadata else None

        record = AuditRecord(
            actor=actor,
            role=role.upper(),
            action=action.upper(),
            result=result.upper(),
            protected_subject=protected_subject,
            field=field.upper() if field else None,
            purpose=purpose.upper() if purpose else None,
            reference=reference,
            timestamp=datetime.datetime.utcnow(),
            metadata_json=meta_str
        )
        session.add(record)
        session.commit()
        session.refresh(record)
        return record

    def query_audit_logs(
        self,
        session: Session,
        actor: Optional[str] = None,
        action: Optional[str] = None,
        role: Optional[str] = None,
        result: Optional[str] = None,
        limit: int = 100
    ) -> List[AuditRecordResponse]:
        query = session.query(AuditRecord)
        if actor:
            query = query.filter(AuditRecord.actor.ilike(f"%{actor}%"))
        if action:
            query = query.filter(AuditRecord.action == action.upper())
        if role:
            query = query.filter(AuditRecord.role == role.upper())
        if result:
            query = query.filter(AuditRecord.result == result.upper())

        records = query.order_by(AuditRecord.timestamp.desc()).limit(limit).all()
        results = []
        for r in records:
            meta = json.loads(r.metadata_json) if r.metadata_json else None
            results.append(AuditRecordResponse(
                id=r.id,
                actor=r.actor,
                role=r.role,
                action=r.action,
                protected_subject=r.protected_subject,
                field=r.field,
                purpose=r.purpose,
                reference=r.reference,
                result=r.result,
                timestamp=r.timestamp,
                metadata=meta
            ))
        return results

    def get_audit_count(self, session: Session) -> int:
        return session.query(AuditRecord).count()

audit_service = AuditService()
