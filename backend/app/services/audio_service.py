"""Audio service — orchestrates the CliniScribe pipeline.

Workflow:
  1. Librarian fetches the most relevant documentation template(s) from
     Supabase based on the chief complaint and patient demographics.
  2. CliniScribe transcribes the audio and generates a structured clinical
     note that mirrors the retrieved template's structure.
  3. Return the transcript, note, and any warnings to the caller.
"""

from typing import Optional

from google import genai

from app.agents.clini_scribe import CliniScribe
from app.agents.librarian import Librarian
from app.core.database import get_supabase_client
from app.schemas.audio import AudioProcessingInput


class AudioService:
    """Orchestrator for the audio-to-clinical-note pipeline."""

    def __init__(self) -> None:
        # Shared Gemini client — used by both agents
        gemini_client = genai.Client()

        self.librarian = Librarian(
            gemini_client=gemini_client,
            supabase_client=get_supabase_client(),
        )
        self.scribe = CliniScribe(gemini_client=gemini_client)

    def generate_note_from_audio(
        self,
        audio_path: str,
        chief_complaint: Optional[str] = None,
        age: Optional[int] = None,
        sex: Optional[str] = None,
        specialty: Optional[str] = None,
        top_k: int = 1,
        consultation_id: Optional[str] = None,
    ) -> dict:
        """Transcribe audio and generate a structured clinical note.

        The Librarian first retrieves the most relevant template from Supabase.
        CliniScribe then uses that template to structure the output note.
        If no chief_complaint is provided, CliniScribe falls back to SOAP format.

        Args:
            audio_path:       Local path to the audio file.
            chief_complaint:  Patient's presenting complaint (used for template retrieval).
            age:              Patient age (improves template matching).
            sex:              Patient sex (improves template matching).
            specialty:        Optional specialty filter for template search.
            top_k:            Number of templates to retrieve and merge (default: 1).
            consultation_id:  Optional ID to link the note to an existing record.

        Returns:
            Dictionary containing:
                - "transcript"          (str):  Verbatim transcript.
                - "clinical_note"       (str):  Structured note mirroring the template.
                - "matched_templates"   (list): Templates used to structure the note.
                - "warnings"            (list): Content that didn't map to a template section.
        """
        # 1 — Librarian retrieves and merges the most relevant template(s)
        merged_template: Optional[str] = None
        matched_templates: list = []

        if chief_complaint:
            librarian_result = self.librarian.process({
                "chief_complaint": chief_complaint,
                "age":             age,
                "sex":             sex,
                "specialty":       specialty,
                "top_k":           top_k,
            })
            merged_template   = librarian_result["merged_template"] or None
            matched_templates = librarian_result["matched_templates"]

        # 2 — CliniScribe transcribes + generates note using the retrieved template
        payload = AudioProcessingInput(
            audio_path=audio_path,
            documentation_template=merged_template,
            consultation_id=consultation_id,
        )

        result = self.scribe.process(payload.model_dump())

        # 3 — Return transcript, note, template metadata, and warnings
        return {
            "transcript":        result["transcript"],
            "clinical_note":     result["clinical_note"],
            "matched_templates": matched_templates,
            "warnings":          result["warnings"],
        }
