"""
Pydantic models for Operator View module.

Handles operator authentication, sessions, and admin CRUD operations.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, field_validator
import re


# ============================================================================
# OPERATOR AUTHENTICATION
# ============================================================================

class OperatorLoginRequest(BaseModel):
    """Request body for operator login via PIN or QR badge."""
    company_id: str
    pin: Optional[str] = None  # 4-6 digits
    qr_code_id: Optional[str] = None
    operation_type_id: Optional[str] = None  # Station from QR code

    @field_validator('pin')
    @classmethod
    def validate_pin_format(cls, v):
        if v and not re.match(r'^\d{4,6}$', v):
            raise ValueError('PIN must be 4-6 digits')
        return v


class OperatorLoginResponse(BaseModel):
    """Response after successful operator login."""
    success: bool
    operator_id: str
    operator_name: str
    token: str
    expires_in_hours: int = 8
    # Note: Never return PIN or pin_hash


# ============================================================================
# OPERATOR CRUD (Admin)
# ============================================================================

class OperatorCreate(BaseModel):
    """Request body for creating a new operator (admin)."""
    company_id: str
    name: str
    pin: str  # Will be hashed before storage
    qr_code_id: Optional[str] = None

    @field_validator('pin')
    @classmethod
    def validate_pin_format(cls, v):
        if not re.match(r'^\d{4,6}$', v):
            raise ValueError('PIN must be 4-6 digits')
        return v


class OperatorUpdate(BaseModel):
    """Request body for updating an operator (admin)."""
    name: Optional[str] = None
    pin: Optional[str] = None  # Will be hashed if provided
    qr_code_id: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator('pin')
    @classmethod
    def validate_pin_format(cls, v):
        if v and not re.match(r'^\d{4,6}$', v):
            raise ValueError('PIN must be 4-6 digits')
        return v


class OperatorResponse(BaseModel):
    """Response model for operator data (admin view)."""
    id: str
    company_id: str
    name: str
    qr_code_id: Optional[str]
    is_active: bool
    last_login_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    # Note: Never include pin or pin_hash


# ============================================================================
# JOB OPERATIONS
# ============================================================================

class JobStartRequest(BaseModel):
    """Request body for starting work on a job."""
    operation_type_id: str  # From station QR code


class JobStopRequest(BaseModel):
    """Request body for stopping work on a job."""
    notes: Optional[str] = None


class JobCompleteRequest(BaseModel):
    """Request body for completing a job operation."""
    notes: Optional[str] = None
    quantity_completed: Optional[int] = None
    quantity_scrapped: Optional[int] = None


# ============================================================================
# SESSIONS
# ============================================================================

class SessionResponse(BaseModel):
    """Response model for operator session data."""
    id: str
    operator_id: str
    job_id: str
    job_operation_id: Optional[str]
    operation_type_id: str
    started_at: datetime
    ended_at: Optional[datetime]
    notes: Optional[str]
    duration_seconds: Optional[int] = None  # Computed on response


class ActiveSessionResponse(BaseModel):
    """Response for active session with additional job details."""
    id: str
    operator_id: str
    job_id: str
    job_number: str
    job_operation_id: Optional[str]
    operation_name: Optional[str]
    operation_type_id: str
    started_at: datetime
    notes: Optional[str]


# ============================================================================
# JOB VIEWS
# ============================================================================

class OperatorJobResponse(BaseModel):
    """Job data as seen by operators."""
    id: str
    job_number: str
    customer_name: Optional[str]
    part_name: Optional[str]
    part_number: Optional[str]
    due_date: Optional[datetime]
    status: str
    quantity_ordered: Optional[int]
    quantity_completed: Optional[int]
    # Current operation for this station
    operation_id: Optional[str]
    operation_name: Optional[str]
    operation_status: Optional[str]
    # Who is currently working on this operation
    current_operator_name: Optional[str]


class OperatorJobDetailResponse(BaseModel):
    """Detailed job data for active job view."""
    id: str
    job_number: str
    customer_name: Optional[str]
    part_name: Optional[str]
    part_number: Optional[str]
    due_date: Optional[datetime]
    status: str
    quantity_ordered: Optional[int]
    quantity_completed: Optional[int]
    # Operation details
    operation_id: Optional[str]
    operation_name: Optional[str]
    operation_status: Optional[str]
    instructions: Optional[str]
    estimated_hours: Optional[float]
    # Active session info
    active_session_id: Optional[str]
    session_started_at: Optional[datetime]
    current_operator_id: Optional[str]
    current_operator_name: Optional[str]
