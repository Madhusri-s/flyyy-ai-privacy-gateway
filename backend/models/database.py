import datetime
import json
from typing import Generator
from sqlalchemy import (
    create_engine, Column, String, Integer, DateTime, Text, Boolean, Float
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.config.settings import settings

# -------------------------------------------------------------
# SEPARATE ENGINES & BASES FOR PHYSICAL/LOGICAL ISOLATION
# -------------------------------------------------------------

# 1. Source Database Engine
engine_source = create_engine(
    settings.SOURCE_DB_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.SOURCE_DB_URL else {}
)
SessionSource = sessionmaker(autocommit=False, autoflush=False, bind=engine_source)
BaseSource = declarative_base()

# 2. Protected Database Engine (Used by downstream applications)
engine_protected = create_engine(
    settings.PROTECTED_DB_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.PROTECTED_DB_URL else {}
)
SessionProtected = sessionmaker(autocommit=False, autoflush=False, bind=engine_protected)
BaseProtected = declarative_base()

# 3. Secure Vault Engine (Accessible ONLY by Privacy Gateway)
engine_vault = create_engine(
    settings.VAULT_DB_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.VAULT_DB_URL else {}
)
SessionVault = sessionmaker(autocommit=False, autoflush=False, bind=engine_vault)
BaseVault = declarative_base()

# 4. Policy Store Engine
engine_policy = create_engine(
    settings.POLICY_DB_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.POLICY_DB_URL else {}
)
SessionPolicy = sessionmaker(autocommit=False, autoflush=False, bind=engine_policy)
BasePolicy = declarative_base()

# 5. Audit Store Engine
engine_audit = create_engine(
    settings.AUDIT_DB_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.AUDIT_DB_URL else {}
)
SessionAudit = sessionmaker(autocommit=False, autoflush=False, bind=engine_audit)
BaseAudit = declarative_base()

# 6. Batch Telemetry Engine
engine_batch = create_engine(
    settings.BATCH_DB_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.BATCH_DB_URL else {}
)
SessionBatch = sessionmaker(autocommit=False, autoflush=False, bind=engine_batch)
BaseBatch = declarative_base()


# -------------------------------------------------------------
# 1. SOURCE DATABASE MODELS
# -------------------------------------------------------------
class SourceCustomer(BaseSource):
    __tablename__ = "source_customers"

    customer_id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    mobile = Column(String(64), nullable=False, index=True)
    city = Column(String(128), nullable=True)
    segment = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# -------------------------------------------------------------
# 2. PROTECTED DATABASE MODELS (DOWNSTREAM CONSUMPTION)
# -------------------------------------------------------------
class ProtectedCustomer(BaseProtected):
    __tablename__ = "protected_customers"

    customer_id = Column(String(64), primary_key=True, index=True)
    name_token = Column(String(64), nullable=False, index=True)
    email_token = Column(String(64), nullable=False, index=True)
    mobile_fpe = Column(String(64), nullable=False, index=True)
    city = Column(String(128), nullable=True)
    segment = Column(String(64), nullable=True)
    protection_status = Column(String(32), default="PROTECTED")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class ProtectedBounceEvent(BaseProtected):
    __tablename__ = "bounce_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    recipient = Column(String(64), nullable=False, index=True)  # Strictly EMAIL_xxxx token
    event = Column(String(32), default="BOUNCE")
    reason = Column(String(255), nullable=True)
    received_at = Column(DateTime, default=datetime.datetime.utcnow)


# -------------------------------------------------------------
# 3. SECURE VAULT MODELS (GATEWAY ACCESS ONLY)
# -------------------------------------------------------------
class VaultMapping(BaseVault):
    __tablename__ = "secure_vault_mappings"

    token = Column(String(128), primary_key=True, index=True)
    encrypted_original = Column(Text, nullable=False)
    nonce = Column(String(64), nullable=False)
    field_type = Column(String(32), nullable=False)  # EMAIL, NAME, PHONE, etc.
    key_reference = Column(String(64), default="v1_aesgcm")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# -------------------------------------------------------------
# 4. POLICY STORE MODELS
# -------------------------------------------------------------
class ProtectionPolicy(BasePolicy):
    __tablename__ = "protection_policies"

    field_name = Column(String(64), primary_key=True)
    detected_entity = Column(String(64), nullable=False)
    sensitivity = Column(String(32), default="HIGH")  # HIGH, MEDIUM, LOW
    action = Column(String(32), nullable=False)  # FPE, TOKENIZE, ENCRYPT, KEEP
    format_rule = Column(String(64), nullable=True)  # e.g., 10_DIGITS, 8_ALNUM, TOKEN_PREFIX
    is_deterministic = Column(Boolean, default=True)
    version = Column(Integer, default=1)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


# -------------------------------------------------------------
# 5. AUDIT STORE MODELS (IMMUTABLE AUDIT TRAIL)
# -------------------------------------------------------------
class AuditRecord(BaseAudit):
    __tablename__ = "audit_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    actor = Column(String(64), nullable=False, index=True)
    role = Column(String(32), nullable=False)
    action = Column(String(64), nullable=False)  # REVEAL, SEND_EMAIL, BOUNCE_CALLBACK, BATCH_PROTECT, POLICY_UPDATE
    protected_subject = Column(String(64), nullable=True, index=True)  # e.g., C001 or EMAIL_P91QZ
    field = Column(String(32), nullable=True)  # e.g., EMAIL, MOBILE
    purpose = Column(String(64), nullable=True)  # e.g., CUSTOMER_SUPPORT, FRAUD_INVESTIGATION
    reference = Column(String(128), nullable=True)  # e.g., TICKET-1091
    result = Column(String(32), nullable=False)  # ALLOWED, ACCESS_DENIED, SUCCESS, ERROR
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    metadata_json = Column(Text, nullable=True)


# -------------------------------------------------------------
# 6. BATCH METADATA & TELEMETRY MODELS
# -------------------------------------------------------------
class BatchRecord(BaseBatch):
    __tablename__ = "batch_records"

    batch_id = Column(String(64), primary_key=True, index=True)
    source_name = Column(String(128), default="source_customers")
    status = Column(String(32), default="PENDING")  # PENDING, RUNNING, COMPLETED, FAILED
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    batch_size = Column(Integer, default=100)
    total_rows = Column(Integer, default=0)
    processed_count = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    error_details_json = Column(Text, nullable=True)  # Sanitized error summaries only


class InAppMailboxMessage(BaseBatch):
    __tablename__ = "inbox_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    recipient = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    campaign_id = Column(String(64), nullable=True)
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)


