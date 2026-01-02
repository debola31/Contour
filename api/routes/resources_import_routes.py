"""Import routes for resources CSV import with AI-powered mapping."""

import hashlib
import json
import logging
import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from supabase import Client

from models.resources_import_models import (
    ColumnMapping,
    ResourceAnalyzeRequest,
    ResourceAnalyzeResponse,
    ResourceValidateRequest,
    ResourceValidateResponse,
    ResourceValidationError,
    ResourceConflictInfo,
    ResourceExecuteRequest,
    ResourceExecuteResponse,
    ResourceImportError,
    RESOURCE_SCHEMA,
)
from services.ai import get_provider
from utils.rate_limiter import RateLimiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/resources/import", tags=["resources-import"])

# Rate limiter: 10 AI calls per minute per company
ai_rate_limiter = RateLimiter(max_requests=10, window_seconds=60)

# Cache directory for AI responses (dev only - avoids repeated API calls)
CACHE_DIR = Path(__file__).parent.parent / ".cache" / "ai_responses" / "resources"
CACHE_ENABLED = os.getenv("AI_CACHE_ENABLED", "true").lower() == "true"


def _get_cache_key(company_id: str, headers: list[str]) -> str:
    """Generate a cache key from company_id and headers."""
    content = f"resources:{company_id}:{','.join(sorted(headers))}"
    return hashlib.md5(content.encode()).hexdigest()


def _get_cached_response(cache_key: str) -> ResourceAnalyzeResponse | None:
    """Try to get a cached response."""
    if not CACHE_ENABLED:
        return None

    cache_file = CACHE_DIR / f"{cache_key}.json"
    if cache_file.exists():
        try:
            with open(cache_file) as f:
                data = json.load(f)
            return ResourceAnalyzeResponse(**data)
        except Exception:
            return None
    return None


def _save_to_cache(cache_key: str, response: ResourceAnalyzeResponse) -> None:
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


def _get_column_samples(
    headers: list[str],
    sample_rows: list[list[str]],
) -> dict[str, str]:
    """Get one sample value per non-empty column.

    Efficiently collects the first non-empty value found for each column.
    This minimizes token usage while giving AI context about data format.
    """
    samples: dict[str, str] = {}

    for row in sample_rows:
        for i, header in enumerate(headers):
            # Skip if we already have a sample
            if header in samples:
                continue

            # Get value if exists and is non-empty
            value = row[i].strip() if i < len(row) else ""
            if value:
                samples[header] = value

        # Early exit if we have samples for all columns
        if len(samples) >= len(headers):
            break

    return samples


def get_supabase() -> Client:
    """Get Supabase client from the main app."""
    from index import supabase

    if not supabase:
        raise HTTPException(
            status_code=500,
            detail="Supabase client not initialized",
        )
    return supabase


