"""Feedback model definitions."""

from typing import Optional


class Feedback:
    id: Optional[int] = None
    consultation_id: Optional[int] = None
    rating: Optional[int] = None
    comments: Optional[str] = None