# -------------------------------------------------------------
# DATABASE INITIALIZATION
# -------------------------------------------------------------
def init_all_databases():
    """Initializes all physical/logical databases and tables."""
    BaseSource.metadata.create_all(bind=engine_source)
    BaseProtected.metadata.create_all(bind=engine_protected)
    BaseVault.metadata.create_all(bind=engine_vault)
    BasePolicy.metadata.create_all(bind=engine_policy)
    BaseAudit.metadata.create_all(bind=engine_audit)
    BaseBatch.metadata.create_all(bind=engine_batch)


# -------------------------------------------------------------
# DEPENDENCY INJECTION SESSIONS
# -------------------------------------------------------------
def get_source_db() -> Generator[Session, None, None]:
    db = SessionSource()
    try:
        yield db
    finally:
        db.close()

def get_protected_db() -> Generator[Session, None, None]:
    db = SessionProtected()
    try:
        yield db
    finally:
        db.close()

def get_vault_db() -> Generator[Session, None, None]:
    db = SessionVault()
    try:
        yield db
    finally:
        db.close()

def get_policy_db() -> Generator[Session, None, None]:
    db = SessionPolicy()
    try:
        yield db
    finally:
        db.close()

def get_audit_db() -> Generator[Session, None, None]:
    db = SessionAudit()
    try:
        yield db
    finally:
        db.close()

def get_batch_db() -> Generator[Session, None, None]:
    db = SessionBatch()
    try:
        yield db
    finally:
        db.close()
