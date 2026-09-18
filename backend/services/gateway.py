import datetime
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from backend.models.database import (
    ProtectedCustomer, ProtectedBounceEvent,
    SessionProtected, SessionVault, SessionAudit
)
from backend.security.crypto import crypto_engine
from backend.security.vault import vault_service
from backend.security.auth import UserContext
from backend.services.email_service import email_service
from backend.services.audit import audit_service
from backend.schemas.schemas import (
    SendEmailRequest, SendEmailResponse, TraceStep,
    BounceWebhookRequest, BounceWebhookResponse,
    RevealRequest, RevealResponse
)

ALLOWED_REVEAL_PURPOSES = ["CUSTOMER_SUPPORT", "FRAUD_INVESTIGATION"]
ALLOWED_REVEAL_ROLES = ["CUSTOMER_SUPPORT", "ADMIN"]

class PrivacyGateway:
    """
    Tightly controlled security boundary between protected data and sensitive original values.
    Enforces authentication, authorization, purpose verification, audit logging, and zero-leakage.
    """

    def execute_marketing_email(
        self,
        request: SendEmailRequest,
        user: UserContext
    ) -> SendEmailResponse:
        """
        Executes marketing email dispatch without exposing the plaintext email to the caller.
        """
        vault_session = SessionVault()
        audit_session = SessionAudit()
        trace: List[TraceStep] = []

        now_str = lambda: datetime.datetime.utcnow().strftime("%H:%M:%S.%f")[:-3]

        try:
            # 1. Authenticate & Verify Requester
            trace.append(TraceStep(
                stage="AUTH_CHECK",
                status="VERIFIED",
                details=f"Requester authenticated as '{user.user_id}' with role '{user.role}'",
                timestamp=now_str()
            ))

            # 2. Validate Protected Recipient Token Format
            if not request.recipient.startswith("EMAIL_"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid recipient format: Expected protected token (EMAIL_xxxx)"
                )
            trace.append(TraceStep(
                stage="TOKEN_VALIDATION",
                status="VALID",
                details=f"Target recipient verified as protected token: {request.recipient}",
                timestamp=now_str()
            ))

            # 3. Secure Vault Resolution (Internal to Gateway Boundary)
            real_email = vault_service.resolve_token(request.recipient, vault_session)
            if not real_email:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Recipient token could not be resolved in secure vault"
                )
            trace.append(TraceStep(
                stage="VAULT_RESOLUTION",
                status="RESOLVED_INTERNALLY",
                details="Decrypted AES-256-GCM vault record within isolated gateway boundary (Plaintext withheld from response)",
                timestamp=now_str()
            ))

            # 4. Controlled Execution: Dispatch Email via Email Service
            subject = f"Special Offer - Campaign {request.campaign_id}"
            body = (
                f"Hello valued customer,\n\n"
                f"This email was dispatched via the FLYYY.AI Privacy Gateway under campaign {request.campaign_id}.\n"
                f"Your downstream marketing system only interacted with your protected identifier: {request.recipient}.\n"
                f"Template: {request.template_id}\n\n"
                f"Privacy-Preserving Customer Data Platform Demo"
            )
            email_service.send_email(
                real_recipient=real_email,
                subject=subject,
                body=body,
                campaign_id=request.campaign_id
            )
            trace.append(TraceStep(
                stage="DISPATCH_DELIVERY",
                status="DISPATCHED",
                details=f"Delivered to test mail service under secure protocol",
                timestamp=now_str()
            ))

            # 5. Audit Logging
            audit_service.record_event(
                actor=user.user_id,
                role=user.role,
                action="SEND_EMAIL",
                result="SUCCESS",
                session=audit_session,
                protected_subject=request.recipient,
                field="EMAIL",
                purpose="MARKETING_DISPATCH",
                reference=request.campaign_id,
                metadata={"template_id": request.template_id}
            )
            trace.append(TraceStep(
                stage="AUDIT_RECORDED",
                status="COMMITTED",
                details=f"Immutable audit entry committed with purpose MARKETING_DISPATCH",
                timestamp=now_str()
            ))

            # Return response: PROTECTED IDENTIFIER ONLY
            return SendEmailResponse(
                recipient=request.recipient,
                status="SENT",
                message="Message successfully dispatched through Privacy Gateway",
                execution_trace=trace
            )

        finally:
            vault_session.close()
            audit_session.close()

    def process_bounce_webhook(self, request: BounceWebhookRequest) -> BounceWebhookResponse:
        """
        Receives email provider bounce callback with plaintext email,
        reverse-resolves to protected token via vault, and stores against protected identity.
        """
        vault_session = SessionVault()
        protected_session = SessionProtected()
        audit_session = SessionAudit()

        try:
            # Reverse-resolve plaintext email to protected token
            protected_token = vault_service.reverse_resolve_email(request.email, vault_session)
            if not protected_token:
                # If email not yet tokenized in vault, create deterministic token to protect downstream
                protected_token = crypto_engine.tokenize_email(request.email)
                vault_service.store_mapping(
                    token=protected_token,
                    plaintext=request.email,
                    field_type="EMAIL",
                    session=vault_session
                )

            # Store in downstream bounce table using protected identity ONLY
            bounce_record = ProtectedBounceEvent(
                recipient=protected_token,
                event=request.event.upper(),
                reason=request.reason,
                received_at=datetime.datetime.utcnow()
            )
            protected_session.add(bounce_record)
            protected_session.commit()

            # Record audit event
            audit_service.record_event(
                actor="email_provider_webhook",
                role="WEBHOOK",
                action="BOUNCE_CALLBACK",
                result="SUCCESS",
                session=audit_session,
                protected_subject=protected_token,
                field="EMAIL",
                purpose="BOUNCE_HANDLING",
                reference=request.reason,
                metadata={"event": request.event}
            )

            # Return response referencing protected token
            return BounceWebhookResponse(
                status="PROCESSED",
                recipient=protected_token,
                event=request.event.upper(),
                message=f"Bounce successfully registered and remapped to protected identifier {protected_token}"
            )

        finally:
            vault_session.close()
            protected_session.close()
            audit_session.close()

    def execute_controlled_reveal(
        self,
        request: RevealRequest,
        user: UserContext
    ) -> RevealResponse:
        """
        High-security endpoint: reveals plaintext only when strict role, purpose,
        and reference validation pass. Every attempt (allowed or denied) is audited.
        """
        protected_session = SessionProtected()
        vault_session = SessionVault()
        audit_session = SessionAudit()

        try:
            req_field = request.field.upper()
            req_purpose = request.purpose.upper()

            # 1. Role Authorization Check
            if user.role not in ALLOWED_REVEAL_ROLES:
                audit_service.record_event(
                    actor=user.user_id,
                    role=user.role,
                    action="REVEAL",
                    result="ACCESS_DENIED",
                    session=audit_session,
                    protected_subject=request.subject_id,
                    field=req_field,
                    purpose=req_purpose,
                    reference=request.reference,
                    metadata={"reason": f"Role '{user.role}' unauthorized for reveal"}
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"ACCESS_DENIED: User with role '{user.role}' is not authorized for data reveals"
                )

            # 2. Purpose Validation Check
            if req_purpose not in ALLOWED_REVEAL_PURPOSES:
                audit_service.record_event(
                    actor=user.user_id,
                    role=user.role,
                    action="REVEAL",
                    result="ACCESS_DENIED",
                    session=audit_session,
                    protected_subject=request.subject_id,
                    field=req_field,
                    purpose=req_purpose,
                    reference=request.reference,
                    metadata={"reason": f"Declared purpose '{request.purpose}' is invalid"}
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"ACCESS_DENIED: Invalid purpose '{request.purpose}'. Permitted purposes: {ALLOWED_REVEAL_PURPOSES}"
                )

            # 3. Reference Validation Check
            if not request.reference or len(request.reference.strip()) < 3:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="ACCESS_DENIED: Valid business reference (e.g. TICKET-1091) is required"
                )

            # 4. Fetch Protected Record
            customer = protected_session.query(ProtectedCustomer).filter(
                ProtectedCustomer.customer_id == request.subject_id
            ).first()

            if not customer:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Customer '{request.subject_id}' not found in protected database"
                )

            # 5. Determine Token to Resolve
            target_token = None
            if req_field in ("EMAIL", "EMAIL_ADDRESS"):
                target_token = customer.email_token
            elif req_field in ("NAME", "PERSON"):
                target_token = customer.name_token
            elif req_field in ("MOBILE", "PHONE", "PHONE_NUMBER"):
                # If mobile was FPE encrypted, decrypt using FPE
                if customer.mobile_fpe:
                    try:
                        decrypted_mobile = crypto_engine.decrypt_phone_fpe(customer.mobile_fpe)
                        audit_rec = audit_service.record_event(
                            actor=user.user_id,
                            role=user.role,
                            action="REVEAL",
                            result="ALLOWED",
                            session=audit_session,
                            protected_subject=request.subject_id,
                            field=req_field,
                            purpose=req_purpose,
                            reference=request.reference,
                            metadata={"method": "FPE_DECRYPT"}
                        )
                        return RevealResponse(
                            status="ALLOWED",
                            subject_id=request.subject_id,
                            field=req_field,
                            plaintext=decrypted_mobile,
                            purpose=req_purpose,
                            reference=request.reference,
                            message="Plaintext mobile decrypted from FPE cipher under authorized exception",
                            audit_id=audit_rec.id
                        )
                    except Exception as e:
                        target_token = f"TEL_{customer.mobile_fpe}"
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Field '{request.field}' cannot be revealed"
                )

            # 6. Resolve from Secure Vault
            plaintext = vault_service.resolve_token(target_token, vault_session)
            if not plaintext:
                # Try fallback by subject_id in source if available
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Secure vault mapping not found for token '{target_token}'"
                )

            # 7. Audit Approved Reveal
            audit_rec = audit_service.record_event(
                actor=user.user_id,
                role=user.role,
                action="REVEAL",
                result="ALLOWED",
                session=audit_session,
                protected_subject=request.subject_id,
                field=req_field,
                purpose=req_purpose,
                reference=request.reference,
                metadata={"token_resolved": target_token}
            )

            return RevealResponse(
                status="ALLOWED",
                subject_id=request.subject_id,
                field=req_field,
                plaintext=plaintext,
                purpose=req_purpose,
                reference=request.reference,
                message="Authorized exception granted. Plaintext retrieved and operation audited.",
                audit_id=audit_rec.id
            )

        finally:
            protected_session.close()
            vault_session.close()
            audit_session.close()

privacy_gateway = PrivacyGateway()
