"""Claude (Anthropic) AI provider implementation."""

import json
import os
from typing import Optional

import anthropic

from .base_provider import AIProvider, MappingSuggestion


MAPPING_PROMPT_TEMPLATE = """You are analyzing a CSV file to map columns to a customer database schema for a manufacturing ERP system.

## Target Database Schema:
{schema_json}

## CSV Headers:
{headers_json}

## Sample Data (first few rows):
{sample_data}

## Instructions:
1. Map each CSV column to a database field, or null if it should be skipped
2. Provide a confidence score (0.0-1.0) based on:
   - 1.0: Exact name match or unambiguous (e.g., "email" -> "email")
   - 0.8-0.99: Very likely match (e.g., "Company" -> "name", "Tel" -> "phone")
   - 0.5-0.79: Probable match with some ambiguity (e.g., "Phone1" could be "phone" or "contact_phone")
   - 0.1-0.49: Uncertain, needs human review
   - 0.0: No reasonable mapping, should be skipped

3. Consider the sample data to help determine mappings
4. Only use database fields from the schema - do not invent new fields

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{{
  "mappings": [
    {{"csv_column": "Company Name", "db_field": "name", "confidence": 0.95, "reasoning": "Direct match for company/customer name"}},
    {{"csv_column": "Internal ID", "db_field": null, "confidence": 0.0, "reasoning": "Internal system field, not needed"}}
  ]
}}"""


class ClaudeProvider(AIProvider):
    """Claude (Anthropic) AI provider."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        """Initialize Claude provider.

        Args:
            api_key: Anthropic API key. If not provided, uses ANTHROPIC_API_KEY env var.
            model: Model to use. Defaults to claude-sonnet-4-20250514.
        """
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY is required")

        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model = model or "claude-sonnet-4-20250514"

    @property
    def provider_name(self) -> str:
        return "anthropic"

    async def suggest_column_mappings(
        self,
        csv_headers: list[str],
        sample_rows: list[list[str]],
        target_schema: dict[str, dict],
    ) -> list[MappingSuggestion]:
        """Analyze CSV and suggest column mappings using Claude."""

        # Format sample data as a readable table
        sample_data_lines = []
        for i, row in enumerate(sample_rows[:5]):  # Limit to 5 rows
            row_data = ", ".join(
                f"{csv_headers[j]}: {row[j]}" if j < len(row) else f"{csv_headers[j]}: (empty)"
                for j in range(len(csv_headers))
            )
            sample_data_lines.append(f"Row {i + 1}: {row_data}")
        sample_data = "\n".join(sample_data_lines)

        # Build the prompt
        prompt = MAPPING_PROMPT_TEMPLATE.format(
            schema_json=json.dumps(target_schema, indent=2),
            headers_json=json.dumps(csv_headers),
            sample_data=sample_data,
        )

        # Call Claude API (sync for now, can be made async with httpx)
        response = self.client.messages.create(
            model=self.model,
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )

        # Parse response
        response_text = response.content[0].text.strip()

        # Try to extract JSON from the response
        try:
            # Handle potential markdown code blocks
            if response_text.startswith("```"):
                lines = response_text.split("\n")
                json_lines = []
                in_json = False
                for line in lines:
                    if line.startswith("```") and not in_json:
                        in_json = True
                        continue
                    elif line.startswith("```") and in_json:
                        break
                    elif in_json:
                        json_lines.append(line)
                response_text = "\n".join(json_lines)

            data = json.loads(response_text)
            mappings = []

            for item in data.get("mappings", []):
                mappings.append(
                    MappingSuggestion(
                        csv_column=item["csv_column"],
                        db_field=item.get("db_field"),
                        confidence=float(item.get("confidence", 0.5)),
                        reasoning=item.get("reasoning", ""),
                    )
                )

            return mappings

        except (json.JSONDecodeError, KeyError) as e:
            # If parsing fails, return low-confidence mappings for all columns
            return [
                MappingSuggestion(
                    csv_column=header,
                    db_field=None,
                    confidence=0.0,
                    reasoning=f"AI response parsing failed: {str(e)}",
                )
                for header in csv_headers
            ]
