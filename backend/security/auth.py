import datetime
from typing import Optional, List
from fastapi import Header, HTTPException, status, Depends
import jwt
from backend.config.settings import settings

ROLES = ["ADMIN", "CUSTOMER_SUPPORT", "MARKETING", "AUDITOR"]

class UserContext:
    def __init__(self, user_id: str, role: str, email: Optional[str] = None):
        self.user_id = user_id
        self.role = role.upper()
        self.email = email

    def has_role(self, allowed_roles: List[str]) -> bool:
        return self.role in [r.upper() for r in allowed_roles]

def create_access_token(user_id: str, role: str, expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Generates a signed JWT token."""
    expire = datetime.datetime.utcnow() + (expires_delta or datetime.timedelta(hours=8))
    payload = {
        "sub": user_id,
        "role": role.upper(),
        "exp": expire,
        "iat": datetime.datetime.utcnow()
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

def get_current_user(
    authorization: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
) -> UserContext:
    """
    Extracts authenticated user context from either:
    1. Bearer JWT token in Authorization header
    2. Simulated role header (X-User-Role / X-User-Id) for flexible role-switching in prototype
    """
    # 1. Bearer JWT
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
            user_id = payload.get("sub", "anonymous")
            role = payload.get("role", "MARKETING")
            return UserContext(user_id=user_id, role=role)
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token"
            )

    # 2. Role header for interactive UI switching
    if x_user_role:
        role = x_user_role.upper()
        if role not in ROLES:
            role = "MARKETING"
        user_id = x_user_id or f"{role.lower()}_user"
        return UserContext(user_id=user_id, role=role)

    # Default fallback for unauthenticated requests
    return UserContext(user_id="default_admin", role="ADMIN")

def require_roles(allowed_roles: List[str]):
    """Role-based authorization dependency."""
    def role_checker(current_user: UserContext = Depends(get_current_user)):
        if not current_user.has_role(allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"ACCESS_DENIED: Role '{current_user.role}' lacks permission for this operation"
            )
        return current_user
    return role_checker
