"""Generic Import Framework for AI-assisted CSV bulk uploads.

This framework provides a standardized approach to CSV import with:
- Hybrid AI column mapping (rule-based pre-filter + AI for uncertain columns)
- Consistent caching, rate limiting, and error handling
- Pluggable module configurations for different data types

Usage:
    from services.import_framework import GenericImportService, CUSTOMERS_CONFIG

    service = GenericImportService(CUSTOMERS_CONFIG)
    result = await service.analyze(company_id, headers, sample_rows, supabase)
"""

from .config import FieldDefinition, ImportModuleConfig, ColumnPairConfig
from .service import GenericImportService
from .classifier import ColumnClassification, classify_columns_generic, detect_column_pairs
from .modules import CUSTOMERS_CONFIG, PARTS_CONFIG

__all__ = [
    # Config classes
    "FieldDefinition",
    "ImportModuleConfig",
    "ColumnPairConfig",
    # Service
    "GenericImportService",
    # Classifier
    "ColumnClassification",
    "classify_columns_generic",
    "detect_column_pairs",
    # Module configs
    "CUSTOMERS_CONFIG",
    "PARTS_CONFIG",
]
