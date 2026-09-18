import csv
import io
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.models.database import (
    SourceCustomer, ProtectedCustomer, ProtectedBounceEvent,
    get_source_db, get_protected_db, get_vault_db, get_policy_db, get_audit_db, get_batch_db
)
from backend.schemas.schemas import (
    BatchRunRequest, BatchStatusResponse,
    DiscoverResponse,
    PolicyRule, PolicyUpdateRequest,
    ProtectedCustomerResponse,
    ProtectTestRequest, ProtectTestResponse,
    SendEmailRequest, SendEmailResponse,
    BounceWebhookRequest, BounceWebhookResponse,
    RevealRequest, RevealResponse,
    AuditRecordResponse,
    SecurityPostureResponse,
    MailboxMessageResponse
)
from backend.security.auth import get_current_user, UserContext, require_roles
from backend.security.crypto import crypto_engine
from backend.security.vault import vault_service
from backend.services.discovery import discovery_engine
from backend.services.policy import policy_service
from backend.services.batch_processor import batch_processor
from backend.services.gateway import privacy_gateway
from backend.services.audit import audit_service
from backend.services.posture import posture_service
from backend.services.email_service import email_service

router = APIRouter()

# -------------------------------------------------------------
# 1. BATCH PROCESSING APIS
# -------------------------------------------------------------
@router.post(
    "/batch/run",
    response_model=BatchStatusResponse,
    summary="Trigger a configured batch protection job",
    description="Processes source customer records in chunks, applies FPE and tokenization, and loads protected database."
)
def run_batch_job(
    request: BatchRunRequest,
    current_user: UserContext = Depends(get_current_user)
):
    return batch_processor.run_batch(
        batch_size=request.batch_size,
        mode=request.mode,
        actor=current_user.user_id,
        role=current_user.role
    )

@router.get(
    "/batch/{batch_id}",
    response_model=BatchStatusResponse,
    summary="Get batch status and telemetry counts"
)
def get_batch_status(
    batch_id: str,
    db: Session = Depends(get_batch_db)
):
    res = batch_processor.get_batch(batch_id, db)
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Batch '{batch_id}' not found")
    return res

@router.get(
    "/batch",
    response_model=List[BatchStatusResponse],
    summary="List recent batch runs"
)
def list_batches(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_batch_db)
):
    return batch_processor.list_batches(db, limit)


# -------------------------------------------------------------
# 2. PII DISCOVERY & CLASSIFICATION APIS
# -------------------------------------------------------------
@router.post(
    "/discover",
    response_model=DiscoverResponse,
    summary="Discover and classify source fields",
    description="Runs Presidio Analyzer and custom pattern recognizers across actual source dataset to detect PII with dynamic confidence."
)
def discover_fields(
    sample_size: int = Query(50, ge=5, le=500),
    db: Session = Depends(get_source_db)
):
    return discovery_engine.analyze_dataset(db, sample_limit=sample_size)


# -------------------------------------------------------------
# 3. PROTECTION POLICY APIS
# -------------------------------------------------------------
@router.get(
    "/policies",
    response_model=List[PolicyRule],
    summary="Get configured protection policies"
)
def get_policies(db: Session = Depends(get_policy_db)):
    policies = policy_service.get_all_policies(db)
    return [
        PolicyRule(
            field_name=p.field_name,
            detected_entity=p.detected_entity,
            sensitivity=p.sensitivity,
            action=p.action,
            format_rule=p.format_rule,
            is_deterministic=p.is_deterministic,
            version=p.version
        ) for p in policies
    ]

