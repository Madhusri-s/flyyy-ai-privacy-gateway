import pytest
import re
from fastapi.testclient import TestClient
from backend.main import app
from backend.security.crypto import crypto_engine
from backend.models.database import (
    init_all_databases, SessionSource, SessionProtected, SessionVault, SessionAudit,
    SourceCustomer, ProtectedCustomer, VaultMapping, AuditRecord
)
from backend.services.policy import policy_service
from backend.api.router import seed_source_data

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_test_databases():
    init_all_databases()
    # Seed sample source customers
    src_db = SessionSource()
    seed_source_data(src_db)
    src_db.close()
    yield

# -------------------------------------------------------------
# 1. FORMAT-PRESERVING ENCRYPTION (FPE) TESTS
# -------------------------------------------------------------
def test_fpe_phone_format_preservation():
    """Verify FPE preserves 10 numeric digits and decrypts accurately."""
    original_phone = "9876543210"
    encrypted_phone = crypto_engine.encrypt_phone_fpe(original_phone)

    # Must preserve exact length
    assert len(encrypted_phone) == 10
    # Must preserve character set (numeric digits only)
    assert encrypted_phone.isdigit()
    # Must not equal plaintext
    assert encrypted_phone != original_phone
    # Decrypt must yield original
    decrypted_phone = crypto_engine.decrypt_phone_fpe(encrypted_phone)
    assert decrypted_phone == original_phone

def test_fpe_alphanumeric_code():
    """Verify FPE preserves 8 alphanumeric characters."""
    code = "AB12CD34"
    enc = crypto_engine.encrypt_alphanumeric_fpe(code)
    assert len(enc) == 8
    assert re.match(r"^[0-9A-Z]{8}$", enc)
    dec = crypto_engine.decrypt_alphanumeric_fpe(enc)
    assert dec == code

# -------------------------------------------------------------
# 2. DETERMINISTIC TOKENIZATION TESTS
# -------------------------------------------------------------
def test_deterministic_tokenization():
    """Verify same input generates identical token for referential stability."""
    email = "rahul.kumar@gmail.com"
    token1 = crypto_engine.tokenize_email(email)
    token2 = crypto_engine.tokenize_email(email)
    assert token1 == token2
    assert token1.startswith("EMAIL_")

    name = "Rahul Kumar"
    name_tok1 = crypto_engine.tokenize_name(name)
    name_tok2 = crypto_engine.tokenize_name(name)
    assert name_tok1 == name_tok2
    assert name_tok1.startswith("NAME_")

# -------------------------------------------------------------
# 3. SECURE VAULT AES-256-GCM AT REST
# -------------------------------------------------------------
def test_vault_authenticated_encryption():
    """Verify AES-256-GCM authenticated encryption and decryption."""
    secret = "confidential_personal_info@secret.com"
    ciphertext, nonce = crypto_engine.encrypt_vault_payload(secret)

    # Ciphertext must not contain plaintext string
    assert secret not in ciphertext
    # Decrypt with nonce
    decrypted = crypto_engine.decrypt_vault_payload(ciphertext, nonce)
    assert decrypted == secret

# -------------------------------------------------------------
# 4. PII DISCOVERY API TEST
# -------------------------------------------------------------
def test_pii_discovery_api():
    """Verify Presidio + regex discovers fields and provides dynamic confidence."""
    response = client.post("/api/discover?sample_size=20")
    assert response.status_code == 200
    data = response.json()
    assert data["total_fields"] >= 4
    assert data["detected_pii_count"] >= 3

    field_map = {f["field_name"]: f for f in data["fields"]}
    assert "mobile" in field_map
    assert field_map["mobile"]["detected_entity"] == "PHONE_NUMBER"
    assert field_map["mobile"]["confidence"] >= 0.70
    assert field_map["mobile"]["recommended_action"] == "FPE"

    assert "email" in field_map
    assert field_map["email"]["detected_entity"] == "EMAIL_ADDRESS"
    assert field_map["email"]["confidence"] >= 0.80
    assert field_map["email"]["recommended_action"] == "TOKENIZE"

# -------------------------------------------------------------
# 5. BATCH PROCESSING & IDEMPOTENCY TESTS
# -------------------------------------------------------------
def test_batch_execution_and_idempotency():
    """Verify chunked batch execution and safe idempotent reruns."""
    # First batch run
    resp1 = client.post("/api/batch/run", json={"batch_size": 5, "mode": "upsert"})
    assert resp1.status_code == 200
    b1 = resp1.json()
    assert b1["status"] == "COMPLETED"
    assert b1["processed_count"] >= 10
    assert b1["error_count"] == 0

    prot_db = SessionProtected()
    initial_count = prot_db.query(ProtectedCustomer).count()
    assert initial_count >= 10

    # Rerun batch (Idempotency test)
    resp2 = client.post("/api/batch/run", json={"batch_size": 5, "mode": "upsert"})
    assert resp2.status_code == 200
    b2 = resp2.json()
    assert b2["status"] == "COMPLETED"

    rerun_count = prot_db.query(ProtectedCustomer).count()
    # Must NOT create duplicate customer records!
    assert rerun_count == initial_count
    prot_db.close()

