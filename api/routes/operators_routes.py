"""
Operator routes for the Operator View module.

Provides:
- Operator authentication (PIN/QR badge login)
- Job listing and filtering for operators
- Session management (start/stop/complete work)
- PIN hashing utility for admin frontend

Note: Admin CRUD operations (create, update, delete operators) are done
directly via Supabase from the frontend, matching the pattern used for
customers, parts, and jobs.
"""

import logging
from datetime import datetime
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Depends, Query
from supabase import Client

from models.operators_models import (
    OperatorLoginRequest,
    OperatorLoginResponse,
    PinHashRequest,
    PinHashResponse,
    JobStartRequest,
    JobStopRequest,
    JobCompleteRequest,
    SessionResponse,
    ActiveSessionResponse,
    OperatorJobResponse,
    OperatorJobDetailResponse,
)
from utils.operator_auth import (
    hash_pin,
    verify_pin,
    generate_operator_token,
    get_current_operator,
)

logger = logging.getLogger(__name__)

# Create routers
operator_router = APIRouter(prefix="/api/operator", tags=["operator"])
admin_router = APIRouter(prefix="/api/operators", tags=["operators-admin"])


def get_supabase() -> Client:
    """Get the Supabase client from the main app."""
    from index import supabase
    if supabase is None:
        raise HTTPException(status_code=503, detail="Database not available")
    return supabase


# ============================================================================
# OPERATOR AUTHENTICATION
# ============================================================================