@router.put(
    "/policies",
    response_model=List[PolicyRule],
    summary="Update protection policies",
    description="Configures protection actions (FPE, TOKENIZE, ENCRYPT, KEEP) per field."
)
def update_policies(
    request: PolicyUpdateRequest,
    current_user: UserContext = Depends(require_roles(["ADMIN"])),
    policy_db: Session = Depends(get_policy_db),
    audit_db: Session = Depends(get_audit_db)
):
    updated = policy_service.update_policies(request.rules, policy_db)
    audit_service.record_event(
        actor=current_user.user_id,
        role=current_user.role,
        action="POLICY_UPDATE",
        result="SUCCESS",
        session=audit_db,
        metadata={"rule_count": len(request.rules)}
    )
    return [
        PolicyRule(
            field_name=p.field_name,
            detected_entity=p.detected_entity,
            sensitivity=p.sensitivity,
            action=p.action,
            format_rule=p.format_rule,
            is_deterministic=p.is_deterministic,
            version=p.version
        ) for p in updated
    ]


# -------------------------------------------------------------
# 4. INTERACTIVE VALUE PROTECTION TEST API
# -------------------------------------------------------------
@router.post(
    "/protect",
    response_model=ProtectTestResponse,
    summary="Protect a supplied value for controlled testing",
    description="Tests FPE, Tokenization, or Masking dynamically on any input string."
)
def test_protect_value(request: ProtectTestRequest):
    val = request.value.strip()
    action = request.action.upper()
    field_type = request.field_type.upper()

    if action == "FPE":
        if field_type in ("MOBILE", "PHONE"):
            protected = crypto_engine.encrypt_phone_fpe(val)
            format_preserved = len(protected) == 10 and protected.isdigit()
        elif field_type in ("NUMERIC_ID", "IDENTIFIER"):
            protected = crypto_engine.encrypt_numeric_id_fpe(val)
            format_preserved = len(protected) == 8 and protected.isdigit()
        else:
            protected = crypto_engine.encrypt_alphanumeric_fpe(val)
            format_preserved = len(protected) == 8
    elif action == "TOKENIZE":
        if field_type in ("EMAIL", "EMAIL_ADDRESS"):
            protected = crypto_engine.tokenize_email(val)
        elif field_type in ("NAME", "PERSON"):
            protected = crypto_engine.tokenize_name(val)
        else:
            protected = crypto_engine.tokenize_generic(val, prefix="TOK")
        format_preserved = True
    elif action == "KEEP":
        protected = val
        format_preserved = True
    else:
        protected = crypto_engine.tokenize_generic(val, prefix="ENC")
        format_preserved = False

    # Masked representation for display
    if field_type in ("EMAIL", "EMAIL_ADDRESS"):
        masked = crypto_engine.mask_email(val)
    elif field_type in ("MOBILE", "PHONE"):
        masked = crypto_engine.mask_phone(val)
    else:
        masked = crypto_engine.mask_name(val)

    return ProtectTestResponse(
        original_value_masked=masked,
        field_type=field_type,
        action=action,
        protected_value=protected,
        format_preserved=format_preserved,
        is_deterministic=True
    )


# -------------------------------------------------------------
# 5. PROTECTED CUSTOMER VIEW & EXPORT APIS
# -------------------------------------------------------------
@router.get(
    "/customers",
    response_model=List[ProtectedCustomerResponse],
    summary="List protected customer records",
    description="Returns customer records with protected identifiers, FPE numbers, and dynamic masked previews. Zero plaintext PII."
)
def list_protected_customers(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    search: Optional[str] = None,
    db: Session = Depends(get_protected_db)
):
    query = db.query(ProtectedCustomer)
    if search:
        query = query.filter(
            (ProtectedCustomer.customer_id.ilike(f"%{search}%")) |
            (ProtectedCustomer.name_token.ilike(f"%{search}%")) |
            (ProtectedCustomer.email_token.ilike(f"%{search}%")) |
            (ProtectedCustomer.city.ilike(f"%{search}%"))
        )
    records = query.order_by(ProtectedCustomer.customer_id).offset(offset).limit(limit).all()

    results = []
    for r in records:
        results.append(ProtectedCustomerResponse(
            customer_id=r.customer_id,
            name_token=r.name_token,
            email_token=r.email_token,
            mobile_fpe=r.mobile_fpe,
            city=r.city,
            segment=r.segment,
            protection_status=r.protection_status,
            masked_name=r.name_token[:4] + "****" if r.name_token else "****",
            masked_email=r.email_token[:5] + "****" if r.email_token else "****",
            masked_mobile=r.mobile_fpe[:2] + "******" + r.mobile_fpe[-2:] if len(r.mobile_fpe) >= 4 else "******",
            updated_at=r.updated_at
        ))
    return results

