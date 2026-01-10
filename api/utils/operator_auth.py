"""
Operator authentication utilities.

Provides JWT token generation/verification and bcrypt PIN hashing for
the Operator View module. Operators authenticate separately from admin users.
"""

import jwt
import bcrypt
import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# HTTP Bearer token security scheme
security = HTTPBearer(auto_error=False)

# Token expiration (typical shift duration)
EXPIRES_HOURS = 8


def get_jwt_secret() -> str:
    """
    Get JWT secret from environment.

    Raises:
        RuntimeError: If JWT_SECRET is not set or is too short.
    """
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET environment variable is required")
    if len(secret) < 32:
        raise RuntimeError("JWT_SECRET must be at least 32 characters")
    return secret


# ============================================================================
# PIN HASHING
# ============================================================================

def hash_pin(pin: str) -> str:
    """
    Hash a PIN using bcrypt.

    Args:
        pin: The plaintext 4-6 digit PIN

    Returns:
        The bcrypt hash as a string
    """
    return bcrypt.hashpw(pin.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_pin(pin: str, pin_hash: str) -> bool:
    """
    Verify a PIN against its bcrypt hash.

    Args:
        pin: The plaintext PIN to verify
        pin_hash: The stored bcrypt hash

    Returns:
        True if the PIN matches, False otherwise
    """
    try:
        return bcrypt.checkpw(pin.encode('utf-8'), pin_hash.encode('utf-8'))
    except Exception:
        return False


# ============================================================================
# JWT TOKEN MANAGEMENT
# ============================================================================

def generate_operator_token(
    operator_id: str,
    company_id: str,
    operator_name: str,
    operation_type_id: Optional[str] = None
) -> str:
    """
    Generate a JWT token for an authenticated operator.

    Args:
        operator_id: UUID of the operator
        company_id: UUID of the company
        operator_name: Display name of the operator
        operation_type_id: Optional station/operation type they logged in at

    Returns:
        Signed JWT token string
    """
    payload = {
        "operator_id": operator_id,
        "company_id": company_id,
        "operator_name": operator_name,
        "operation_type_id": operation_type_id,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=EXPIRES_HOURS),
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm="HS256")


def verify_operator_token(token: str) -> dict:
    """
    Verify and decode an operator JWT token.

    Args:
        token: The JWT token string

    Returns:
        Decoded token payload

    Raises:
        HTTPException: If token is expired or invalid
    """
    try:
        return jwt.decode(token, get_jwt_secret(), algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_operator(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    FastAPI dependency to get the current authenticated operator.

    Usage:
        @app.get("/api/operator/jobs")
        async def get_jobs(operator: dict = Depends(get_current_operator)):
            company_id = operator["company_id"]
            ...

    Args:
        credentials: HTTP Bearer credentials from the request

    Returns:
        Decoded token payload containing operator_id, company_id, etc.

    Raises:
        HTTPException: If not authenticated or token is invalid
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return verify_operator_token(credentials.credentials)


def decode_token_without_verification(token: str) -> Optional[dict]:
    """
    Decode a token without verifying the signature.

    Useful for extracting claims from an expired token for logging purposes.
    DO NOT use for authentication decisions.

    Args:
        token: The JWT token string

    Returns:
        Decoded payload or None if token is malformed
    """
    try:
        return jwt.decode(token, options={"verify_signature": False})
    except Exception:
        return None
