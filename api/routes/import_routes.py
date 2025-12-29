"""Import routes for customer CSV import with AI-powered mapping."""

import hashlib
import json
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException, Depends
from supabase import Client

from models.import_models import (
    AnalyzeRequest,
    AnalyzeResponse,
    ColumnMapping,
    ValidateRequest,
    ValidateResponse,
    ConflictInfo,
    ExecuteRequest,
    ExecuteResponse,
    ImportError,
    CUSTOMER_SCHEMA,
)
from services.ai import get_provider
from utils.rate_limiter import RateLimiter

router = APIRouter(prefix="/api/customers/import", tags=["import"])

# Rate limiter: 10 AI calls per minute per company
ai_rate_limiter = RateLimiter(max_requests=10, window_seconds=60)

# Cache directory for AI responses (dev only - avoids repeated API calls)
CACHE_DIR = Path(__file__).parent.parent / ".cache" / "ai_responses"
CACHE_ENABLED = os.getenv("AI_CACHE_ENABLED", "true").lower() == "true"


def _get_cache_key(company_id: str, headers: list[str]) -> str:
    """Generate a cache key from company_id and headers."""
    content = f"{company_id}:{','.join(sorted(headers))}"
    return hashlib.md5(content.encode()).hexdigest()


def _get_cached_response(cache_key: str) -> AnalyzeResponse | None:
    """Try to get a cached response."""
    if not CACHE_ENABLED:
        return None

    cache_file = CACHE_DIR / f"{cache_key}.json"
    if cache_file.exists():
        try:
            with open(cache_file) as f:
                data = json.load(f)
            return AnalyzeResponse(**data)
        except Exception:
            return None
    return None


def _save_to_cache(cache_key: str, response: AnalyzeResponse) -> None:
    """Save response to cache."""
    if not CACHE_ENABLED:
        return

    try:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        cache_file = CACHE_DIR / f"{cache_key}.json"
        with open(cache_file, "w") as f:
            json.dump(response.model_dump(), f, indent=2)
    except Exception:
        pass  # Silently fail cache writes


def get_supabase() -> Client:
    """Get Supabase client from the main app."""
    from index import supabase

    if not supabase:
        raise HTTPException(
            status_code=500,
            detail="Supabase client not initialized",
        )
    return supabase


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_csv(
    request: AnalyzeRequest,
    supabase: Client = Depends(get_supabase),
):
    """
    Analyze CSV headers and sample data to suggest column mappings using AI.

    This endpoint sends the CSV structure to an AI provider configured for the
    company and returns suggested mappings with confidence scores.

    Caching: Responses are cached by company_id + headers to avoid repeated
    API calls during development. Set AI_CACHE_ENABLED=false to disable.
    """
    # Check cache first
    cache_key = _get_cache_key(request.company_id, request.headers)
    cached = _get_cached_response(cache_key)
    if cached:
        return cached

    # Rate limiting
    if not ai_rate_limiter.check(request.company_id):
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait before trying again.",
        )

    try:
        # Get the configured AI provider for this company
        provider = await get_provider(supabase, request.company_id, "csv_mapping")

        # Get AI suggestions
        suggestions = await provider.suggest_column_mappings(
            csv_headers=request.headers,
            sample_rows=request.sample_rows,
            target_schema=CUSTOMER_SCHEMA,
        )

        # Convert to response format
        mappings = []
        discarded_columns = []
        mapped_db_fields = set()

        for suggestion in suggestions:
            needs_review = suggestion.confidence < 0.7

            if suggestion.db_field is None:
                discarded_columns.append(suggestion.csv_column)
            else:
                mapped_db_fields.add(suggestion.db_field)

            mappings.append(
                ColumnMapping(
                    csv_column=suggestion.csv_column,
                    db_field=suggestion.db_field,
                    confidence=suggestion.confidence,
                    reasoning=suggestion.reasoning,
                    needs_review=needs_review,
                )
            )

        # Check for unmapped required fields
        required_fields = [
            field for field, info in CUSTOMER_SCHEMA.items() if info.get("required")
        ]
        unmapped_required = [f for f in required_fields if f not in mapped_db_fields]

        response = AnalyzeResponse(
            mappings=mappings,
            unmapped_required=unmapped_required,
            discarded_columns=discarded_columns,
            ai_provider=provider.provider_name,
        )

        # Save to cache for future requests
        _save_to_cache(cache_key, response)

        return response

    except ValueError as e:
        # AI provider configuration error
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        # Unexpected error
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing CSV: {str(e)}",
        )