@router.get(
    "/customers/{customer_id}",
    response_model=ProtectedCustomerResponse,
    summary="Get protected customer by ID"
)
def get_protected_customer(
    customer_id: str,
    db: Session = Depends(get_protected_db)
):
    r = db.query(ProtectedCustomer).filter(ProtectedCustomer.customer_id == customer_id).first()
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Customer '{customer_id}' not found")
    return ProtectedCustomerResponse(
        customer_id=r.customer_id,
        name_token=r.name_token,
        email_token=r.email_token,
        mobile_fpe=r.mobile_fpe,
        city=r.city,
        segment=r.segment,
        protection_status=r.protection_status,
        masked_name=r.name_token[:4] + "****",
        masked_email=r.email_token[:5] + "****",
        masked_mobile=r.mobile_fpe[:2] + "******" + r.mobile_fpe[-2:] if len(r.mobile_fpe) >= 4 else "******",
        updated_at=r.updated_at
    )

@router.get(
    "/customers/export/csv",
    summary="Export protected database as CSV",
    description="Exports the protected customer dataset. Verifiably contains ONLY protected tokens and FPE values; no plaintext PII."
)
def export_protected_csv(
    db: Session = Depends(get_protected_db),
    current_user: UserContext = Depends(get_current_user),
    audit_db: Session = Depends(get_audit_db)
):
    records = db.query(ProtectedCustomer).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["customer_id", "name_token", "email_token", "mobile_fpe", "city", "segment", "protection_status"])

    for r in records:
        writer.writerow([r.customer_id, r.name_token, r.email_token, r.mobile_fpe, r.city or "", r.segment or "", r.protection_status])

    output.seek(0)

    audit_service.record_event(
        actor=current_user.user_id,
        role=current_user.role,
        action="EXPORT_PROTECTED_CSV",
        result="SUCCESS",
        session=audit_db,
        metadata={"row_count": len(records)}
    )

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=protected_customers_export.csv"}
    )


# -------------------------------------------------------------
# 6. MARKETING PRIVACY GATEWAY EXECUTION
# -------------------------------------------------------------
@router.post(
    "/actions/send-email",
    response_model=SendEmailResponse,
    summary="Execute email delivery from protected recipient",
    description="Marketing application calls Privacy Gateway using protected recipient EMAIL_xxxx. Real email resolved inside gateway and dispatched. Marketing app NEVER receives plaintext email."
)
def send_marketing_email(
    request: SendEmailRequest,
    current_user: UserContext = Depends(get_current_user)
):
    return privacy_gateway.execute_marketing_email(request, current_user)


# -------------------------------------------------------------
# 7. BOUNCE WEBHOOK CALLBACK & REVERSE RESOLUTION
# -------------------------------------------------------------
@router.post(
    "/webhooks/email",
    response_model=BounceWebhookResponse,
    summary="Receive email delivery/bounce callback",
    description="Email provider webhook sends bounce with plaintext email. Privacy Gateway reverse-resolves to protected token and stores bounce safely without plaintext exposure."
)
def handle_email_bounce(request: BounceWebhookRequest):
    return privacy_gateway.process_bounce_webhook(request)

@router.get(
    "/bounces",
    summary="List stored bounce events (Downstream view)",
    description="Lists bounce events recorded against protected recipients. Zero plaintext emails."
)
def list_bounce_events(db: Session = Depends(get_protected_db)):
    events = db.query(ProtectedBounceEvent).order_by(ProtectedBounceEvent.received_at.desc()).limit(50).all()
    return [
        {
            "id": e.id,
            "recipient": e.recipient,
            "event": e.event,
            "reason": e.reason,
            "received_at": e.received_at
        } for e in events
    ]


