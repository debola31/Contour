"""Pydantic models for Resources CSV import API."""

from typing import Optional
from pydantic import BaseModel


class ColumnMapping(BaseModel):
    """A single column mapping suggestion from AI."""

    csv_column: str
    db_field: Optional[str]  # None means skip/discard
    confidence: float  # 0.0 to 1.0
    reasoning: str
    needs_review: bool  # True if confidence < 0.7


class ResourceAnalyzeRequest(BaseModel):
    """Request to analyze CSV and get mapping suggestions for resources."""

    company_id: str
    headers: list[str]
    sample_rows: list[list[str]]  # First 5 rows of data


class ResourceAnalyzeResponse(BaseModel):
    """Response with AI-suggested column mappings for resources."""

    mappings: list[ColumnMapping]
    unmapped_required: list[str]  # Required DB fields with no mapping
    discarded_columns: list[str]  # CSV columns that won't be imported
    ai_provider: str  # Which AI was used


class ResourceConflictInfo(BaseModel):
    """Information about a conflicting row."""

    row_number: int
    csv_name: Optional[str]
    csv_resource_group: Optional[str]
    conflict_type: str  # "duplicate_name" | "csv_duplicate"
    existing_resource_id: str  # Empty string for non-DB conflicts
    existing_value: str  # Additional conflict info


class ResourceValidationError(BaseModel):
    """A validation error discovered during validation phase."""

    row_number: int
    error_type: str  # "missing_name" | "invalid_rate"
    field: str
    message: str


class ResourceValidateRequest(BaseModel):
    """Request to validate resources data before import."""

    company_id: str
    mappings: dict[str, str]  # csv_column -> db_field
    rows: list[dict[str, str]]  # All parsed CSV rows
    create_groups: bool = True  # Auto-create resource groups


class ResourceValidateResponse(BaseModel):
    """Response with validation results for resources."""

    has_conflicts: bool
    conflicts: list[ResourceConflictInfo]
    validation_errors: list[ResourceValidationError]
    valid_rows_count: int
    conflict_rows_count: int
    error_rows_count: int
    skipped_rows_count: int
    groups_to_create: list[str]  # New groups that will be created


class ResourceImportError(BaseModel):
    """An error that occurred during import."""

    row_number: int
    reason: str
    data: dict[str, str]


class ResourceExecuteRequest(BaseModel):
    """Request to execute the resources import."""

    company_id: str
    mappings: dict[str, str]  # csv_column -> db_field
    rows: list[dict[str, str]]  # CSV rows to import
    skip_conflicts: bool = False  # If True, skip rows with conflicts
    create_groups: bool = True  # Auto-create resource groups


class ResourceExecuteResponse(BaseModel):
    """Response with import results for resources."""

    success: bool
    imported_count: int
    skipped_count: int
    groups_created: int
    errors: list[ResourceImportError]


# Target schema for resources table (for AI mapping)
RESOURCE_SCHEMA = {
    "name": {
        "type": "string",
        "required": True,
        "description": "Resource/operation name (e.g., 'HURCO Mill', 'Mazak Lathe')",
    },
    "code": {
        "type": "string",
        "required": False,
        "description": "Short code/ID for display (e.g., 'HRC-M1', 'LATHE01')",
    },
    "labor_rate": {
        "type": "number",
        "required": False,
        "description": "Hourly labor rate in dollars (e.g., 135.00)",
    },
    "resource_group": {
        "type": "string",
        "required": False,
        "description": "Group/category name (e.g., 'CNC', 'LATHE&MILL', 'EDM')",
    },
    "description": {
        "type": "string",
        "required": False,
        "description": "Additional notes or description",
    },
    "legacy_id": {
        "type": "string",
        "required": False,
        "description": "ID from legacy/previous system (preserved in metadata)",
    },
}