@router.post("/validate", response_model=ValidateResponse)
async def validate_import(
    request: ValidateRequest,
    supabase: Client = Depends(get_supabase),
):
    """
    Validate CSV data before import by checking for conflicts.

    Checks for duplicate customer_code OR name against existing records.
    Returns detailed conflict information so user can decide how to proceed.
    """
    try:
        # Get existing customers for this company
        response = (
            supabase.table("customers")
            .select("id, customer_code, name")
            .eq("company_id", request.company_id)
            .execute()
        )
        existing_customers = response.data or []

        # Build lookup sets for quick conflict detection
        existing_codes = {c["customer_code"].lower(): c for c in existing_customers}
        existing_names = {c["name"].lower(): c for c in existing_customers}

        # Find the column mappings for customer_code and name
        code_column = None
        name_column = None
        for csv_col, db_field in request.mappings.items():
            if db_field == "customer_code":
                code_column = csv_col
            elif db_field == "name":
                name_column = csv_col

        conflicts = []
        valid_rows = 0

        for i, row in enumerate(request.rows):
            row_number = i + 1  # 1-indexed for user display
            csv_code = row.get(code_column, "").strip() if code_column else ""
            csv_name = row.get(name_column, "").strip() if name_column else ""

            has_conflict = False

            # Check for duplicate code
            if csv_code and csv_code.lower() in existing_codes:
                existing = existing_codes[csv_code.lower()]
                conflicts.append(
                    ConflictInfo(
                        row_number=row_number,
                        csv_customer_code=csv_code,
                        csv_name=csv_name,
                        conflict_type="duplicate_code",
                        existing_customer_id=existing["id"],
                        existing_value=existing["customer_code"],
                    )
                )
                has_conflict = True

            # Check for duplicate name (only if code didn't conflict)
            if not has_conflict and csv_name and csv_name.lower() in existing_names:
                existing = existing_names[csv_name.lower()]
                conflicts.append(
                    ConflictInfo(
                        row_number=row_number,
                        csv_customer_code=csv_code,
                        csv_name=csv_name,
                        conflict_type="duplicate_name",
                        existing_customer_id=existing["id"],
                        existing_value=existing["name"],
                    )
                )
                has_conflict = True

            if not has_conflict:
                valid_rows += 1

        return ValidateResponse(
            has_conflicts=len(conflicts) > 0,
            conflicts=conflicts,
            valid_rows_count=valid_rows,
            conflict_rows_count=len(conflicts),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error validating data: {str(e)}",
        )


@router.post("/execute", response_model=ExecuteResponse)
async def execute_import(
    request: ExecuteRequest,
    supabase: Client = Depends(get_supabase),
):
    """
    Execute the customer import.

    If skip_conflicts is True, only imports rows without conflicts.
    Otherwise, fails if any conflicts exist.
    """
    try:
        # First validate to get conflict info
        validate_response = await validate_import(
            ValidateRequest(
                company_id=request.company_id,
                mappings=request.mappings,
                rows=request.rows,
            ),
            supabase=supabase,
        )

        # If conflicts exist and we're not skipping them, fail
        if validate_response.has_conflicts and not request.skip_conflicts:
            raise HTTPException(
                status_code=400,
                detail="Conflicts detected. Set skip_conflicts=true to import non-conflicting rows only.",
            )

        # Get set of conflicting row numbers
        conflict_row_numbers = {c.row_number for c in validate_response.conflicts}

        # Find column mappings
        reverse_mappings = {v: k for k, v in request.mappings.items()}

        # Prepare rows for insertion
        rows_to_insert = []
        errors = []
        skipped = 0

        for i, row in enumerate(request.rows):
            row_number = i + 1

            # Skip conflicting rows if flag is set
            if row_number in conflict_row_numbers:
                skipped += 1
                continue

            # Build customer record
            customer_data = {
                "company_id": request.company_id,
                "is_active": True,
            }

            for db_field in CUSTOMER_SCHEMA.keys():
                csv_column = reverse_mappings.get(db_field)
                if csv_column and csv_column in row:
                    value = row[csv_column].strip()
                    if value:  # Only set non-empty values
                        customer_data[db_field] = value

            # Set default country if not provided
            if "country" not in customer_data or not customer_data.get("country"):
                customer_data["country"] = "USA"

            # Validate required fields
            if not customer_data.get("customer_code"):
                errors.append(
                    ImportError(
                        row_number=row_number,
                        reason="Missing required field: customer_code",
                        data=row,
                    )
                )
                continue

            if not customer_data.get("name"):
                errors.append(
                    ImportError(
                        row_number=row_number,
                        reason="Missing required field: name",
                        data=row,
                    )
                )
                continue

            rows_to_insert.append(customer_data)

        # Bulk insert
        imported_count = 0
        if rows_to_insert:
            try:
                response = supabase.table("customers").insert(rows_to_insert).execute()
                imported_count = len(response.data) if response.data else 0
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Database insertion failed: {str(e)}",
                )

        return ExecuteResponse(
            success=True,
            imported_count=imported_count,
            skipped_count=skipped + len(errors),
            errors=errors,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error executing import: {str(e)}",
        )