# -------------------------------------------------------------
# 6. ZERO PLAINTEXT IN PROTECTED DATABASE & EXPORT
# -------------------------------------------------------------
def test_zero_plaintext_in_protected_export():
    """Verify CSV export contains zero plaintext emails or mobile numbers."""
    resp = client.get("/api/customers/export/csv")
    assert resp.status_code == 200
    csv_text = resp.text

    src_db = SessionSource()
    source_records = src_db.query(SourceCustomer).all()
    for src in source_records:
        # Sensitive email should NOT be in exported CSV
        assert src.email not in csv_text
        # Sensitive phone number should NOT be in exported CSV
        assert src.mobile not in csv_text
    src_db.close()

# -------------------------------------------------------------
# 7. MARKETING EMAIL SEND VIA PRIVACY GATEWAY
# -------------------------------------------------------------
def test_marketing_send_email():
    """Verify marketing app sends to protected token and receives NO plaintext."""
    prot_db = SessionProtected()
    customer = prot_db.query(ProtectedCustomer).first()
    recipient_token = customer.email_token
    prot_db.close()

    resp = client.post(
        "/api/actions/send-email",
        json={
            "recipient": recipient_token,
            "campaign_id": "CMP-TEST-01",
            "template_id": "WELCOME"
        },
        headers={"X-User-Role": "MARKETING", "X-User-Id": "mkt_test"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["recipient"] == recipient_token
    assert body["status"] == "SENT"
    # Plaintext email must NOT appear in response payload
    assert "@" not in str(body["recipient"])

    # Verify message logged in test mailbox
    mb_resp = client.get("/api/mailbox")
    assert mb_resp.status_code == 200
    messages = mb_resp.json()
    assert len(messages) > 0

# -------------------------------------------------------------
# 8. BOUNCE WEBHOOK HANDLING
# -------------------------------------------------------------
def test_bounce_reverse_resolution():
    """Verify email provider webhook resolves email to protected token and stores safely."""
    test_email = "john@example.com"
    resp = client.post(
        "/api/webhooks/email",
        json={"email": test_email, "event": "BOUNCE", "reason": "MAILBOX_NOT_FOUND"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "PROCESSED"
    assert data["recipient"].startswith("EMAIL_")

    # Downstream bounces list should only show protected token
    b_resp = client.get("/api/bounces")
    assert b_resp.status_code == 200
    bounces = b_resp.json()
    assert any(b["recipient"] == data["recipient"] for b in bounces)

# -------------------------------------------------------------
# 9. CONTROLLED REVEAL TESTS (UNAUTHORIZED VS AUTHORIZED)
# -------------------------------------------------------------
def test_unauthorized_reveal_denied_and_audited():
    """Verify MARKETING role attempting reveal returns 403 ACCESS_DENIED and audits."""
    resp = client.post(
        "/api/reveal",
        json={
            "subject_id": "C001",
            "field": "EMAIL",
            "purpose": "CUSTOMER_SUPPORT",
            "reference": "TICKET-UNAUTH"
        },
        headers={"X-User-Role": "MARKETING", "X-User-Id": "sneaky_marketing"}
    )
    assert resp.status_code == 403
    assert "ACCESS_DENIED" in resp.text

    # Verify audit recorded ACCESS_DENIED
    audit_resp = client.get("/api/audit?action=REVEAL&result=ACCESS_DENIED")
    assert audit_resp.status_code == 200
    records = audit_resp.json()
    assert any(r["actor"] == "sneaky_marketing" and r["result"] == "ACCESS_DENIED" for r in records)

def test_authorized_reveal_granted_and_audited():
    """Verify CUSTOMER_SUPPORT role with valid purpose and reference is granted and audited."""
    resp = client.post(
        "/api/reveal",
        json={
            "subject_id": "C001",
            "field": "EMAIL",
            "purpose": "CUSTOMER_SUPPORT",
            "reference": "TICKET-1091"
        },
        headers={"X-User-Role": "CUSTOMER_SUPPORT", "X-User-Id": "support_rep_mary"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ALLOWED"
    assert data["plaintext"] == "john@example.com"

    # Verify audit recorded ALLOWED
    audit_resp = client.get("/api/audit?action=REVEAL&result=ALLOWED")
    assert audit_resp.status_code == 200
    records = audit_resp.json()
    assert any(r["actor"] == "support_rep_mary" and r["result"] == "ALLOWED" and r["reference"] == "TICKET-1091" for r in records)