@operator_router.post("/login", response_model=OperatorLoginResponse)
async def operator_login(request: OperatorLoginRequest):
    """
    Authenticate an operator via PIN or QR badge.

    Either pin or qr_code_id must be provided.
    Returns a JWT token valid for 8 hours.
    """
    supabase = get_supabase()

    if not request.pin and not request.qr_code_id:
        raise HTTPException(
            status_code=400,
            detail="Either PIN or QR code ID must be provided"
        )

    try:
        if request.qr_code_id:
            # QR badge authentication
            result = supabase.table("operators").select("*").eq(
                "company_id", request.company_id
            ).eq("qr_code_id", request.qr_code_id).eq("is_active", True).execute()

            if not result.data:
                raise HTTPException(status_code=401, detail="Invalid badge")

            operator = result.data[0]
        else:
            # PIN authentication - fetch all active operators for company and verify
            result = supabase.table("operators").select("*").eq(
                "company_id", request.company_id
            ).eq("is_active", True).execute()

            if not result.data:
                raise HTTPException(status_code=401, detail="Invalid PIN")

            # Find operator with matching PIN
            operator = None
            for op in result.data:
                if verify_pin(request.pin, op["pin_hash"]):
                    operator = op
                    break

            if not operator:
                raise HTTPException(status_code=401, detail="Invalid PIN")

        # Update last login time
        supabase.table("operators").update({
            "last_login_at": datetime.utcnow().isoformat()
        }).eq("id", operator["id"]).execute()

        # Generate JWT token
        token = generate_operator_token(
            operator_id=operator["id"],
            company_id=operator["company_id"],
            operator_name=operator["name"],
            operation_type_id=request.operation_type_id
        )

        return OperatorLoginResponse(
            success=True,
            operator_id=operator["id"],
            operator_name=operator["name"],
            token=token,
            expires_in_hours=8
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Operator login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")


@operator_router.post("/logout")
async def operator_logout(operator: dict = Depends(get_current_operator)):
    """
    End the operator session.

    This endpoint is mainly for logging purposes.
    The client should remove the token from localStorage.
    """
    logger.info(f"Operator {operator['operator_id']} logged out")
    return {"success": True, "message": "Logged out successfully"}


# ============================================================================
# OPERATOR JOB VIEWS
# ============================================================================

@operator_router.get("/jobs", response_model=list[OperatorJobResponse])
async def get_operator_jobs(
    operation_type_id: Optional[str] = Query(None),
    operator: dict = Depends(get_current_operator)
):
    """
    Get list of jobs available for the operator.

    If operation_type_id is provided, filters to jobs that have operations
    of that type that are pending or in progress.
    """
    supabase = get_supabase()
    company_id = operator["company_id"]

    try:
        # Build base query for jobs
        query = supabase.table("jobs").select(
            "id, job_number, due_date, status, quantity_ordered, quantity_completed, "
            "customers(name), parts(name, part_number)"
        ).eq("company_id", company_id).in_(
            "status", ["pending", "in_progress", "released"]
        )

        result = query.order("due_date", desc=False).execute()

        if not result.data:
            return []

        jobs = []
        for job in result.data:
            job_id = job["id"]

            # Get operations for this job
            ops_query = supabase.table("job_operations").select(
                "id, operation_name, status, operation_type_id"
            ).eq("job_id", job_id)

            if operation_type_id:
                ops_query = ops_query.eq("operation_type_id", operation_type_id)

            ops_result = ops_query.execute()

            # Skip jobs with no matching operations
            if operation_type_id and not ops_result.data:
                continue

            # Find the current operation for this station
            current_op = None
            for op in ops_result.data or []:
                if op["status"] in ["pending", "in_progress"]:
                    current_op = op
                    break

            # Check if someone is working on this operation
            current_operator_name = None
            if current_op:
                session_result = supabase.table("operator_sessions").select(
                    "operators(name)"
                ).eq("job_operation_id", current_op["id"]).is_(
                    "ended_at", "null"
                ).execute()

                if session_result.data:
                    current_operator_name = session_result.data[0].get("operators", {}).get("name")

            jobs.append(OperatorJobResponse(
                id=job["id"],
                job_number=job["job_number"],
                customer_name=job.get("customers", {}).get("name") if job.get("customers") else None,
                part_name=job.get("parts", {}).get("name") if job.get("parts") else None,
                part_number=job.get("parts", {}).get("part_number") if job.get("parts") else None,
                due_date=job.get("due_date"),
                status=job["status"],
                quantity_ordered=job.get("quantity_ordered"),
                quantity_completed=job.get("quantity_completed"),
                operation_id=current_op["id"] if current_op else None,
                operation_name=current_op["operation_name"] if current_op else None,
                operation_status=current_op["status"] if current_op else None,
                current_operator_name=current_operator_name
            ))

        return jobs

    except Exception as e:
        logger.error(f"Error fetching operator jobs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch jobs")


@operator_router.get("/jobs/{job_id}", response_model=OperatorJobDetailResponse)
async def get_operator_job_detail(
    job_id: str,
    operation_type_id: Optional[str] = Query(None),
    operator: dict = Depends(get_current_operator)
):
    """Get detailed job information for the operator."""
    supabase = get_supabase()
    company_id = operator["company_id"]

    try:
        # Get job details
        result = supabase.table("jobs").select(
            "id, job_number, due_date, status, quantity_ordered, quantity_completed, "
            "customers(name), parts(name, part_number)"
        ).eq("id", job_id).eq("company_id", company_id).single().execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Job not found")

        job = result.data

        # Get operation for this job and station
        ops_query = supabase.table("job_operations").select(
            "id, operation_name, status, instructions, "
            "estimated_setup_hours, estimated_run_hours_per_unit, operation_type_id"
        ).eq("job_id", job_id)

        if operation_type_id:
            ops_query = ops_query.eq("operation_type_id", operation_type_id)

        ops_result = ops_query.execute()

        current_op = None
        for op in ops_result.data or []:
            if op["status"] in ["pending", "in_progress"]:
                current_op = op
                break

        # Get active session for this operation
        active_session = None
        current_operator_id = None
        current_operator_name = None
        session_started_at = None

        if current_op:
            session_result = supabase.table("operator_sessions").select(
                "id, started_at, operator_id, operators(name)"
            ).eq("job_operation_id", current_op["id"]).is_(
                "ended_at", "null"
            ).execute()

            if session_result.data:
                session = session_result.data[0]
                active_session = session["id"]
                session_started_at = session["started_at"]
                current_operator_id = session["operator_id"]
                current_operator_name = session.get("operators", {}).get("name")

        # Calculate estimated hours
        estimated_hours = None
        if current_op:
            setup = float(current_op.get("estimated_setup_hours") or 0)
            run_per = float(current_op.get("estimated_run_hours_per_unit") or 0)
            qty = job.get("quantity_ordered") or 1
            estimated_hours = setup + (run_per * qty)

        return OperatorJobDetailResponse(
            id=job["id"],
            job_number=job["job_number"],
            customer_name=job.get("customers", {}).get("name") if job.get("customers") else None,
            part_name=job.get("parts", {}).get("name") if job.get("parts") else None,
            part_number=job.get("parts", {}).get("part_number") if job.get("parts") else None,
            due_date=job.get("due_date"),
            status=job["status"],
            quantity_ordered=job.get("quantity_ordered"),
            quantity_completed=job.get("quantity_completed"),
            operation_id=current_op["id"] if current_op else None,
            operation_name=current_op["operation_name"] if current_op else None,
            operation_status=current_op["status"] if current_op else None,
            instructions=current_op.get("instructions") if current_op else None,
            estimated_hours=estimated_hours,
            active_session_id=active_session,
            session_started_at=session_started_at,
            current_operator_id=current_operator_id,
            current_operator_name=current_operator_name
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job detail: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch job")


# ============================================================================
# SESSION MANAGEMENT
# ============================================================================

@operator_router.post("/jobs/{job_id}/start", response_model=SessionResponse)
async def start_job(
    job_id: str,
    request: JobStartRequest,
    operator: dict = Depends(get_current_operator)
):
    """
    Start working on a job.

    - Finds the matching job_operation for this job + operation_type
    - Auto-stops any existing active session for this operator
    - Creates a new session
    - Updates job_operation status to in_progress
    """
    supabase = get_supabase()
    operator_id = operator["operator_id"]
    company_id = operator["company_id"]

    try:
        # 1. Find the matching job_operation
        job_op_result = supabase.table("job_operations").select("*").eq(
            "job_id", job_id
        ).eq("operation_type_id", request.operation_type_id).in_(
            "status", ["pending", "in_progress"]
        ).execute()

        if not job_op_result.data:
            raise HTTPException(
                status_code=404,
                detail="No pending operation found for this job and station"
            )

        job_op = job_op_result.data[0]

        # 2. Auto-stop any existing active session for this operator
        existing = supabase.table("operator_sessions").select("*").eq(
            "operator_id", operator_id
        ).is_("ended_at", "null").execute()

        if existing.data:
            supabase.table("operator_sessions").update({
                "ended_at": datetime.utcnow().isoformat()
            }).eq("id", existing.data[0]["id"]).execute()

        # 3. Create new session
        session_id = str(uuid4())
        now = datetime.utcnow().isoformat()

        supabase.table("operator_sessions").insert({
            "id": session_id,
            "company_id": company_id,
            "operator_id": operator_id,
            "job_id": job_id,
            "job_operation_id": job_op["id"],
            "operation_type_id": request.operation_type_id,
            "started_at": now
        }).execute()

        # 4. Update job_operations to in_progress
        supabase.table("job_operations").update({
            "status": "in_progress",
            "started_at": now
        }).eq("id", job_op["id"]).execute()

        return SessionResponse(
            id=session_id,
            operator_id=operator_id,
            job_id=job_id,
            job_operation_id=job_op["id"],
            operation_type_id=request.operation_type_id,
            started_at=now,
            ended_at=None,
            notes=None
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting job: {e}")
        raise HTTPException(status_code=500, detail="Failed to start job")


@operator_router.post("/jobs/{job_id}/stop", response_model=SessionResponse)
async def stop_job(
    job_id: str,
    request: JobStopRequest = None,
    operator: dict = Depends(get_current_operator)
):
    """
    Stop (pause) work on a job.

    Ends the active session but does not mark the operation as complete.
    """
    supabase = get_supabase()
    operator_id = operator["operator_id"]

    try:
        # Find active session for this job
        session_result = supabase.table("operator_sessions").select("*").eq(
            "operator_id", operator_id
        ).eq("job_id", job_id).is_("ended_at", "null").execute()

        if not session_result.data:
            raise HTTPException(status_code=404, detail="No active session found")

        session = session_result.data[0]
        now = datetime.utcnow().isoformat()

        # End the session
        update_data = {"ended_at": now}
        if request and request.notes:
            update_data["notes"] = request.notes

        supabase.table("operator_sessions").update(update_data).eq(
            "id", session["id"]
        ).execute()

        # Calculate duration
        started = datetime.fromisoformat(session["started_at"].replace("Z", "+00:00"))
        ended = datetime.utcnow()
        duration = int((ended - started.replace(tzinfo=None)).total_seconds())

        return SessionResponse(
            id=session["id"],
            operator_id=operator_id,
            job_id=job_id,
            job_operation_id=session.get("job_operation_id"),
            operation_type_id=session["operation_type_id"],
            started_at=session["started_at"],
            ended_at=now,
            notes=request.notes if request else None,
            duration_seconds=duration
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error stopping job: {e}")
        raise HTTPException(status_code=500, detail="Failed to stop job")


@operator_router.post("/jobs/{job_id}/complete")
async def complete_job(
    job_id: str,
    request: JobCompleteRequest,
    operator: dict = Depends(get_current_operator)
):
    """
    Mark a job operation as complete.

    - Ends the active session
    - Marks the job_operation as completed
    - Updates job status if all operations are complete
    """
    supabase = get_supabase()
    operator_id = operator["operator_id"]

    try:
        # Find active session for this job
        session_result = supabase.table("operator_sessions").select("*").eq(
            "operator_id", operator_id
        ).eq("job_id", job_id).is_("ended_at", "null").execute()

        if not session_result.data:
            raise HTTPException(status_code=404, detail="No active session found")

        session = session_result.data[0]
        job_operation_id = session.get("job_operation_id")
        now = datetime.utcnow().isoformat()

        # 1. End the session
        supabase.table("operator_sessions").update({
            "ended_at": now,
            "notes": request.notes
        }).eq("id", session["id"]).execute()

        # 2. Mark job_operation as completed
        if job_operation_id:
            supabase.table("job_operations").update({
                "status": "completed",
                "completed_at": now,
                "quantity_completed": request.quantity_completed or 1,
                "quantity_scrapped": request.quantity_scrapped or 0
            }).eq("id", job_operation_id).execute()

        # 3. Check if all operations are complete → update job status
        remaining = supabase.table("job_operations").select("id").eq(
            "job_id", job_id
        ).not_.in_("status", ["completed", "skipped"]).execute()

        if not remaining.data:
            supabase.table("jobs").update({
                "status": "completed"
            }).eq("id", job_id).execute()

        # Calculate duration
        started = datetime.fromisoformat(session["started_at"].replace("Z", "+00:00"))
        ended = datetime.utcnow()
        duration = int((ended - started.replace(tzinfo=None)).total_seconds())

        return {
            "success": True,
            "session_id": session["id"],
            "duration_seconds": duration,
            "job_completed": not remaining.data
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing job: {e}")
        raise HTTPException(status_code=500, detail="Failed to complete job")


@operator_router.get("/active", response_model=Optional[ActiveSessionResponse])
async def get_active_session(operator: dict = Depends(get_current_operator)):
    """Get the operator's current active session, if any."""
    supabase = get_supabase()
    operator_id = operator["operator_id"]

    try:
        result = supabase.table("operator_sessions").select(
            "id, job_id, job_operation_id, operation_type_id, started_at, notes, "
            "jobs(job_number), job_operations(operation_name)"
        ).eq("operator_id", operator_id).is_("ended_at", "null").execute()

        if not result.data:
            return None

        session = result.data[0]

        return ActiveSessionResponse(
            id=session["id"],
            operator_id=operator_id,
            job_id=session["job_id"],
            job_number=session.get("jobs", {}).get("job_number") if session.get("jobs") else None,
            job_operation_id=session.get("job_operation_id"),
            operation_name=session.get("job_operations", {}).get("operation_name") if session.get("job_operations") else None,
            operation_type_id=session["operation_type_id"],
            started_at=session["started_at"],
            notes=session.get("notes")
        )

    except Exception as e:
        logger.error(f"Error fetching active session: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch active session")


# ============================================================================
# ADMIN - PIN HASHING UTILITY
# ============================================================================

@admin_router.post("/hash-pin", response_model=PinHashResponse)
async def hash_pin_endpoint(request: PinHashRequest):
    """
    Hash a PIN for storage.

    Used by frontend when creating/updating operators via Supabase.
    This endpoint exists because bcrypt hashing must be done server-side.
    """
    try:
        hashed = hash_pin(request.pin)
        return PinHashResponse(pin_hash=hashed)
    except Exception as e:
        logger.error(f"Error hashing PIN: {e}")
        raise HTTPException(status_code=500, detail="Failed to hash PIN")


@admin_router.get("/{operator_id}/sessions", response_model=list[SessionResponse])
async def get_operator_sessions(
    operator_id: str,
    limit: int = Query(50, le=100),
    supabase: Client = Depends(get_supabase)
):
    """Get work session history for an operator (admin)."""
    try:
        result = supabase.table("operator_sessions").select(
            "id, operator_id, job_id, job_operation_id, operation_type_id, "
            "started_at, ended_at, notes"
        ).eq("operator_id", operator_id).order(
            "started_at", desc=True
        ).limit(limit).execute()

        sessions = []
        for s in result.data or []:
            duration = None
            if s.get("ended_at"):
                started = datetime.fromisoformat(s["started_at"].replace("Z", "+00:00"))
                ended = datetime.fromisoformat(s["ended_at"].replace("Z", "+00:00"))
                duration = int((ended - started).total_seconds())

            sessions.append(SessionResponse(
                id=s["id"],
                operator_id=s["operator_id"],
                job_id=s["job_id"],
                job_operation_id=s.get("job_operation_id"),
                operation_type_id=s["operation_type_id"],
                started_at=s["started_at"],
                ended_at=s.get("ended_at"),
                notes=s.get("notes"),
                duration_seconds=duration
            ))

        return sessions

    except Exception as e:
        logger.error(f"Error fetching operator sessions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch sessions")
