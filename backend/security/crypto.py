import base64
import hashlib
import hmac
import os
import re
from typing import Optional, Tuple
import pyffx
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from backend.config.settings import settings

class CryptoEngine:
    """
    Production-grade cryptographic engine providing:
    1. Vetted Format-Preserving Encryption (FF1 via pyffx)
    2. Deterministic cryptographic tokenization (HMAC-SHA256)
    3. Authenticated encryption at rest (AES-256-GCM) for vault mappings
    4. Display masking utilities
    """

    def __init__(self):
        # 16-byte key for FPE
        self.fpe_key = settings.FPE_KEY_BYTES
        # 32-byte key for AES-GCM
        self.vault_key = settings.VAULT_KEY_BYTES
        # Salt for HMAC tokenization
        self.hmac_salt = settings.HMAC_SALT_BYTES
        self.aesgcm = AESGCM(self.vault_key)

        # Pre-initialize FPE ciphers for standard formats
        self._phone_fpe = pyffx.Integer(self.fpe_key, length=10)
        self._num_id_fpe = pyffx.Integer(self.fpe_key, length=8)
        self._alnum_fpe = pyffx.String(
            self.fpe_key,
            alphabet="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            length=8
        )

    # -------------------------------------------------------------
    # 1. FORMAT-PRESERVING ENCRYPTION (FPE)
    # -------------------------------------------------------------

    def encrypt_phone_fpe(self, phone: str) -> str:
        """
        Encrypts a 10-digit phone number using FF1 FPE.
        Preserves exactly 10 numeric digits.
        """
        # Normalize: extract last 10 digits if formatted with country code
        digits = re.sub(r"\D", "", str(phone))
        if len(digits) < 10:
            digits = digits.zfill(10)
        elif len(digits) > 10:
            digits = digits[-10:]

        val_int = int(digits)
        encrypted_int = self._phone_fpe.encrypt(val_int)
        return str(encrypted_int).zfill(10)

    def decrypt_phone_fpe(self, encrypted_phone: str) -> str:
        """Decrypts a 10-digit phone number using FF1 FPE."""
        val_int = int(re.sub(r"\D", "", str(encrypted_phone)).zfill(10))
        decrypted_int = self._phone_fpe.decrypt(val_int)
        return str(decrypted_int).zfill(10)

    def encrypt_numeric_id_fpe(self, num_id: str) -> str:
        """Encrypts an 8-digit numeric identifier using FF1 FPE."""
        digits = re.sub(r"\D", "", str(num_id)).zfill(8)[-8:]
        val_int = int(digits)
        encrypted_int = self._num_id_fpe.encrypt(val_int)
        return str(encrypted_int).zfill(8)

    def decrypt_numeric_id_fpe(self, encrypted_id: str) -> str:
        """Decrypts an 8-digit numeric identifier using FF1 FPE."""
        digits = re.sub(r"\D", "", str(encrypted_id)).zfill(8)[-8:]
        val_int = int(digits)
        decrypted_int = self._num_id_fpe.decrypt(val_int)
        return str(decrypted_int).zfill(8)

    def encrypt_alphanumeric_fpe(self, code: str) -> str:
        """Encrypts an 8-character uppercase alphanumeric code using FF1 FPE."""
        clean = re.sub(r"[^0-9A-Za-z]", "", str(code)).upper().ljust(8, "X")[:8]
        return self._alnum_fpe.encrypt(clean)

    def decrypt_alphanumeric_fpe(self, encrypted_code: str) -> str:
        """Decrypts an 8-character uppercase alphanumeric code using FF1 FPE."""
        clean = re.sub(r"[^0-9A-Za-z]", "", str(encrypted_code)).upper().ljust(8, "X")[:8]
        return self._alnum_fpe.decrypt(clean)

    # -------------------------------------------------------------
    # 2. DETERMINISTIC TOKENIZATION
    # -------------------------------------------------------------

    def generate_token(self, value: str, prefix: str = "TOK", length: int = 5) -> str:
        """
        Generates a deterministic cryptographic token for a given value.
        Preserves referential usability across batches.
        E.g., generate_token("john@example.com", "EMAIL", 5) -> "EMAIL_P91QZ"
        """
        canonical = str(value).strip().lower().encode("utf-8")
        h = hmac.new(self.hmac_salt, canonical, hashlib.sha256).digest()
        
        # Convert bytes to base32 uppercase (A-Z, 2-7) for clean readability
        b32 = base64.b32encode(h).decode("ascii").replace("=", "")
        token_body = b32[:length]
        return f"{prefix}_{token_body}"

    def tokenize_email(self, email: str) -> str:
        return self.generate_token(email, prefix="EMAIL", length=5)

    def tokenize_name(self, name: str) -> str:
        return self.generate_token(name, prefix="NAME", length=4)

    def tokenize_generic(self, value: str, prefix: str = "TKN") -> str:
        return self.generate_token(value, prefix=prefix, length=6)

    # -------------------------------------------------------------
    # 3. AUTHENTICATED AES-256-GCM ENCRYPTION (VAULT AT REST)
    # -------------------------------------------------------------

    def encrypt_vault_payload(self, plaintext: str) -> Tuple[str, str]:
        """
        Encrypts a sensitive plaintext string for secure vault storage.
        Returns: (b64_ciphertext_with_tag, b64_nonce)
        """
        nonce = os.urandom(12)  # Standard 96-bit nonce for AES-GCM
        ciphertext_tag = self.aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
        return (
            base64.b64encode(ciphertext_tag).decode("utf-8"),
            base64.b64encode(nonce).decode("utf-8")
        )

    def decrypt_vault_payload(self, b64_ciphertext: str, b64_nonce: str) -> str:
        """
        Decrypts an AES-256-GCM encrypted payload from the vault.
        """
        ciphertext_tag = base64.b64decode(b64_ciphertext.encode("utf-8"))
        nonce = base64.b64decode(b64_nonce.encode("utf-8"))
        plaintext_bytes = self.aesgcm.decrypt(nonce, ciphertext_tag, None)
        return plaintext_bytes.decode("utf-8")

    # -------------------------------------------------------------
    # 4. DISPLAY MASKING (DISPLAY-ONLY)
    # -------------------------------------------------------------

    @staticmethod
    def mask_email(email: str) -> str:
        """Dynamic display masking for emails: e.g. j***n@example.com"""
        if not email or "@" not in email:
            return "******"
        parts = email.split("@", 1)
        local = parts[0]
        domain = parts[1]
        if len(local) <= 2:
            masked_local = local[0] + "***"
        else:
            masked_local = local[0] + ("*" * (len(local) - 2)) + local[-1]
        return f"{masked_local}@{domain}"

    @staticmethod
    def mask_phone(phone: str) -> str:
        """Dynamic display masking for phone numbers: e.g. 98******10"""
        digits = re.sub(r"\D", "", str(phone))
        if len(digits) < 4:
            return "******"
        return digits[:2] + ("*" * (len(digits) - 4)) + digits[-2:]

    @staticmethod
    def mask_name(name: str) -> str:
        """Dynamic display masking for names: e.g. J*** S***"""
        parts = name.strip().split()
        if not parts:
            return "***"
        masked_parts = []
        for p in parts:
            if len(p) <= 1:
                masked_parts.append(p + "*")
            else:
                masked_parts.append(p[0] + ("*" * (len(p) - 1)))
        return " ".join(masked_parts)

crypto_engine = CryptoEngine()
