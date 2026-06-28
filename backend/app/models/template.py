"""Template model definitions."""

from typing import Optional


class Template:
    id: Optional[int] = None
    name: Optional[str] = None
    content: Optional[str] = None
