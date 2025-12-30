"""Generic import service with analyze/validate/execute functionality.

This module provides the GenericImportService class that handles CSV import
for any module. It uses the module configuration to customize behavior while
providing consistent caching, rate limiting, and error handling.
"""

import hashlib
import json
import os
import re
from pathlib import Path
from typing import Optional, Any

from fastapi import HTTPException
from supabase import Client

from services.ai import get_provider
from .config import ImportModuleConfig, ColumnPairConfig
from .classifier import classify_columns_generic, detect_column_pairs, ColumnClassification


# Column limit for AI analysis (reduces token usage and improves reliability)
MAX_COLUMNS_FOR_AI = 30

# Cache settings (dev only - avoids repeated API calls)
CACHE_DIR_BASE = Path(__file__).parent.parent.parent / ".cache" / "ai_responses"
CACHE_ENABLED = os.getenv("AI_CACHE_ENABLED", "true").lower() == "true"


class RateLimiter:
    """Simple in-memory rate limiter."""

    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, list[float]] = {}

    def check(self, key: str) -> bool:
        """Check if request is allowed."""
        import time

        now = time.time()
        if key not in self._requests:
            self._requests[key] = []

        # Remove old requests outside window
        self._requests[key] = [
            t for t in self._requests[key] if now - t < self.window_seconds
        ]

        if len(self._requests[key]) >= self.max_requests:
            return False

        self._requests[key].append(now)
        return True


