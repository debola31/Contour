"""Resources import module configuration.

This module defines the import configuration for the resources table,
including schema, mapping patterns, and validation rules.
"""

from ..config import FieldDefinition, ImportModuleConfig


RESOURCES_CONFIG = ImportModuleConfig(
    module_name="resources",
    table_name="resources",
    schema={
        "name": FieldDefinition(
            name="name",
            type="string",
            required=True,
            description="Resource/operation name (e.g., 'HURCO Mill', 'Mazak Lathe')",
            mapping_patterns=[
                r"^(name|resource[_\s-]?name|operation[_\s-]?name)$",
                r"^(resource|operation|work[_\s-]?center|machine)$",
                r"^(description|desc)$",  # Some shops use description as name
            ],
        ),
        "code": FieldDefinition(
            name="code",
            type="string",
            required=False,
            description="Short code/ID for display (e.g., 'HRC-M1', 'LATHE01')",
            mapping_patterns=[
                r"^(code|resource[_\s-]?(code|id)|operation[_\s-]?(code|id))$",
                r"^(id|machine[_\s-]?(code|id)|work[_\s-]?center[_\s-]?(code|id))$",
                r"^(short[_\s-]?code|abbreviation|abbrev)$",
            ],
        ),
        "labor_rate": FieldDefinition(
            name="labor_rate",
            type="number",
            required=False,
            description="Hourly labor rate in dollars (e.g., 135.00)",
            mapping_patterns=[
                r"^(labor[_\s-]?rate|rate|hourly[_\s-]?rate)$",
                r"^(cost[_\s-]?per[_\s-]?hour|hour[_\s-]?rate|$/hr)$",
                r"^(shop[_\s-]?rate|machine[_\s-]?rate|operation[_\s-]?rate)$",
            ],
        ),
        "resource_group": FieldDefinition(
            name="resource_group",
            type="string",
            required=False,
            description="Group/category name (e.g., 'CNC', 'LATHE&MILL', 'EDM')",
            mapping_patterns=[
                r"^(resource[_\s-]?group|group|category|type)$",
                r"^(department|section|area|work[_\s-]?group)$",
                r"^(operation[_\s-]?type|machine[_\s-]?type|work[_\s-]?type)$",
            ],
        ),
        "description": FieldDefinition(
            name="description",
            type="string",
            required=False,
            description="Additional notes or description",
            mapping_patterns=[
                r"^(notes?|comments?|memo|remarks?)$",
                r"^(additional[_\s-]?info|details?)$",
            ],
        ),
        "legacy_id": FieldDefinition(
            name="legacy_id",
            type="string",
            required=False,
            description="ID from legacy/previous system (preserved in metadata)",
            mapping_patterns=[
                r"^(legacy[_\s-]?id|old[_\s-]?id|previous[_\s-]?id)$",
                r"^(external[_\s-]?id|source[_\s-]?id|orig[_\s-]?id)$",
            ],
        ),
    },
    unique_fields=["name"],
    domain_hints=[
        "resource",
        "operation",
        "machine",
        "work center",
        "labor",
        "rate",
        "hourly",
        "cnc",
        "lathe",
        "mill",
        "edm",
        "grinding",
        "assembly",
        "inspection",
    ],
    default_values={},
    company_id_field="company_id",
)
