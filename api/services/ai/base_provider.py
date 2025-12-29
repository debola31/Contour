"""Abstract base class for AI providers."""

from abc import ABC, abstractmethod
from typing import Optional

from pydantic import BaseModel


class MappingSuggestion(BaseModel):
    """Result from AI column mapping analysis."""

    csv_column: str
    db_field: Optional[str]  # None means skip/discard
    confidence: float  # 0.0 to 1.0
    reasoning: str


class AIProvider(ABC):
    """Abstract base class for AI providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the name of this provider."""
        pass

    @abstractmethod
    async def suggest_column_mappings(
        self,
        csv_headers: list[str],
        sample_rows: list[list[str]],
        target_schema: dict[str, dict],
    ) -> list[MappingSuggestion]:
        """
        Analyze CSV headers and sample data to suggest column mappings.

        Args:
            csv_headers: List of column headers from the CSV
            sample_rows: First few rows of data for context
            target_schema: Dictionary describing target database fields

        Returns:
            List of MappingSuggestion objects with confidence scores
        """
        pass