@router.post("/analyze", response_model=ResourceAnalyzeResponse)
async def analyze_csv(
    request: ResourceAnalyzeRequest,
    supabase: Client = Depends(get_supabase),
):
    """
    Analyze CSV headers and sample data to suggest column mappings for resources using AI.

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

    # Get sample values for non-empty columns (efficient token usage)
    column_samples = _get_column_samples(
        headers=request.headers,
        sample_rows=request.sample_rows,
    )

    try:
        # Get the configured AI provider for this company
        provider = await get_provider(supabase, request.company_id, "csv_mapping")

        # Get AI suggestions for all columns
        suggestions = await provider.suggest_column_mappings(
            csv_headers=request.headers,
            sample_rows=request.sample_rows,
            target_schema=RESOURCE_SCHEMA,
            column_samples=column_samples,
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
            field for field, info in RESOURCE_SCHEMA.items() if info.get("required")
        ]
        unmapped_required = [f for f in required_fields if f not in mapped_db_fields]

        response = ResourceAnalyzeResponse(
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


@router.post("/validate", response_model=ResourceValidateResponse)
async def validate_import(
    request: ResourceValidateRequest,
    supabase: Client = Depends(get_supabase),
):
    """
    Validate resources CSV data before import.

    Checks:
    - Resource name uniqueness per company
    - Labor rate validity (if provided)
    - Required fields presence
    """
    try:
        # Get existing resources for this company
        resources_response = (
            supabase.table("resources")
            .select("id, name")
            .eq("company_id", request.company_id)
            .execute()
        )
        existing_resources = resources_response.data or []

        # Build lookup: name_lower -> resource
        existing_resources_lookup: dict[str, dict] = {}
        for resource in existing_resources:
            key = resource["name"].lower()
            existing_resources_lookup[key] = resource

        # Get existing groups for this company
        groups_response = (
            supabase.table("resource_groups")
            .select("id, name")
            .eq("company_id", request.company_id)
            .execute()
        )
        existing_groups = groups_response.data or []
        existing_group_names = {g["name"].lower() for g in existing_groups}

        # Find column mappings
        reverse_mappings = {v: k for k, v in request.mappings.items()}
        name_column = reverse_mappings.get("name")
        resource_group_column = reverse_mappings.get("resource_group")
        labor_rate_column = reverse_mappings.get("labor_rate")

        # First pass: track name occurrences for CSV duplicate detection
        name_occurrences: dict[str, list[int]] = {}

        for i, row in enumerate(request.rows):
            row_number = i + 1
            name = (
                row.get(name_column, "").strip() if name_column else ""
            )

            if name:
                name_key = name.lower()
                if name_key not in name_occurrences:
                    name_occurrences[name_key] = []
                name_occurrences[name_key].append(row_number)

        # Find duplicates within CSV
        csv_duplicates = {k: v for k, v in name_occurrences.items() if len(v) > 1}

        # Track groups to create
        groups_to_create: set[str] = set()

        # Second pass: validate each row
        validation_errors: list[ResourceValidationError] = []
        conflicts: list[ResourceConflictInfo] = []
        validation_error_rows: set[int] = set()
        conflict_rows: set[int] = set()

        for i, row in enumerate(request.rows):
            row_number = i + 1
            name = (
                row.get(name_column, "").strip() if name_column else ""
            )
            resource_group = (
                row.get(resource_group_column, "").strip() if resource_group_column else ""
            )

            # Check required field: name
            if not name:
                validation_errors.append(
                    ResourceValidationError(
                        row_number=row_number,
                        error_type="missing_name",
                        field="name",
                        message="Resource name is required",
                    )
                )
                validation_error_rows.add(row_number)
                continue

            name_key = name.lower()

            # Check for CSV duplicates
            if name_key in csv_duplicates:
                other_rows = [r for r in csv_duplicates[name_key] if r != row_number]
                if other_rows:  # Don't flag if this is the first occurrence
                    conflicts.append(
                        ResourceConflictInfo(
                            row_number=row_number,
                            csv_name=name,
                            csv_resource_group=resource_group,
                            conflict_type="csv_duplicate",
                            existing_resource_id="",
                            existing_value=f"Duplicate in CSV at rows {', '.join(map(str, other_rows))}",
                        )
                    )
                    conflict_rows.add(row_number)
                    continue

            # Check for existing resource with same name
            if name_key in existing_resources_lookup:
                existing = existing_resources_lookup[name_key]
                conflicts.append(
                    ResourceConflictInfo(
                        row_number=row_number,
                        csv_name=name,
                        csv_resource_group=resource_group,
                        conflict_type="duplicate_name",
                        existing_resource_id=existing["id"],
                        existing_value=f"Resource '{name}' already exists",
                    )
                )
                conflict_rows.add(row_number)
                continue

            # Validate labor_rate if provided
            if labor_rate_column:
                labor_rate_str = row.get(labor_rate_column, "").strip()
                if labor_rate_str:
                    try:
                        labor_rate = float(labor_rate_str)
                        if labor_rate < 0:
                            validation_errors.append(
                                ResourceValidationError(
                                    row_number=row_number,
                                    error_type="invalid_rate",
                                    field="labor_rate",
                                    message="Labor rate cannot be negative",
                                )
                            )
                            validation_error_rows.add(row_number)
                            continue
                    except ValueError:
                        validation_errors.append(
                            ResourceValidationError(
                                row_number=row_number,
                                error_type="invalid_rate",
                                field="labor_rate",
                                message=f"Invalid labor rate: '{labor_rate_str}'",
                            )
                        )
                        validation_error_rows.add(row_number)
                        continue

            # Track groups to create
            if resource_group and request.create_groups:
                if resource_group.lower() not in existing_group_names:
                    groups_to_create.add(resource_group)

        # Calculate counts
        total_skipped = conflict_rows | validation_error_rows
        valid_rows = len(request.rows) - len(total_skipped)

        return ResourceValidateResponse(
            has_conflicts=len(conflicts) > 0,
            conflicts=conflicts,
            validation_errors=validation_errors,
            valid_rows_count=valid_rows,
            conflict_rows_count=len(conflict_rows),
            error_rows_count=len(validation_error_rows),
            skipped_rows_count=len(total_skipped),
            groups_to_create=sorted(groups_to_create),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error validating data: {str(e)}",
        )


@router.post("/execute", response_model=ResourceExecuteResponse)
async def execute_import(
    request: ResourceExecuteRequest,
    supabase: Client = Depends(get_supabase),
):
    """
    Execute the resources import.

    If skip_conflicts is True, only imports rows without conflicts.
    Otherwise, fails if any conflicts exist.

    If create_groups is True, auto-creates resource groups from data.
    """
    try:
        # First validate to get conflict info
        validate_response = await validate_import(
            ResourceValidateRequest(
                company_id=request.company_id,
                mappings=request.mappings,
                rows=request.rows,
                create_groups=request.create_groups,
            ),
            supabase=supabase,
        )

        # If conflicts exist and we're not skipping them, fail
        if validate_response.has_conflicts and not request.skip_conflicts:
            raise HTTPException(
                status_code=400,
                detail="Conflicts detected. Set skip_conflicts=true to import non-conflicting rows only.",
            )

        # Build set of rows to skip
        skip_row_numbers = {c.row_number for c in validate_response.conflicts}
        skip_row_numbers |= {e.row_number for e in validate_response.validation_errors}

        # Create groups if needed
        groups_created = 0
        group_name_to_id: dict[str, str] = {}

        if request.create_groups and validate_response.groups_to_create:
            for group_name in validate_response.groups_to_create:
                try:
                    result = (
                        supabase.table("resource_groups")
                        .insert({
                            "company_id": request.company_id,
                            "name": group_name,
                            "display_order": 0,
                        })
                        .execute()
                    )
                    if result.data:
                        group_name_to_id[group_name.lower()] = result.data[0]["id"]
                        groups_created += 1
                except Exception as e:
                    logger.warning(f"Failed to create group '{group_name}': {e}")

        # Get existing groups for ID lookup
        groups_response = (
            supabase.table("resource_groups")
            .select("id, name")
            .eq("company_id", request.company_id)
            .execute()
        )
        for group in groups_response.data or []:
            group_name_to_id[group["name"].lower()] = group["id"]

        # Find column mappings
        reverse_mappings = {v: k for k, v in request.mappings.items()}

        # Prepare rows for insertion
        rows_to_insert = []
        errors: list[ResourceImportError] = []
        skipped = 0

        for i, row in enumerate(request.rows):
            row_number = i + 1

            # Skip rows that failed validation or have conflicts
            if row_number in skip_row_numbers:
                skipped += 1
                continue

            # Build resource record
            resource_data = {
                "company_id": request.company_id,
                "metadata": {},
            }

            # Map standard fields
            for db_field in ["name", "code", "description"]:
                csv_column = reverse_mappings.get(db_field)
                if csv_column and csv_column in row:
                    value = row[csv_column].strip()
                    # Filter out empty values and literal "undefined" string from frontend
                    if value and value.lower() != "undefined":
                        resource_data[db_field] = value

            # Handle labor_rate (numeric)
            labor_rate_column = reverse_mappings.get("labor_rate")
            if labor_rate_column and labor_rate_column in row:
                value = row[labor_rate_column].strip()
                if value:
                    try:
                        resource_data["labor_rate"] = round(float(value), 2)
                    except ValueError:
                        pass  # Skip invalid values (should be caught in validation)

            # Handle resource_group (lookup ID)
            resource_group_column = reverse_mappings.get("resource_group")
            if resource_group_column and resource_group_column in row:
                group_name = row[resource_group_column].strip()
                if group_name:
                    group_id = group_name_to_id.get(group_name.lower())
                    if group_id:
                        resource_data["resource_group_id"] = group_id

            # Handle legacy_id (store in metadata)
            legacy_id_column = reverse_mappings.get("legacy_id")
            if legacy_id_column and legacy_id_column in row:
                value = row[legacy_id_column].strip()
                if value:
                    resource_data["metadata"]["legacy_id"] = value

            rows_to_insert.append(resource_data)

        # Bulk insert
        imported_count = 0
        if rows_to_insert:
            try:
                response = supabase.table("resources").insert(rows_to_insert).execute()
                imported_count = len(response.data) if response.data else 0
            except Exception as e:
                error_str = str(e)
                # Check for unique constraint violation
                if "23505" in error_str or "duplicate key" in error_str.lower():
                    raise HTTPException(
                        status_code=400,
                        detail="Import failed: A resource with this name already exists. Please check your CSV for duplicate names.",
                    )
                raise HTTPException(
                    status_code=500,
                    detail="Database error occurred during import. Please try again.",
                )

        return ResourceExecuteResponse(
            success=True,
            imported_count=imported_count,
            skipped_count=skipped,
            groups_created=groups_created,
            errors=errors,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resources import execution error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during import: {str(e)}",
        )
