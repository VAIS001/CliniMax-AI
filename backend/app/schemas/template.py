"""Template request/response schemas."""

from typing import Optional


class TemplateSchema:
    id: Optional[int] = None
    name: Optional[str] = None
    content: Optional[str] = None
