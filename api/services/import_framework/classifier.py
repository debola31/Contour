"""Generic rule-based column classifier for CSV import pre-processing.

This module provides pattern-based classification of CSV columns that works
with any schema. It identifies:
- Columns that should be auto-skipped (system/internal columns)
- Columns that match schema-defined patterns (high-confidence mappings)
- Columns that need AI evaluation (ambiguous or potentially relevant)

The hybrid approach allows processing of large CSVs (150+ columns) efficiently
by only sending uncertain columns to the AI provider.
"""

import re
from dataclasses import dataclass
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .config import ImportModuleConfig

# Universal skip patterns (apply to ALL modules)
UNIVERSAL_SKIP_PATTERNS = [
    r"^(id|uuid|guid)$",  # Primary keys
    r"^(created|updated|modified|deleted)_(at|on|date|time)$",
    r"^(row_?id|record_?id|internal_?id|system_?id)$",
    r"^(import|export|sync)_(id|date|time|status)$",
    r"^_",  # Underscore prefix = internal
    r"^(legacy|old|deprecated|archive)_",  # Legacy prefixes
    r"(timestamp|datetime)$",
    r"^(last_?modified|date_?added|date_?created)$",
    r"^(is_?active|is_?deleted|is_?archived|active|deleted|archived)$",  # Flags
    r"^(version|revision|seq|sequence)(_?num(ber)?)?$",  # Version tracking
    r"^(hash|checksum|md5|sha\d*)$",  # Checksums
    r"^(sort_?order|display_?order|order_?num)$",  # Ordering columns
]

# Patterns for columns that need sample data analysis (AI territory)
UNCERTAIN_INDICATORS = [
    r"(custom|misc|other|extra|additional)",  # Generic column names
    r"^(field|column|col|data|value)\d*$",  # Numbered generic fields
    r"^[a-z]{1,3}\d+$",  # Cryptic codes like "ab1", "x42"
    r"^(attr|attribute|prop|property)\d*$",  # Attribute columns
]


@dataclass
class ColumnClassification:
    """Result of rule-based column classification.

    Attributes:
        csv_column: Original CSV column header name
        db_field: Mapped database field (None = skip)
        confidence: Confidence score 0.0-1.0
        reasoning: Human-readable explanation of classification
        needs_ai: Whether this column should be sent to AI for evaluation
    """

    csv_column: str
    db_field: Optional[str]  # None = skip, str = mapped field
    confidence: float  # 0.0-1.0
    reasoning: str
    needs_ai: bool  # True if AI should evaluate this column


def classify_columns_generic(
    headers: list[str],
    sample_rows: list[list[str]],
    config: "ImportModuleConfig",
    skip_columns: set[str] | None = None,
) -> tuple[list[ColumnClassification], list[str]]:
    """
    Generic column classifier that works with any module schema.

    Uses a tiered approach:
    1. Pre-skip columns (e.g., pricing columns handled separately)
    2. Universal skip patterns (system columns)
    3. Schema-specific mapping patterns
    4. Sample value analysis (empty/constant detection)
    5. Uncertain indicators (send to AI)
    6. Domain hint matching (send to AI)
    7. Default: skip with medium confidence

    Args:
        headers: CSV column header names
        sample_rows: First 5 rows of sample data
        config: Module configuration with schema and domain hints
        skip_columns: Set of column names already handled (e.g., pricing pairs)

    Returns:
        Tuple of (resolved_classifications, uncertain_headers)
        - resolved_classifications: Columns classified by rules (no AI needed)
        - uncertain_headers: Column names that need AI evaluation
    """
    resolved = []
    uncertain_headers = []
    skip_columns = skip_columns or set()

    # Get mapping patterns from config
    mapping_patterns = config.get_mapping_patterns()
    domain_hints = config.domain_hints

    for i, header in enumerate(headers):
        # Pre-classified columns (e.g., pricing)
        if header in skip_columns:
            resolved.append(
                ColumnClassification(
                    csv_column=header,
                    db_field=None,
                    confidence=1.0,
                    reasoning="Pre-classified (handled separately)",
                    needs_ai=False,
                )
            )
            continue

        # Get sample values for this column
        sample_values = [row[i] if i < len(row) else "" for row in sample_rows[:5]]

        classification = _classify_single_column(
            header=header,
            sample_values=sample_values,
            mapping_patterns=mapping_patterns,
            domain_hints=domain_hints,
        )

        if classification.needs_ai:
            uncertain_headers.append(header)
        else:
            resolved.append(classification)

    return resolved, uncertain_headers


