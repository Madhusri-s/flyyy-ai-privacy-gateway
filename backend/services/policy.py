import datetime
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from backend.models.database import ProtectionPolicy
from backend.schemas.schemas import PolicyRule

DEFAULT_POLICIES = [
    {
        "field_name": "mobile",
        "detected_entity": "PHONE_NUMBER",
        "sensitivity": "HIGH",
        "action": "FPE",
        "format_rule": "10_DIGITS",
        "is_deterministic": True,
        "version": 1
    },
    {
        "field_name": "email",
        "detected_entity": "EMAIL_ADDRESS",
        "sensitivity": "HIGH",
        "action": "TOKENIZE",
        "format_rule": "TOKEN_PREFIX",
        "is_deterministic": True,
        "version": 1
    },
    {
        "field_name": "name",
        "detected_entity": "PERSON",
        "sensitivity": "HIGH",
        "action": "TOKENIZE",
        "format_rule": "TOKEN_PREFIX",
        "is_deterministic": True,
        "version": 1
    },
    {
        "field_name": "customer_id",
        "detected_entity": "IDENTIFIER",
        "sensitivity": "MEDIUM",
        "action": "KEEP",
        "format_rule": "ORIGINAL",
        "is_deterministic": True,
        "version": 1
    },
    {
        "field_name": "city",
        "detected_entity": "LOCATION",
        "sensitivity": "LOW",
        "action": "KEEP",
        "format_rule": "ORIGINAL",
        "is_deterministic": True,
        "version": 1
    },
    {
        "field_name": "segment",
        "detected_entity": "BUSINESS_SEGMENT",
        "sensitivity": "LOW",
        "action": "KEEP",
        "format_rule": "ORIGINAL",
        "is_deterministic": True,
        "version": 1
    }
]

class PolicyService:
    """
    Manages active protection policies persisted in the policy database.
    """

    def initialize_defaults(self, session: Session):
        """Seeds default protection policies if table is empty."""
        count = session.query(ProtectionPolicy).count()
        if count == 0:
            for item in DEFAULT_POLICIES:
                policy = ProtectionPolicy(
                    field_name=item["field_name"],
                    detected_entity=item["detected_entity"],
                    sensitivity=item["sensitivity"],
                    action=item["action"],
                    format_rule=item["format_rule"],
                    is_deterministic=item["is_deterministic"],
                    version=item["version"],
                    updated_at=datetime.datetime.utcnow()
                )
                session.add(policy)
            session.commit()

    def get_all_policies(self, session: Session) -> List[ProtectionPolicy]:
        self.initialize_defaults(session)
        return session.query(ProtectionPolicy).all()

    def get_policy_map(self, session: Session) -> Dict[str, str]:
        """Returns a dict mapping: {field_name: action}, e.g. {'mobile': 'FPE', 'email': 'TOKENIZE'}"""
        policies = self.get_all_policies(session)
        return {p.field_name: p.action.upper() for p in policies}

    def update_policies(self, rules: List[PolicyRule], session: Session) -> List[ProtectionPolicy]:
        """Updates and persists protection policies."""
        for rule in rules:
            existing = session.query(ProtectionPolicy).filter(ProtectionPolicy.field_name == rule.field_name).first()
            if existing:
                existing.action = rule.action.upper()
                existing.detected_entity = rule.detected_entity
                existing.sensitivity = rule.sensitivity
                existing.format_rule = rule.format_rule
                existing.is_deterministic = rule.is_deterministic
                existing.version = existing.version + 1
                existing.updated_at = datetime.datetime.utcnow()
            else:
                new_policy = ProtectionPolicy(
                    field_name=rule.field_name,
                    detected_entity=rule.detected_entity,
                    sensitivity=rule.sensitivity,
                    action=rule.action.upper(),
                    format_rule=rule.format_rule,
                    is_deterministic=rule.is_deterministic,
                    version=1,
                    updated_at=datetime.datetime.utcnow()
                )
                session.add(new_policy)
        session.commit()
        return session.query(ProtectionPolicy).all()

policy_service = PolicyService()
