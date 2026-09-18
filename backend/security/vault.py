import datetime
from typing import Optional
from sqlalchemy.orm import Session
from backend.models.database import VaultMapping
from backend.security.crypto import crypto_engine

class VaultService:
    """
    Secure Vault repository.
    Isolated from downstream applications.
    Stores token <-> encrypted_original with AES-256-GCM at rest.
    """

    def store_mapping(
        self,
        token: str,
        plaintext: str,
        field_type: str,
        session: Session
    ) -> VaultMapping:
        """
        Encrypts plaintext with AES-256-GCM and persists the mapping.
        If mapping for this token already exists, updates it (idempotency).
        """
        ciphertext_b64, nonce_b64 = crypto_engine.encrypt_vault_payload(plaintext)

        existing = session.query(VaultMapping).filter(VaultMapping.token == token).first()
        if existing:
            existing.encrypted_original = ciphertext_b64
            existing.nonce = nonce_b64
            existing.field_type = field_type
            existing.created_at = datetime.datetime.utcnow()
            session.commit()
            return existing

        mapping = VaultMapping(
            token=token,
            encrypted_original=ciphertext_b64,
            nonce=nonce_b64,
            field_type=field_type,
            key_reference="v1_aes256gcm",
            created_at=datetime.datetime.utcnow()
        )
        session.add(mapping)
        session.commit()
        return mapping

    def resolve_token(self, token: str, session: Session) -> Optional[str]:
        """
        Resolves a protected token back to its original plaintext value.
        Only invoked by the Privacy Gateway under strict authorization.
        """
        mapping = session.query(VaultMapping).filter(VaultMapping.token == token).first()
        if not mapping:
            return None

        return crypto_engine.decrypt_vault_payload(
            mapping.encrypted_original,
            mapping.nonce
        )

    def reverse_resolve_email(self, email: str, session: Session) -> Optional[str]:
        """
        Reverse-resolves a plaintext email (from trusted provider callback) to its protected token.
        Uses deterministic token generation to query the vault.
        """
        expected_token = crypto_engine.tokenize_email(email)
        mapping = session.query(VaultMapping).filter(VaultMapping.token == expected_token).first()
        if mapping:
            return mapping.token

        # Fallback: scan vault entries for field_type == 'EMAIL' if salt or hashing differs
        all_emails = session.query(VaultMapping).filter(VaultMapping.field_type == "EMAIL").all()
        for m in all_emails:
            decrypted = crypto_engine.decrypt_vault_payload(m.encrypted_original, m.nonce)
            if decrypted.strip().lower() == email.strip().lower():
                return m.token

        return None

    def get_vault_count(self, session: Session) -> int:
        return session.query(VaultMapping).count()

vault_service = VaultService()
