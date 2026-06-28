# app/schemas/librarian.py

from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional


class LibrarianInput(BaseModel):
    chief_complaint: str = Field(..., description="Patient's presenting complaint.")
    age:             Optional[int] = Field(None, description="Patient age.")
    sex:             Optional[str] = Field(None, description="Patient sex.")
    specialty:       Optional[str] = Field(None, description="Medical specialty filter.")
    top_k:           int           = Field(1, ge=1, description="Number of templates to retrieve and merge.")


class MatchedTemplate(BaseModel):
    id:         str
    title:      str
    specialty:  Optional[str]
    tags:       List[str]
    content:    str            # full text of the sample clerking note
    similarity: float          # cosine similarity score (0–1, higher = better match)


class LibrarianOutput(BaseModel):
    merged_template:    str = Field(..., description="Unified template text for downstream agents.")
    matched_templates:  List[MatchedTemplate]
    retrieval_metadata: Dict[str, Any]


# --- Admin upload schema ---

class TemplateUploadRequest(BaseModel):
    title:     str            = Field(..., description="Descriptive name for the template.")
    content:   str            = Field(..., description="Full text of the completed sample clerking note.")
    specialty: Optional[str]  = Field(None, description="Medical specialty.")
    tags:      List[str]      = Field(default_factory=list, description="Keywords for filtering.")


class TemplateUploadResponse(BaseModel):
    id:        str
    title:     str
    specialty: Optional[str]
    tags:      List[str]
    created_at: str


class TemplateUpdateRequest(BaseModel):
    """All fields optional — only provided fields are updated."""
    title:     Optional[str]       = Field(None, description="New title for the template.")
    content:   Optional[str]       = Field(None, description="Updated clerking note text. Triggers re-embedding.")
    specialty: Optional[str]       = Field(None, description="Updated medical specialty.")
    tags:      Optional[List[str]] = Field(None, description="Replacement tag list.")