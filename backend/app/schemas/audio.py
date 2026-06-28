"""Audio request/response schemas."""

from typing import Dict, List, Optional, Union

from pydantic import BaseModel, Field


class AudioSchema(BaseModel):
    id: Optional[int] = None
    consultation_id: Optional[int] = None
    transcript: Optional[str] = None
    url: Optional[str] = None

class AudioProcessingInput(BaseModel):
    audio_path: str = Field(..., description="Local file path to the audio recording.")
    documentation_template: Optional[str] = Field(
        None,
        description="Text of a completed sample clerking note used to mirror structure."
    )
    consultation_id: Optional[str] = Field(
        None,
        description="Associated consultation ID for linking the note to the record."
    )


class ExtractedTranscription(BaseModel):
    transcript: str = Field(..., description="Verbatim transcript of the audio.")
    language: Optional[str] = Field("en", description="Detected language of the audio.")
    confidence: Optional[float] = Field(
        None, description="Transcription confidence (1.0 = Gemini native, no score exposed)."
    )


class ClinicalNoteDraft(BaseModel):
    clinical_note: str = Field(
        ...,
        description="Full structured note mirroring the template's structure."
    )
    warnings: List[str] = Field(
        default_factory=list,
        description="Clinically significant content from transcript that didn't fit the template."
    )

# ---------------------------------------------------------------------------
# Route Response schema
# ---------------------------------------------------------------------------

class GenerateNoteResponse(BaseModel):
    transcript: str
    clinical_note: str
    warnings: list[str]
    consultation_id: str | None = None