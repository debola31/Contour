"""Parts import module configuration.

This module defines the import configuration for the parts table,
including schema, mapping patterns, pricing column pair detection,
and the pricing-to-JSONB transformation.
"""

from typing import Any

from ..config import FieldDefinition, ImportModuleConfig, ColumnPairConfig


def transform_pricing_to_jsonb(
    record: dict,
    pricing_pairs: list[tuple[str, str]] | None = None,
    row_data: dict[str, str] | None = None,
    **kwargs: Any,
) -> dict:
    """Transform qty/price column pairs to JSONB array format.

    Args:
        record: The record being prepared for insert
        pricing_pairs: List of (qty_column, price_column) tuples
        row_data: Original row data containing the pricing column values
        **kwargs: Additional keyword arguments

    Returns:
        Record with pricing field populated as JSONB array
    """
    if not pricing_pairs or not row_data:
        record["pricing"] = []
        return record

    tiers = []
    for qty_col, price_col in pricing_pairs:
        qty_str = row_data.get(qty_col, "").strip()
        price_str = row_data.get(price_col, "").strip()

        if qty_str and price_str:
            try:
                qty = int(float(qty_str))  # Handle "100.0" format
                price = round(float(price_str), 2)
                if qty > 0 and price >= 0:
                    tiers.append({"qty": qty, "price": price})
            except ValueError:
                continue  # Skip invalid values

    # Sort by quantity ascending
    tiers.sort(key=lambda t: t["qty"])
    record["pricing"] = tiers
    return record


PARTS_CONFIG = ImportModuleConfig(
    module_name="parts",
    table_name="parts",
    schema={
        "part_number": FieldDefinition(
            name="part_number",
            type="string",
            required=True,
            description="Unique part identifier (unique per customer or globally for generic parts)",
            mapping_patterns=[
                r"^part[_\s-]?(number|num|no|#|id|code)?$",
                r"^(pn|sku|item[_\s-]?(number|num|no|code)?)$",
                r"^(product[_\s-]?code|product[_\s-]?id|product[_\s-]?number)$",
                r"^(component|assembly)[_\s-]?(number|id|code)$",
                r"^(part|item|product)$",
            ],
        ),
        "customer_code": FieldDefinition(
            name="customer_code",
            type="string",
            required=False,
            description="Customer code to associate this part with (used when customer_match_mode is BY_COLUMN)",
            mapping_patterns=[
                r"^(customer[_\s-]?(code|id|number|#)?|cust[_\s-]?(code|id))$",
                r"^(client[_\s-]?(code|id)|account[_\s-]?(code|id))$",
            ],
        ),
        "description": FieldDefinition(
            name="description",
            type="string",
            required=False,
            description="Part description or name",
            mapping_patterns=[
                r"^(description|desc|part[_\s-]?desc(ription)?)$",
                r"^(name|title|label|part[_\s-]?name)$",
                r"^(product|item|part)[_\s-]?(name|description)$",
            ],
        ),
        "material_cost": FieldDefinition(
            name="material_cost",
            type="number",
            required=False,
            description="Material cost per unit (numeric, max 2 decimal places)",
            mapping_patterns=[
                r"^(material[_\s-]?cost|mat[_\s-]?cost|raw[_\s-]?cost)$",
                r"^(unit[_\s-]?cost|base[_\s-]?cost|cost[_\s-]?per[_\s-]?unit)$",
                r"^(cost|material|raw[_\s-]?material[_\s-]?cost)$",
            ],
        ),
        "notes": FieldDefinition(
            name="notes",
            type="string",
            required=False,
            description="Internal notes about this part",
            mapping_patterns=[
                r"^(notes?|comments?|remarks?|memo|internal[_\s-]?notes?)$",
            ],
        ),
    },
    unique_fields=[],  # Part uniqueness is composite (part_number + customer_id)
    composite_unique=[("part_number", "customer_id")],
    column_pair_config=ColumnPairConfig(
        qty_pattern=r"^(?:qty|quantity|minqty|min_qty_?)(\d+)$",
        price_pattern=r"^(?:price|unitprice|unit_price_?)(\d+)$",
        output_field="pricing",
    ),
    pre_insert_transform=transform_pricing_to_jsonb,
    domain_hints=[
        "part", "product", "item", "component", "assembly",
        "sku", "material", "cost", "price", "qty", "quantity",
        "customer", "client", "description", "note",
    ],
    default_values={},
    company_id_field="company_id",
)
