"""Module configurations for the generic import framework.

Each module provides an ImportModuleConfig that defines the import behavior.
"""

from .customers import CUSTOMERS_CONFIG
from .parts import PARTS_CONFIG

__all__ = [
    "CUSTOMERS_CONFIG",
    "PARTS_CONFIG",
]
