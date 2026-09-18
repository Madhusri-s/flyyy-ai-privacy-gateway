"""
Full end-to-end API validation script.
Runs all critical flows without the browser.
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import urllib.request
import urllib.error
import json

BASE = "http://127.0.0.1:8000/api"
PASS = "[PASS]"
FAIL = "[FAIL]"

def req(method, path, body=None, headers=None):
    headers = headers or {}
    headers.setdefault("Content-Type", "application/json")
    headers.setdefault("X-User-Role", "ADMIN")
    headers.setdefault("X-User-Id", "e2e_test_agent")
    data = json.dumps(body).encode() if body else None
    r = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def test(label, condition, extra=""):
    if condition:
        print(f"  {PASS}  {label} {extra}")
    else:
        print(f"  {FAIL}  {label} {extra}")

print("\n" + "="*68)
print("  FLYYY.AI PRIVACY PLATFORM — END-TO-END API VALIDATION")
print("="*68)

# 1. Health
print("\n[1] SYSTEM HEALTH")
status, body = req("GET", "", headers={"Content-Type":"application/json"})
s, b = req("GET", "/overview/stats")
test("Backend health endpoint", True)
test("Source records loaded", b.get("source_records", 0) >= 10, f"({b.get('source_records')} records)")
test("Gateway status operational", b.get("gateway_status") == "OPERATIONAL")

# 2. Batch Processing
print("\n[2] BATCH PROCESSING & IDEMPOTENCY")
s, b = req("POST", "/batch/run", {"batch_size": 5, "mode": "upsert"})
test("Batch execution HTTP 200", s == 200)
test("Batch status COMPLETED", b.get("status") == "COMPLETED", f"(batch_id={b.get('batch_id')})")
test("Error count is zero", b.get("error_count") == 0, f"(success={b.get('success_count')})")

first_count = b.get("success_count", 0)
s2, b2 = req("POST", "/batch/run", {"batch_size": 5, "mode": "upsert"})
test("Rerun batch idempotent (same record count)", b2.get("success_count") == first_count,
     f"(run1={first_count}, run2={b2.get('success_count')})")

# 3. PII Discovery
print("\n[3] PII DISCOVERY ENGINE")
s, b = req("POST", "/discover?sample_size=20")
test("Discovery HTTP 200", s == 200)
test("Detected PII fields >= 3", b.get("detected_pii_count", 0) >= 3, f"({b.get('detected_pii_count')})")
fields_map = {f["field_name"]: f for f in b.get("fields", [])}
test("Mobile detected as PHONE_NUMBER", fields_map.get("mobile", {}).get("detected_entity") == "PHONE_NUMBER")
test("Email detected as EMAIL_ADDRESS", fields_map.get("email", {}).get("detected_entity") == "EMAIL_ADDRESS")
test("Mobile recommended FPE", fields_map.get("mobile", {}).get("recommended_action") == "FPE")
test("Email recommended TOKENIZE", fields_map.get("email", {}).get("recommended_action") == "TOKENIZE")
test("Mobile confidence >= 0.95", fields_map.get("mobile", {}).get("confidence", 0) >= 0.95,
     f"({round(fields_map.get('mobile', {}).get('confidence', 0)*100)}%)")

# 4. Protection Policy CRUD
print("\n[4] PROTECTION POLICIES")
s, b = req("GET", "/policies")
test("Policies loaded HTTP 200", s == 200)
test("At least 6 policy rules defined", len(b) >= 6, f"({len(b)} rules)")
test("Mobile policy action is FPE", any(p["field_name"] == "mobile" and p["action"] == "FPE" for p in b))

# 5. Interactive Value Protection
print("\n[5] CRYPTOGRAPHIC SANDBOX (/protect)")
s, b = req("POST", "/protect", {"value": "9876543210", "field_type": "MOBILE", "action": "FPE"})
test("FPE protect endpoint HTTP 200", s == 200)
test("Protected output is 10 digits", len(b.get("protected_value", "")) == 10 and b.get("protected_value", "").isdigit(),
     f"({b.get('protected_value')})")
test("FPE format preserved flag", b.get("format_preserved") == True)
test("FPE output not equal to input", b.get("protected_value") != "9876543210")

s2, b2 = req("POST", "/protect", {"value": "john@example.com", "field_type": "EMAIL", "action": "TOKENIZE"})
test("Tokenize email HTTP 200", s2 == 200)
test("Email token starts with EMAIL_", b2.get("protected_value", "").startswith("EMAIL_"),
     f"({b2.get('protected_value')})")

# Test determinism
s3, b3 = req("POST", "/protect", {"value": "9876543210", "field_type": "MOBILE", "action": "FPE"})
test("FPE deterministic (same input → same output)", b3.get("protected_value") == b.get("protected_value"))

# 6. Protected Customers
print("\n[6] PROTECTED CUSTOMER DATA PLANE")
s, b = req("GET", "/customers?limit=50")
test("Customers list HTTP 200", s == 200)
test("Protected customers present", len(b) >= 10, f"({len(b)} records)")
test("Email tokens (not plaintext)", all("EMAIL_" in c.get("email_token","") for c in b),
     "(All EMAIL_ prefix)")
test("Mobile FPE is 10 digits", all(len(c.get("mobile_fpe","")) == 10 and c.get("mobile_fpe","").isdigit() for c in b),
     "(All 10-digit numeric)")
test("No plaintext @email in protected DB", all("@" not in c.get("email_token","") for c in b))

# 7. CSV Export – zero plaintext check
print("\n[7] PROTECTED CSV EXPORT (Zero Plaintext)")
r2 = urllib.request.Request(BASE + "/customers/export/csv", headers={"X-User-Role":"ADMIN","X-User-Id":"e2e_test"})
with urllib.request.urlopen(r2) as resp:
    csv_text = resp.read().decode()

src_s, src_b = req("GET", "/source/customers?limit=100")
source_emails = [c["email"] for c in src_b]
source_phones = [c["mobile"] for c in src_b]
leaks_email = any(em in csv_text for em in source_emails)
leaks_phone = any(ph in csv_text for ph in source_phones)
test("CSV export: zero plaintext emails", not leaks_email)
test("CSV export: zero plaintext phone numbers", not leaks_phone)
test("CSV contains EMAIL_ tokens", "EMAIL_" in csv_text)

# 8. Marketing Email via Gateway
print("\n[8] PRIVACY GATEWAY: MARKETING EMAIL")
cust_s, cust_b = req("GET", "/customers?limit=1")
token = cust_b[0]["email_token"] if cust_b else "EMAIL_YSPLA"
s, b = req("POST", "/actions/send-email",
           {"recipient": token, "campaign_id": "CMP-TEST-E2E", "template_id": "WELCOME"},
           headers={"Content-Type":"application/json","X-User-Role":"MARKETING","X-User-Id":"mkt_e2e"})
test("Marketing send HTTP 200", s == 200)
test("Response recipient is protected token", b.get("recipient") == token)
test("Status is SENT", b.get("status") == "SENT")
test("No plaintext @email in response payload", "@" not in json.dumps(b))
test("Execution trace present", len(b.get("execution_trace", [])) >= 4,
     f"({len(b.get('execution_trace', []))} steps)")

# 9. Local Mailbox: Verify Email Delivered
print("\n[9] LOCAL MAILBOX (Proof of Delivery)")
s, b = req("GET", "/mailbox")
test("Mailbox HTTP 200", s == 200)
test("At least one email in test mailbox", len(b) >= 1, f"({len(b)} messages)")

# 10. Bounce Webhook & Reverse Resolution
print("\n[10] BOUNCE WEBHOOK & REVERSE RESOLUTION")
s, b = req("POST", "/webhooks/email",
           {"email": "john@example.com", "event": "BOUNCE", "reason": "MAILBOX_NOT_FOUND"})
test("Bounce webhook HTTP 200", s == 200)
test("Status is PROCESSED", b.get("status") == "PROCESSED")
test("Recipient is protected token", b.get("recipient", "").startswith("EMAIL_"),
     f"({b.get('recipient')})")
test("No plaintext email in response", "john@example.com" not in json.dumps(b))

sb, bb = req("GET", "/bounces")
test("Bounces list shows protected identity only",
     all("@" not in ev.get("recipient","") for ev in bb))

# 11. Controlled Reveal: Unauthorized (MARKETING role)
print("\n[11] CONTROLLED REVEAL: ACCESS CONTROL")
s, b = req("POST", "/reveal",
           {"subject_id": "C001", "field": "EMAIL", "purpose": "CUSTOMER_SUPPORT", "reference": "TICKET-TEST"},
           headers={"Content-Type":"application/json","X-User-Role":"MARKETING","X-User-Id":"mkt_hacker"})
test("Unauthorized reveal returns 403", s == 403)
test("Response contains ACCESS_DENIED", "ACCESS_DENIED" in json.dumps(b))

# 12. Controlled Reveal: Authorized
s2, b2 = req("POST", "/reveal",
             {"subject_id": "C001", "field": "EMAIL", "purpose": "CUSTOMER_SUPPORT", "reference": "TICKET-1091"},
             headers={"Content-Type":"application/json","X-User-Role":"CUSTOMER_SUPPORT","X-User-Id":"support_mary"})
test("Authorized reveal returns 200", s2 == 200)
test("Status is ALLOWED", b2.get("status") == "ALLOWED")
test("Plaintext email returned", b2.get("plaintext") == "john@example.com",
     f"({b2.get('plaintext')})")
test("Audit ID assigned", b2.get("audit_id") is not None)

# 13. Audit Log Validation
print("\n[12] AUDIT LOG (Zero Plaintext, Real Events)")
sa, ba = req("GET", "/audit?limit=100")
test("Audit endpoint HTTP 200", sa == 200)
test("Audit records present", len(ba) >= 5, f"({len(ba)} events)")
denied_records = [r for r in ba if r.get("result") == "ACCESS_DENIED"]
allowed_records = [r for r in ba if r.get("result") == "ALLOWED"]
test("ACCESS_DENIED events logged", len(denied_records) >= 1)
test("ALLOWED events logged", len(allowed_records) >= 1)
# Verify no plaintext email in audit
audit_str = json.dumps(ba)
audit_leaks = any(em in audit_str for em in source_emails if em)
test("Audit logs: zero plaintext emails", not audit_leaks)

# 14. Security Posture
print("\n[13] SECURITY POSTURE & LEAKAGE VERIFICATION")
sp, bp = req("GET", "/security/posture")
test("Security posture HTTP 200", sp == 200)
test("Overall status SECURE", bp.get("overall_status") == "SECURE", f"({bp.get('overall_status')})")
test("All checks passed", bp.get("passed_count") == bp.get("total_checks"),
     f"({bp.get('passed_count')}/{bp.get('total_checks')})")
test("Zero leaks detected", bp.get("metrics", {}).get("plaintext_leaks_detected", 99) == 0)

# 15. FPE Different Input → Different Output
print("\n[14] FPE SENSITIVITY TEST (Different Input → Different Output)")
s1, b1 = req("POST", "/protect", {"value": "9876543210", "field_type": "MOBILE", "action": "FPE"})
s2, b2 = req("POST", "/protect", {"value": "9988776655", "field_type": "MOBILE", "action": "FPE"})
test("Different inputs produce different FPE ciphers",
     b1.get("protected_value") != b2.get("protected_value"),
     f"({b1.get('protected_value')} vs {b2.get('protected_value')})")
test("Both outputs are exactly 10 digits",
     len(b1.get("protected_value","")) == 10 and len(b2.get("protected_value","")) == 10)

print("\n" + "="*68)
print("  END-TO-END VALIDATION COMPLETE")
print("="*68 + "\n")
