import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"

class Settings:
    def __init__(self):
        # Load .env file manually if exists
        self._load_env_file()

        self.PORT = int(os.getenv("PORT", "8000"))
        self.HOST = os.getenv("HOST", "127.0.0.1")
        self.DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1")

        # Cryptographic Keys
        self.FPE_KEY_HEX = os.getenv("FPE_KEY", "d904aaa45261276ea7cb68aed5c5011e")
        self.VAULT_MASTER_KEY_HEX = os.getenv("VAULT_MASTER_KEY", "ebe884cd15c137ba5c04dc969866a0b5738c1356032a799913dbb74ebdcef1f6")
        self.HMAC_SALT_HEX = os.getenv("HMAC_SALT", "2f1e8831e4444903be9b089fe6270f01")
        self.JWT_SECRET = os.getenv("JWT_SECRET", "b90172079e94942cd34d10ad81b2ff29b9d5c1e37af3171f92db754256af7b8f")

        # Ensure keys are valid byte lengths
        self.FPE_KEY_BYTES = bytes.fromhex(self.FPE_KEY_HEX)
        self.VAULT_KEY_BYTES = bytes.fromhex(self.VAULT_MASTER_KEY_HEX)
        self.HMAC_SALT_BYTES = bytes.fromhex(self.HMAC_SALT_HEX)

        # Separate Database URLs
        DATA_DIR = BASE_DIR / "backend" / "data"
        DATA_DIR.mkdir(parents=True, exist_ok=True)

        self.SOURCE_DB_URL = os.getenv("SOURCE_DB_URL", f"sqlite:///{DATA_DIR / 'source.db'}")
        self.PROTECTED_DB_URL = os.getenv("PROTECTED_DB_URL", f"sqlite:///{DATA_DIR / 'protected.db'}")
        self.VAULT_DB_URL = os.getenv("VAULT_DB_URL", f"sqlite:///{DATA_DIR / 'vault.db'}")
        self.POLICY_DB_URL = os.getenv("POLICY_DB_URL", f"sqlite:///{DATA_DIR / 'policy.db'}")
        self.AUDIT_DB_URL = os.getenv("AUDIT_DB_URL", f"sqlite:///{DATA_DIR / 'audit.db'}")
        self.BATCH_DB_URL = os.getenv("BATCH_DB_URL", f"sqlite:///{DATA_DIR / 'batch.db'}")

        # Email & Mailbox
        self.SMTP_HOST = os.getenv("SMTP_HOST", "127.0.0.1")
        self.SMTP_PORT = int(os.getenv("SMTP_PORT", "1025"))
        self.MAILBOX_ENABLED = os.getenv("MAILBOX_ENABLED", "True").lower() in ("true", "1")

    def _load_env_file(self):
        if ENV_FILE.exists():
            with open(ENV_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip())

settings = Settings()
