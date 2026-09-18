from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field
import datetime

# -------------------------------------------------------------
# BATCH SCHEMAS
# -------------------------------------------------------------
class BatchRunRequest(BaseModel):
    batch_size: int = Field(default=100, ge=1, le=10000, description="Chunk size per batch iteration")
    mode: str = Field(default="upsert", description="Processing mode: upsert or append")

class BatchStatusResponse(BaseModel):
    batch_id: str
    source_name: str
    status: str
    start_time: Optional[datetime.datetime]
    end_time: Optional[datetime.datetime]
    batch_size: int
    total_rows: int
    processed_count: int
    success_count: int
    error_count: int
    error_details: Optional[List[str]] = None

    class Config:
        from_attributes = True

# -------------------------------------------------------------
# DISCOVERY SCHEMAS
# -------------------------------------------------------------
class FieldIntelligence(BaseModel):
    field_name: str
    data_type: str
    detected_entity: str
    confidence: float
    sensitivity: str
    sample_count: int
    recommended_action: str
    explanation: str

class DiscoverResponse(BaseModel):
    total_fields: int
    detected_pii_count: int
    fields: List[FieldIntelligence]

# -------------------------------------------------------------
# POLICY SCHEMAS
# -------------------------------------------------------------
class PolicyRule(BaseModel):
    field_name: str
    detected_entity: str
    sensitivity: str
    action: str  # FPE, TOKENIZE, ENCRYPT, KEEP
    format_rule: Optional[str] = None
    is_deterministic: bool = True
    version: int = 1

class PolicyUpdateRequest(BaseModel):
    rules: List[PolicyRule]

# -------------------------------------------------------------
# CUSTOMER SCHEMAS
# -------------------------------------------------------------
class ProtectedCustomerResponse(BaseModel):
    customer_id: str
    name_token: str
    email_token: str
    mobile_fpe: str
    city: Optional[str] = None
    segment: Optional[str] = None
    protection_status: str
    masked_name: Optional[str] = None
    masked_email: Optional[str] = None
    masked_mobile: Optional[str] = None
    updated_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

# -------------------------------------------------------------
# TEST VALUE PROTECTION SCHEMAS
# -------------------------------------------------------------
class ProtectTestRequest(BaseModel):
    value: str
    field_type: str  # MOBILE, EMAIL, NAME, NUMERIC_ID, ALPHANUMERIC
    action: str  # FPE, TOKENIZE, ENCRYPT, KEEP

class ProtectTestResponse(BaseModel):
    original_value_masked: str
    field_type: str
    action: str
    protected_value: str
    format_preserved: bool
    is_deterministic: bool

# -------------------------------------------------------------
# MARKETING SCHEMAS
# -------------------------------------------------------------
class SendEmailRequest(BaseModel):
    recipient: str = Field(..., description="Protected recipient identifier (e.g. EMAIL_P91QZ)")
    campaign_id: str = Field(default="CMP-1001", description="Marketing campaign ID")
    template_id: str = Field(default="WELCOME_OFFER", description="Template ID")

class TraceStep(BaseModel):
    stage: str
    status: str
    details: str
    timestamp: str

class SendEmailResponse(BaseModel):
    recipient: str  # Protected token only!
    status: str     # SENT
    message: str
    execution_trace: List[TraceStep]

# -------------------------------------------------------------
# BOUNCE WEBHOOK SCHEMAS
# -------------------------------------------------------------
class BounceWebhookRequest(BaseModel):
    email: str = Field(..., description="Plaintext email from trusted provider webhook")
    event: str = Field(default="BOUNCE")
    reason: str = Field(default="MAILBOX_NOT_FOUND")

class BounceWebhookResponse(BaseModel):
    status: str
    recipient: str  # Stored protected token
    event: str
    message: str

# -------------------------------------------------------------
# CONTROLLED REVEAL SCHEMAS
# -------------------------------------------------------------
class RevealRequest(BaseModel):
    subject_id: str = Field(..., description="Subject identifier (e.g. C001)")
    field: str = Field(..., description="Sensitive field requested (EMAIL, MOBILE, NAME)")
    purpose: str = Field(..., description="Declared business justification (CUSTOMER_SUPPORT, FRAUD_INVESTIGATION)")
    reference: str = Field(..., description="Tracking reference ID (e.g. TICKET-1091)")

class RevealResponse(BaseModel):
    status: str  # ALLOWED or ACCESS_DENIED
    subject_id: str
    field: str
    plaintext: Optional[str] = None
    purpose: str
    reference: str
    message: str
    audit_id: int

# -------------------------------------------------------------
# AUDIT LOG SCHEMAS
# -------------------------------------------------------------
class AuditRecordResponse(BaseModel):
    id: int
    actor: str
    role: str
    action: str
    protected_subject: Optional[str] = None
    field: Optional[str] = None
    purpose: Optional[str] = None
    reference: Optional[str] = None
    result: str
    timestamp: datetime.datetime
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# -------------------------------------------------------------
# SECURITY POSTURE SCHEMAS
# -------------------------------------------------------------
class PostureCheck(BaseModel):
    name: str
    category: str
    status: str  # PASS, WARNING, FAIL
    description: str
    details: str

class SecurityPostureResponse(BaseModel):
    overall_status: str
    passed_count: int
    total_checks: int
    checks: List[PostureCheck]
    metrics: Dict[str, Any]

# -------------------------------------------------------------
# MAILBOX SCHEMAS
# -------------------------------------------------------------
class MailboxMessageResponse(BaseModel):
    id: int
    recipient: str
    subject: str
    body: str
    campaign_id: Optional[str] = None
    sent_at: datetime.datetime

    class Config:
        from_attributes = True