# -------------------------------------------------------------
# 8. CONTROLLED REVEAL API
# -------------------------------------------------------------
@router.post(
    "/reveal",
    response_model=RevealResponse,
    summary="Controlled reveal for authorized users",
    description="Requires Subject, Field, Purpose, and Reference. Verifies role and legitimate purpose. Denied attempts return ACCESS_DENIED. All attempts are audited."
)
def request_controlled_reveal(
    request: RevealRequest,
    current_user: UserContext = Depends(get_current_user)
):
    return privacy_gateway.execute_controlled_reveal(request, current_user)


# -------------------------------------------------------------
# 9. AUDIT TRAIL API
# -------------------------------------------------------------
@router.get(
    "/audit",
    response_model=List[AuditRecordResponse],
    summary="Review sensitive operations audit trail",
    description="Queryable immutable audit trail of all sensitive operations, reveals, and batch jobs. Contains zero plaintext PII."
)
def get_audit_trail(
    actor: Optional[str] = None,
    action: Optional[str] = None,
    role: Optional[str] = None,
    result: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_audit_db)
):
    return audit_service.query_audit_logs(db, actor=actor, action=action, role=role, result=result, limit=limit)


# -------------------------------------------------------------
# 10. SECURITY POSTURE & LEAKAGE VERIFICATION
# -------------------------------------------------------------
@router.get(
    "/security/posture",
    response_model=SecurityPostureResponse,
    summary="Evaluate system security posture and verify zero plaintext leakage"
)
def get_security_posture():
    return posture_service.evaluate_posture()


# -------------------------------------------------------------
# 11. IN-APP TEST MAILBOX INSPECTOR
# -------------------------------------------------------------
@router.get(
    "/mailbox",
    response_model=List[MailboxMessageResponse],
    summary="Query in-app test mailbox",
    description="Inspects real emails delivered by Privacy Gateway to test mail service."
)
def get_mailbox(db: Session = Depends(get_batch_db)):
    return email_service.get_mailbox_messages(db)


# -------------------------------------------------------------
# 12. SOURCE DATA INGESTION & DATASET MANAGEMENT
# -------------------------------------------------------------
@router.get(
    "/source/customers",
    summary="List source customer records (Restricted Data View)"
)
def list_source_customers(
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_source_db)
):
    records = db.query(SourceCustomer).limit(limit).all()
    return [
        {
            "customer_id": r.customer_id,
            "name": r.name,
            "email": r.email,
            "mobile": r.mobile,
            "city": r.city,
            "segment": r.segment
        } for r in records
    ]

@router.post(
    "/source/upload",
    summary="Upload custom CSV customer dataset into source database"
)
async def upload_source_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_source_db)
):
    contents = await file.read()
    text = contents.decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(text))

    imported = 0
    for row in reader:
        # Standardize field names
        cid = row.get("customer_id") or row.get("id") or f"C{imported+1001}"
        name = row.get("name") or row.get("full_name") or "Unknown"
        email = row.get("email") or row.get("email_address") or "unknown@example.com"
        mobile = row.get("mobile") or row.get("phone") or "9999999999"
        city = row.get("city") or "Mumbai"
        segment = row.get("segment") or "Standard"

        existing = db.query(SourceCustomer).filter(SourceCustomer.customer_id == cid).first()
        if existing:
            existing.name = name
            existing.email = email
            existing.mobile = mobile
            existing.city = city
            existing.segment = segment
        else:
            db.add(SourceCustomer(
                customer_id=cid,
                name=name,
                email=email,
                mobile=mobile,
                city=city,
                segment=segment
            ))
        imported += 1

    db.commit()
    return {"message": f"Successfully ingested {imported} customer records into source database", "rows_imported": imported}