def _classify_single_column(
    header: str,
    sample_values: list[str],
    mapping_patterns: dict[str, list[str]],
    domain_hints: list[str],
) -> ColumnClassification:
    """Classify a single column using universal + schema-specific patterns.

    Args:
        header: Column header name
        sample_values: Sample values from this column
        mapping_patterns: Schema field patterns from config
        domain_hints: Domain-specific terms to flag for AI review

    Returns:
        ColumnClassification with mapping result or needs_ai flag
    """
    header_lower = header.lower().strip()
    header_normalized = re.sub(r"[\s_-]+", "_", header_lower)

    # 1. Check universal skip patterns (system columns)
    for pattern in UNIVERSAL_SKIP_PATTERNS:
        if re.match(pattern, header_normalized, re.IGNORECASE):
            return ColumnClassification(
                csv_column=header,
                db_field=None,
                confidence=0.95,
                reasoning="Auto-skip: system column pattern",
                needs_ai=False,
            )

    # 2. Check schema-specific mapping patterns
    for field_name, patterns in mapping_patterns.items():
        for pattern in patterns:
            if re.match(pattern, header_normalized, re.IGNORECASE):
                return ColumnClassification(
                    csv_column=header,
                    db_field=field_name,
                    confidence=0.95,
                    reasoning=f"Auto-mapped: matches {field_name} pattern",
                    needs_ai=False,
                )

    # 3. Check sample values (empty/constant = skip)
    non_empty = [v for v in sample_values if v and v.strip()]
    if not non_empty:
        return ColumnClassification(
            csv_column=header,
            db_field=None,
            confidence=0.8,
            reasoning="Auto-skip: all sample values empty",
            needs_ai=False,
        )

    if len(set(non_empty)) == 1 and len(non_empty) >= 3:
        return ColumnClassification(
            csv_column=header,
            db_field=None,
            confidence=0.7,
            reasoning="Auto-skip: all sample values identical (likely constant)",
            needs_ai=False,
        )

    # 4. Check uncertain indicators - these NEED AI
    for pattern in UNCERTAIN_INDICATORS:
        if re.search(pattern, header_normalized, re.IGNORECASE):
            return ColumnClassification(
                csv_column=header,
                db_field=None,
                confidence=0.0,
                reasoning="Needs AI: ambiguous column name",
                needs_ai=True,
            )

    # 5. Check domain hints - might be relevant, send to AI
    if domain_hints:
        might_be_relevant = any(hint in header_lower for hint in domain_hints)
        if might_be_relevant:
            return ColumnClassification(
                csv_column=header,
                db_field=None,
                confidence=0.0,
                reasoning="Needs AI: may contain relevant domain data",
                needs_ai=True,
            )

    # 6. Default: likely irrelevant, skip with medium confidence
    return ColumnClassification(
        csv_column=header,
        db_field=None,
        confidence=0.6,
        reasoning="Auto-skip: no recognized pattern, likely irrelevant",
        needs_ai=False,
    )


def detect_column_pairs(
    headers: list[str],
    qty_pattern: str,
    price_pattern: str,
) -> tuple[list[tuple[str, str]], set[str]]:
    """
    Detect column pairs like qty1/price1, qty2/price2.

    Args:
        headers: CSV column header names
        qty_pattern: Regex pattern for quantity column (with capture group for tier number)
        price_pattern: Regex pattern for price column (with capture group for tier number)

    Returns:
        Tuple of (matched_pairs, matched_column_names)
        - matched_pairs: List of (qty_col, price_col) tuples sorted by tier number
        - matched_column_names: Set of all matched column names
    """
    pricing_pairs: list[tuple[int, str, str]] = []  # (tier_num, qty_col, price_col)
    headers_lower = {h.lower().replace(" ", ""): h for h in headers}
    matched_columns: set[str] = set()

    qty_regex = re.compile(qty_pattern, re.IGNORECASE)
    price_regex = re.compile(price_pattern, re.IGNORECASE)

    # Find all qty columns matching the pattern
    for header_lower, original in headers_lower.items():
        if original in matched_columns:
            continue

        qty_match = qty_regex.match(header_lower)
        if qty_match:
            tier_num = int(qty_match.group(1))
            # Look for matching price column
            for price_lower, price_original in headers_lower.items():
                if price_original in matched_columns:
                    continue

                price_match = price_regex.match(price_lower)
                if price_match and int(price_match.group(1)) == tier_num:
                    pricing_pairs.append((tier_num, original, price_original))
                    matched_columns.add(original)
                    matched_columns.add(price_original)
                    break

    # Sort by tier number and return
    pricing_pairs.sort(key=lambda x: x[0])
    return [(qty, price) for _, qty, price in pricing_pairs], matched_columns