class GenericImportService:
    """Generic import service for any module.

    This class provides the core import functionality (analyze, validate, execute)
    that works with any module configuration. It handles:
    - Caching of AI responses
    - Rate limiting
    - Hybrid column classification (rules + AI)
    - Conflict detection
    - Bulk database inserts

    Usage:
        config = ImportModuleConfig(...)
        service = GenericImportService(config)
        result = await service.analyze(company_id, headers, sample_rows, supabase)
    """

    def __init__(self, config: ImportModuleConfig):
        """Initialize the service with module configuration.

        Args:
            config: ImportModuleConfig defining the module's import behavior
        """
        self.config = config
        self.cache_dir = CACHE_DIR_BASE / config.module_name
        self.rate_limiter = RateLimiter(max_requests=10, window_seconds=60)

    def _get_cache_key(self, company_id: str, headers: list[str]) -> str:
        """Generate a cache key from company_id and headers."""
        content = f"{self.config.module_name}:{company_id}:{','.join(sorted(headers))}"
        return hashlib.md5(content.encode()).hexdigest()

    def _get_cached_response(self, cache_key: str) -> Optional[dict]:
        """Try to get a cached response."""
        if not CACHE_ENABLED:
            return None

        cache_file = self.cache_dir / f"{cache_key}.json"
        if cache_file.exists():
            try:
                with open(cache_file) as f:
                    return json.load(f)
            except Exception:
                return None
        return None

    def _save_to_cache(self, cache_key: str, response: dict) -> None:
        """Save response to cache."""
        if not CACHE_ENABLED:
            return

        try:
            self.cache_dir.mkdir(parents=True, exist_ok=True)
            cache_file = self.cache_dir / f"{cache_key}.json"
            with open(cache_file, "w") as f:
                json.dump(response, f, indent=2)
        except Exception:
            pass  # Silently fail cache writes

    def _prefilter_columns(
        self,
        headers: list[str],
        sample_rows: list[list[str]],
        skip_columns: set[str] | None = None,
    ) -> tuple[list[str], list[list[str]], list[ColumnClassification]]:
        """Pre-filter columns before AI analysis.

        Removes columns that are 100% empty in sample data and limits
        to MAX_COLUMNS_FOR_AI to reduce token usage and improve AI reliability.

        Args:
            headers: Original CSV column headers
            sample_rows: Sample data rows
            skip_columns: Columns already handled (e.g., pricing pairs)

        Returns:
            Tuple of:
            - filtered_headers: Non-empty column headers (max MAX_COLUMNS_FOR_AI)
            - filtered_sample_rows: Sample data for filtered columns only
            - prefiltered_classifications: Classifications for removed columns
        """
        skip_columns = skip_columns or set()
        prefiltered_classifications: list[ColumnClassification] = []

        # Identify columns to keep (non-empty and not in skip_columns)
        non_empty_indices: list[int] = []

        for i, header in enumerate(headers):
            # Pre-classified columns are handled separately
            if header in skip_columns:
                continue

            # Check if column has any non-empty values in sample data
            sample_values = [row[i] if i < len(row) else "" for row in sample_rows]
            non_empty = [v for v in sample_values if v and v.strip()]

            if not non_empty:
                # Column is 100% empty - auto-skip
                prefiltered_classifications.append(
                    ColumnClassification(
                        csv_column=header,
                        db_field=None,
                        confidence=0.95,
                        reasoning="Auto-skip: all sample values empty",
                        needs_ai=False,
                    )
                )
            else:
                non_empty_indices.append(i)

        # Limit to MAX_COLUMNS_FOR_AI
        if len(non_empty_indices) > MAX_COLUMNS_FOR_AI:
            # Track columns that exceed the limit
            for idx in non_empty_indices[MAX_COLUMNS_FOR_AI:]:
                prefiltered_classifications.append(
                    ColumnClassification(
                        csv_column=headers[idx],
                        db_field=None,
                        confidence=0.6,
                        reasoning=f"Auto-skip: column limit exceeded (max {MAX_COLUMNS_FOR_AI})",
                        needs_ai=False,
                    )
                )
            non_empty_indices = non_empty_indices[:MAX_COLUMNS_FOR_AI]

        # Build filtered headers and sample data
        filtered_headers = [headers[i] for i in non_empty_indices]
        filtered_sample_rows = [
            [row[i] if i < len(row) else "" for i in non_empty_indices]
            for row in sample_rows
        ]

        return filtered_headers, filtered_sample_rows, prefiltered_classifications

    async def analyze(
        self,
        company_id: str,
        headers: list[str],
        sample_rows: list[list[str]],
        supabase: Client,
    ) -> dict:
        """Analyze CSV and return mapping suggestions.

        Uses hybrid approach:
        1. Detect column pairs (if configured)
        2. Rule-based classification for obvious mappings/skips
        3. AI analysis only for uncertain columns

        Args:
            company_id: Company ID for rate limiting and AI config
            headers: CSV column headers
            sample_rows: First 5 rows of sample data
            supabase: Supabase client for AI provider lookup

        Returns:
            Dictionary with:
            - mappings: List of column mapping suggestions
            - unmapped_required: List of required fields with no mapping
            - discarded_columns: List of columns that won't be imported
            - ai_provider: Name of AI provider used (or "rule-based")
            - column_pairs: List of detected column pairs (if applicable)
        """
        # Check cache first
        cache_key = self._get_cache_key(company_id, headers)
        cached = self._get_cached_response(cache_key)
        if cached:
            return cached

        # Rate limiting
        if not self.rate_limiter.check(company_id):
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please wait before trying again.",
            )

        # 1. Detect column pairs (if configured)
        pair_columns: set[str] = set()
        detected_pairs: list[tuple[str, str]] = []

        if self.config.column_pair_config:
            cfg = self.config.column_pair_config
            detected_pairs, pair_columns = detect_column_pairs(
                headers=headers,
                qty_pattern=cfg.qty_pattern,
                price_pattern=cfg.price_pattern,
            )

        # 2. Pre-filter: remove empty columns and limit to MAX_COLUMNS_FOR_AI
        filtered_headers, filtered_sample_rows, prefiltered_classifications = self._prefilter_columns(
            headers=headers,
            sample_rows=sample_rows,
            skip_columns=pair_columns,
        )

        # 3. Rule-based classification of filtered columns
        resolved_classifications, uncertain_headers = classify_columns_generic(
            headers=filtered_headers,
            sample_rows=filtered_sample_rows,
            config=self.config,
            skip_columns=pair_columns,
        )

        # Add prefiltered classifications to resolved
        resolved_classifications = prefiltered_classifications + resolved_classifications

        try:
            # 4. Only send uncertain columns to AI (typically 10-20 from 150+)
            ai_suggestions = []
            ai_provider_name = "rule-based"

            if uncertain_headers:
                # Build sample data for uncertain columns only (from filtered data)
                uncertain_indices = [filtered_headers.index(h) for h in uncertain_headers]
                uncertain_sample = [
                    [row[i] if i < len(row) else "" for i in uncertain_indices]
                    for row in filtered_sample_rows[:5]
                ]

                # Get the configured AI provider
                provider = await get_provider(supabase, company_id, "csv_mapping")
                ai_provider_name = f"hybrid ({provider.provider_name})"

                # AI only analyzes uncertain columns
                ai_suggestions = await provider.suggest_column_mappings(
                    csv_headers=uncertain_headers,
                    sample_rows=uncertain_sample,
                    target_schema=self.config.get_schema_dict(),
                )

            # 4. Combine rule-based + AI results
            mappings = []
            discarded_columns = []
            mapped_db_fields: set[str] = set()

            # Add resolved (rule-based) mappings
            for classification in resolved_classifications:
                needs_review = classification.confidence < 0.7

                if classification.db_field is None:
                    discarded_columns.append(classification.csv_column)
                else:
                    mapped_db_fields.add(classification.db_field)

                mappings.append({
                    "csv_column": classification.csv_column,
                    "db_field": classification.db_field,
                    "confidence": classification.confidence,
                    "reasoning": classification.reasoning,
                    "needs_review": needs_review,
                })

            # Add AI suggestions for uncertain columns
            for suggestion in ai_suggestions:
                needs_review = suggestion.confidence < 0.7

                if suggestion.db_field is None:
                    discarded_columns.append(suggestion.csv_column)
                else:
                    mapped_db_fields.add(suggestion.db_field)

                mappings.append({
                    "csv_column": suggestion.csv_column,
                    "db_field": suggestion.db_field,
                    "confidence": suggestion.confidence,
                    "reasoning": suggestion.reasoning + " (AI)",
                    "needs_review": needs_review,
                })

            # Add column pair columns to discarded list (handled separately)
            for col in pair_columns:
                if col not in discarded_columns:
                    discarded_columns.append(col)

            # Check for unmapped required fields
            required_fields = self.config.get_required_fields()
            unmapped_required = [f for f in required_fields if f not in mapped_db_fields]

            response = {
                "mappings": mappings,
                "unmapped_required": unmapped_required,
                "discarded_columns": discarded_columns,
                "ai_provider": ai_provider_name,
            }

            # Add column pairs if configured
            if self.config.column_pair_config:
                response["column_pairs"] = [
                    {"qty_column": qty, "price_column": price}
                    for qty, price in detected_pairs
                ]

            # Save to cache
            self._save_to_cache(cache_key, response)

            return response

        except ValueError as e:
            raise HTTPException(status_code=500, detail=str(e))
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error analyzing CSV: {str(e)}",
            )

    async def validate(
        self,
        company_id: str,
        mappings: dict[str, str],  # csv_column -> db_field
        rows: list[dict[str, str]],
        supabase: Client,
        **kwargs: Any,
    ) -> dict:
        """Validate data before import.

        Checks for:
        - Missing required fields
        - Duplicate values in unique fields (within CSV)
        - Conflicts with existing database records

        Args:
            company_id: Company ID for database lookups
            mappings: Dictionary mapping CSV columns to database fields
            rows: All parsed CSV rows as dictionaries
            supabase: Supabase client for database queries
            **kwargs: Module-specific options

        Returns:
            Dictionary with:
            - has_conflicts: Boolean indicating if conflicts exist
            - conflicts: List of conflict details
            - validation_errors: List of validation errors
            - valid_rows_count: Number of rows that can be imported
            - conflict_rows_count: Number of rows with conflicts
            - error_rows_count: Number of rows with validation errors
        """
        try:
            # Reverse mappings: db_field -> csv_column
            reverse_mappings = {v: k for k, v in mappings.items() if v}

            # Track validation state
            validation_errors: list[dict] = []
            conflicts: list[dict] = []
            validation_error_rows: set[int] = set()
            conflict_rows: set[int] = set()

            # Get unique fields from config
            unique_fields = self.config.unique_fields
            composite_unique = self.config.composite_unique

            # Build value trackers for CSV duplicate detection
            csv_value_occurrences: dict[str, dict[Any, list[int]]] = {
                field: {} for field in unique_fields
            }

            # First pass: collect values for duplicate detection
            for i, row in enumerate(rows):
                row_number = i + 1

                for field in unique_fields:
                    csv_col = reverse_mappings.get(field)
                    if csv_col:
                        value = row.get(csv_col, "").strip().lower()
                        if value:
                            if value not in csv_value_occurrences[field]:
                                csv_value_occurrences[field][value] = []
                            csv_value_occurrences[field][value].append(row_number)

            # Find CSV duplicates
            csv_duplicates: dict[str, dict[Any, list[int]]] = {}
            for field, occurrences in csv_value_occurrences.items():
                csv_duplicates[field] = {
                    v: rows for v, rows in occurrences.items() if len(rows) > 1
                }

            # Fetch existing records for conflict detection
            existing_records = await self._fetch_existing_records(
                supabase, company_id, unique_fields
            )

            # Second pass: validate each row
            for i, row in enumerate(rows):
                row_number = i + 1

                # Check required fields
                for field in self.config.get_required_fields():
                    csv_col = reverse_mappings.get(field)
                    value = row.get(csv_col, "").strip() if csv_col else ""
                    if not value:
                        validation_errors.append({
                            "row_number": row_number,
                            "error_type": f"missing_{field}",
                            "field": field,
                            "message": f"{field.replace('_', ' ').title()} is required",
                        })
                        validation_error_rows.add(row_number)
                        continue

                # Check for CSV duplicates
                for field in unique_fields:
                    csv_col = reverse_mappings.get(field)
                    if csv_col:
                        value = row.get(csv_col, "").strip().lower()
                        if value in csv_duplicates[field]:
                            other_rows = [
                                r for r in csv_duplicates[field][value]
                                if r != row_number
                            ]
                            if other_rows:
                                conflicts.append({
                                    "row_number": row_number,
                                    "conflict_type": "csv_duplicate",
                                    "field": field,
                                    "value": value,
                                    "message": f"Duplicate {field} in CSV at rows {', '.join(map(str, other_rows))}",
                                })
                                conflict_rows.add(row_number)

                # Check for database conflicts
                for field in unique_fields:
                    csv_col = reverse_mappings.get(field)
                    if csv_col:
                        value = row.get(csv_col, "").strip().lower()
                        if value and value in existing_records.get(field, {}):
                            existing = existing_records[field][value]
                            conflicts.append({
                                "row_number": row_number,
                                "conflict_type": f"duplicate_{field}",
                                "field": field,
                                "value": value,
                                "existing_id": existing["id"],
                                "message": f"{field.replace('_', ' ').title()} '{value}' already exists",
                            })
                            conflict_rows.add(row_number)

            # Calculate counts
            total_skipped = conflict_rows | validation_error_rows
            valid_rows = len(rows) - len(total_skipped)

            return {
                "has_conflicts": len(conflicts) > 0,
                "conflicts": conflicts,
                "validation_errors": validation_errors,
                "valid_rows_count": valid_rows,
                "conflict_rows_count": len(conflict_rows),
                "error_rows_count": len(validation_error_rows),
                "skipped_rows_count": len(total_skipped),
            }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error validating data: {str(e)}",
            )

    async def execute(
        self,
        company_id: str,
        mappings: dict[str, str],
        rows: list[dict[str, str]],
        supabase: Client,
        skip_conflicts: bool = False,
        **kwargs: Any,
    ) -> dict:
        """Execute the import.

        Args:
            company_id: Company ID for database inserts
            mappings: Dictionary mapping CSV columns to database fields
            rows: CSV rows to import
            supabase: Supabase client for database operations
            skip_conflicts: If True, skip rows with conflicts
            **kwargs: Module-specific options (e.g., pricing_pairs for parts)

        Returns:
            Dictionary with:
            - success: Boolean indicating success
            - imported_count: Number of rows imported
            - skipped_count: Number of rows skipped
            - errors: List of import errors
        """
        try:
            # First validate
            validate_response = await self.validate(
                company_id=company_id,
                mappings=mappings,
                rows=rows,
                supabase=supabase,
                **kwargs,
            )

            # If conflicts exist and we're not skipping them, fail
            if validate_response["has_conflicts"] and not skip_conflicts:
                raise HTTPException(
                    status_code=400,
                    detail="Conflicts detected. Set skip_conflicts=true to import non-conflicting rows only.",
                )

            # Build set of rows to skip
            skip_row_numbers = {c["row_number"] for c in validate_response["conflicts"]}
            skip_row_numbers |= {e["row_number"] for e in validate_response["validation_errors"]}

            # Reverse mappings: db_field -> csv_column
            reverse_mappings = {v: k for k, v in mappings.items() if v}

            # Prepare rows for insertion
            rows_to_insert = []
            skipped = 0

            for i, row in enumerate(rows):
                row_number = i + 1

                # Skip rows that failed validation or have conflicts
                if row_number in skip_row_numbers:
                    skipped += 1
                    continue

                # Build record
                record = {self.config.company_id_field: company_id}

                # Map fields
                for field_name, field_def in self.config.schema.items():
                    csv_col = reverse_mappings.get(field_name)
                    if csv_col and csv_col in row:
                        value = row[csv_col].strip()
                        if value:
                            # Apply field transform if defined
                            if field_def.transform:
                                value = field_def.transform(value)
                            elif field_def.type == "number":
                                try:
                                    value = round(float(value), 2)
                                except ValueError:
                                    continue
                            record[field_name] = value

                # Apply default values
                for field, default in self.config.default_values.items():
                    if field not in record:
                        record[field] = default

                # Apply module-specific transformation
                if self.config.pre_insert_transform:
                    record = self.config.pre_insert_transform(record, **kwargs)

                rows_to_insert.append(record)

            # Bulk insert
            imported_count = 0
            errors: list[dict] = []

            if rows_to_insert:
                try:
                    response = supabase.table(self.config.table_name).insert(rows_to_insert).execute()
                    imported_count = len(response.data) if response.data else 0
                except Exception as e:
                    error_str = str(e)
                    # Check for unique constraint violation
                    if "23505" in error_str or "duplicate key" in error_str.lower():
                        raise HTTPException(
                            status_code=400,
                            detail="Import failed: A record with this identifier already exists.",
                        )
                    raise HTTPException(
                        status_code=500,
                        detail="Database error occurred during import. Please try again.",
                    )

            return {
                "success": True,
                "imported_count": imported_count,
                "skipped_count": skipped,
                "errors": errors,
            }

        except HTTPException:
            raise
        except Exception as e:
            import traceback
            print(f"Import execution error: {str(e)}")
            print(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail=f"An unexpected error occurred during import: {str(e)}",
            )

    async def _fetch_existing_records(
        self,
        supabase: Client,
        company_id: str,
        unique_fields: list[str],
    ) -> dict[str, dict[str, dict]]:
        """Fetch existing records for conflict detection.

        Returns a dictionary mapping field name -> value -> record
        """
        result: dict[str, dict[str, dict]] = {field: {} for field in unique_fields}

        try:
            # Build select query for unique fields
            select_fields = ["id"] + unique_fields
            response = (
                supabase.table(self.config.table_name)
                .select(",".join(select_fields))
                .eq(self.config.company_id_field, company_id)
                .execute()
            )

            for record in response.data or []:
                for field in unique_fields:
                    value = record.get(field)
                    if value:
                        result[field][str(value).lower()] = record

        except Exception:
            pass  # If fetch fails, we'll catch duplicates on insert

        return result