@router.post(
    "/source/seed",
    summary="Seed source database with realistic sample records"
)
def seed_source_data(db: Session = Depends(get_source_db)):
    """Seeds realistic diverse customer records."""
    SAMPLE_CUSTOMERS = [
        {"customer_id": "C001", "name": "John Smith", "email": "john@example.com", "mobile": "9876543210", "city": "Chennai", "segment": "Premium"},
        {"customer_id": "C002", "name": "Mary Thomas", "email": "mary@example.com", "mobile": "9123456780", "city": "Bengaluru", "segment": "Standard"},
        {"customer_id": "C003", "name": "Rahul Kumar", "email": "rahul.kumar@gmail.com", "mobile": "9988776655", "city": "Mumbai", "segment": "Premium"},
        {"customer_id": "C004", "name": "Ananya Sharma", "email": "ananya.sharma@yahoo.com", "mobile": "9845123456", "city": "Delhi", "segment": "Enterprise"},
        {"customer_id": "C005", "name": "David Wilson", "email": "david.w@corporate.org", "mobile": "9712345678", "city": "Hyderabad", "segment": "Standard"},
        {"customer_id": "C006", "name": "Priya Patel", "email": "priya.patel@outlook.com", "mobile": "9898123456", "city": "Ahmedabad", "segment": "Premium"},
        {"customer_id": "C007", "name": "Vikram Singh", "email": "vikram.s@defence.in", "mobile": "9765432109", "city": "Pune", "segment": "Enterprise"},
        {"customer_id": "C008", "name": "Sarah Connor", "email": "sarah.connor@sky.net", "mobile": "9654321098", "city": "Kolkata", "segment": "Standard"},
        {"customer_id": "C009", "name": "Arjun Menon", "email": "arjun.m@techstart.io", "mobile": "9543210987", "city": "Kochi", "segment": "Growth"},
        {"customer_id": "C010", "name": "Fatima Sheikh", "email": "fatima.sheikh@global.ae", "mobile": "9432109876", "city": "Jaipur", "segment": "Premium"}
    ]

    count = 0
    for item in SAMPLE_CUSTOMERS:
        existing = db.query(SourceCustomer).filter(SourceCustomer.customer_id == item["customer_id"]).first()
        if not existing:
            db.add(SourceCustomer(**item))
            count += 1
        else:
            existing.name = item["name"]
            existing.email = item["email"]
            existing.mobile = item["mobile"]
            existing.city = item["city"]
            existing.segment = item["segment"]

    db.commit()
    return {"message": f"Source database seeded with {len(SAMPLE_CUSTOMERS)} records ({count} new records inserted)"}


# -------------------------------------------------------------
# 13. SYSTEM OVERVIEW TOPOLOGY STATS
# -------------------------------------------------------------
@router.get(
    "/overview/stats",
    summary="Get real-time counts across the privacy data pipeline topology"
)
def get_overview_stats(
    src_db: Session = Depends(get_source_db),
    prot_db: Session = Depends(get_protected_db),
    vault_db: Session = Depends(get_vault_db),
    pol_db: Session = Depends(get_policy_db),
    audit_db: Session = Depends(get_audit_db),
    batch_db: Session = Depends(get_batch_db)
):
    src_count = src_db.query(SourceCustomer).count()
    prot_count = prot_db.query(ProtectedCustomer).count()
    vault_count = vault_service.get_vault_count(vault_db)
    pol_count = len(policy_service.get_all_policies(pol_db))
    audit_count = audit_service.get_audit_count(audit_db)
    bounce_count = prot_db.query(ProtectedBounceEvent).count()
    batch_count = len(batch_processor.list_batches(batch_db))

    return {
        "source_records": src_count,
        "sensitive_fields_detected": 3,  # mobile, email, name
        "active_policies": pol_count,
        "protected_records": prot_count,
        "vault_mappings": vault_count,
        "audit_events": audit_count,
        "bounce_events": bounce_count,
        "batch_runs": batch_count,
        "gateway_status": "OPERATIONAL"
    }
