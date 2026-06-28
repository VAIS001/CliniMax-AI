"""Feedback request/response schemas."""

from typing import Optional


class FeedbackSchema:
    id: Optional[int] = None
    consultation_id: Optional[int] = None
    rating: Optional[int] = None
    comments: Optional[str] = None
