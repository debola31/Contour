"""Configuration classes for the generic import framework.

This module defines the configuration structures used to customize
the import behavior for different data modules (customers, parts, etc.).
"""

from dataclasses import dataclass, field
from typing import Optional, Callable, Any


@dataclass
class FieldDefinition:
    """Definition for a target database field.

    Attributes:
        name: The database field name
        type: Field type ("string", "number", "boolean", "json")
        required: Whether this field is required for import
        description: Human-readable description for AI prompts
        mapping_patterns: List of regex patterns to auto-map CSV columns to this field
        transform: Optional function to transform the value before insert
    """

    name: str
    type: str  # "string", "number", "boolean", "json"
    required: bool = False
    description: str = ""
    mapping_patterns: list[str] = field(default_factory=list)
    transform: Optional[Callable[[str], Any]] = None


@dataclass
class ColumnPairConfig:
    """Configuration for detecting column pairs (e.g., qty/price).

    Attributes:
        qty_pattern: Regex pattern for quantity column (must have capture group for tier number)
        price_pattern: Regex pattern for price column (must have capture group for tier number)
        output_field: Database field to store the transformed data
        transform: Function to transform matched pairs into the final format
    """

    qty_pattern: str
    price_pattern: str
    output_field: str = "pricing"


@dataclass
class ConflictRule:
    """Rule for detecting conflicts during import.

    Attributes:
        fields: List of fields that must be unique together
        error_type: Error type identifier for frontend handling
        error_message: Template for error message (can include {field_name} placeholders)
    """

    fields: list[str]
    error_type: str
    error_message: str


@dataclass
class ImportModuleConfig:
    """Configuration for a bulk import module.

    This is the main configuration class that defines how a module's
    import should behave. Each module (customers, parts, etc.) provides
    its own configuration instance.

    Attributes:
        module_name: Identifier for this module (e.g., "customers", "parts")
        table_name: Supabase table name for inserts
        schema: Dictionary mapping field names to FieldDefinition objects
        unique_fields: List of fields that must be unique (simple uniqueness)
        composite_unique: List of field tuples for composite uniqueness
        conflict_rules: List of ConflictRule objects for validation
        column_pair_config: Optional config for detecting column pairs (like qty/price)
        pre_insert_transform: Optional function to transform row before insert
        domain_hints: List of domain-specific terms to flag columns for AI review
        default_values: Dictionary of default values for optional fields
        company_id_field: Name of the company_id field (default: "company_id")
    """

    module_name: str
    table_name: str
    schema: dict[str, FieldDefinition]
    unique_fields: list[str] = field(default_factory=list)
    composite_unique: list[tuple[str, ...]] = field(default_factory=list)
    conflict_rules: list[ConflictRule] = field(default_factory=list)
    column_pair_config: Optional[ColumnPairConfig] = None
    pre_insert_transform: Optional[Callable[[dict, Any], dict]] = None
    domain_hints: list[str] = field(default_factory=list)
    default_values: dict[str, Any] = field(default_factory=dict)
    company_id_field: str = "company_id"

    def get_required_fields(self) -> list[str]:
        """Return list of required field names."""
        return [name for name, field_def in self.schema.items() if field_def.required]

    def get_schema_dict(self) -> dict[str, dict]:
        """Convert schema to dict format expected by AI providers."""
        return {
            name: {
                "type": field_def.type,
                "required": field_def.required,
                "description": field_def.description,
            }
            for name, field_def in self.schema.items()
        }

    def get_mapping_patterns(self) -> dict[str, list[str]]:
        """Return mapping patterns organized by field name."""
        return {
            name: field_def.mapping_patterns
            for name, field_def in self.schema.items()
            if field_def.mapping_patterns
        }
