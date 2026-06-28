"""Validator business logic."""

from typing import Any, Dict, List, Tuple


def validate_note(note: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """Validate a note payload.

    Args:
        note: A dictionary representing the note.

    Returns:
        A tuple where the first value is True when valid, and the second value is a list of validation errors or alerts.
    """
    errors: List[str] = []

    if not isinstance(note, dict):
        return False, ["Note must be a dict."]

    title = note.get("title")
    content = note.get("content")

    if title is None or not isinstance(title, str) or not title.strip():
        errors.append("Title is required and must be a non-empty string.")

    if content is None or not isinstance(content, str) or not content.strip():
        errors.append("Content is required and must be a non-empty string.")

    if "tags" in note and not isinstance(note["tags"], list):
        errors.append("Tags must be a list if provided.")

    if "metadata" in note and not isinstance(note["metadata"], dict):
        errors.append("Metadata must be a dict if provided.")

    return len(errors) == 0, errors