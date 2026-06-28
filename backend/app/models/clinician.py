"""Clinician model definitions."""

from typing import Optional


class Clinician:
    id: Optional[int] = None
    name: Optional[str] = None
    specialty: Optional[str] = None
