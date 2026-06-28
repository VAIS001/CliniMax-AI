##clini_scribe.py
"""CliniScribe agent for audio transcription and clinical note generation.

Two-stage pipeline:
  1. Transcribe  — upload audio via Gemini Files API, extract verbatim transcript
  2. Document    — use transcript + physician template to produce a structured note
                   that mirrors the template's structure exactly (same goal as CliniClerker)
"""

import time
from pathlib import Path
from typing import Any, Dict, Optional

from google import genai
from google.genai import types

from app.agents.base_agent import BaseAgent
from app.core.prompt_loader import render_prompt
from app.schemas.audio import AudioProcessingInput, ClinicalNoteDraft, ExtractedTranscription


# ---------------------------------------------------------------------------
# Supported audio MIME types for Gemini Files API
# ---------------------------------------------------------------------------
AUDIO_MIME_TYPES: Dict[str, str] = {
    ".mp3":  "audio/mpeg",
    ".mp4":  "audio/mp4",
    ".m4a":  "audio/mp4",
    ".wav":  "audio/wav",
    ".ogg":  "audio/ogg",
    ".opus": "audio/opus",
    ".aac":  "audio/aac",
    ".flac": "audio/flac",
    ".webm": "audio/webm",
}


class CliniScribe(BaseAgent):
    """Agent responsible for audio transcription and structured note generation.

    Pipeline
    --------
    1. Upload the local audio file to the Gemini Files API.
    2. Ask Gemini to produce a clean, verbatim transcript.
    3. Ask Gemini to produce a clinical note that mirrors the physician's
       template structure, using only what was said in the transcript.
    4. Clean up the uploaded file from Gemini's servers.

    Attributes:
        client:      google.genai Client instance.
        model:       Gemini model string to use for both stages.
        agent_name:  Name identifier for logging and debugging.
    """

    MODEL = "models/gemini-2.5-flash-lite"

    def __init__(self, gemini_client: Any, agent_name: str = "CliniScribe") -> None:
        super().__init__(gemini_client, agent_name)
        # gemini_client here is a google.genai.Client instance
        self.client: genai.Client = gemini_client

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Transcribe audio and generate a structured clinical note.

        Args:
            data: Dictionary containing:
                - "audio_path" (str):          Local path to the audio file.
                - "documentation_template" (str, optional):
                                               Text of a completed sample clerking
                                               note — used to mirror structure.
                - "consultation_id" (str, optional): For logging / linking.

        Returns:
            Dictionary containing:
                - "transcript"     (str):  Verbatim transcript from the audio.
                - "clinical_note"  (str):  Structured note mirroring the template.
                - "warnings"       (list): Any concerns raised during processing.
        """
        payload = AudioProcessingInput.model_validate(data)

        # Stage 1 — upload and transcribe
        transcription = self.transcribe_audio(payload)

        # Stage 2 — generate structured documentation
        note_draft = self.generate_clinical_note(
            transcription=transcription,
            documentation_template=payload.documentation_template,
            consultation_id=payload.consultation_id,
        )

        return {
            "transcript":    transcription.transcript,
            "clinical_note": note_draft.clinical_note,
            "warnings":      note_draft.warnings,
        }

    # ------------------------------------------------------------------
    # Stage 1 — Transcription
    # ------------------------------------------------------------------

    def transcribe_audio(self, payload: AudioProcessingInput) -> ExtractedTranscription:
        """Upload audio to Gemini Files API and extract a verbatim transcript.

        The file is uploaded once, transcribed, then immediately deleted from
        Gemini's servers to respect patient data privacy.
        """
        audio_path = Path(payload.audio_path)

        if not audio_path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        mime_type = AUDIO_MIME_TYPES.get(audio_path.suffix.lower())
        if not mime_type:
            raise ValueError(
                f"Unsupported audio format '{audio_path.suffix}'. "
                f"Supported: {list(AUDIO_MIME_TYPES.keys())}"
            )

        # --- Upload ---
        uploaded_file = self.client.files.upload(
            file=audio_path,
            config=types.UploadFileConfig(mime_type=mime_type),
        )

        # Wait until Gemini has finished processing the file
        while uploaded_file.state.name == "PROCESSING":
            time.sleep(2)
            uploaded_file = self.client.files.get(name=uploaded_file.name)

        if uploaded_file.state.name == "FAILED":
            raise RuntimeError(f"Gemini file processing failed for: {audio_path.name}")

        try:
            # --- Transcribe ---
            transcription_prompt = render_prompt("transcription_prompt.md")

            response = self.client.models.generate_content(
                model=self.MODEL,
                contents=[
                    types.Part.from_uri(
                        file_uri=uploaded_file.uri,
                        mime_type=mime_type,
                    ),
                    transcription_prompt,
                ],
            )

            return ExtractedTranscription(
                transcript=response.text.strip(),
                language="en",
                confidence=1.0,  # Gemini does not expose confidence scores
            )

        finally:
            # Always delete — even if transcription fails
            self.client.files.delete(name=uploaded_file.name)

    # ------------------------------------------------------------------
    # Stage 2 — Clinical Note Generation
    # ------------------------------------------------------------------

    def generate_clinical_note(
        self,
        transcription: ExtractedTranscription,
        documentation_template: Optional[str] = None,
        consultation_id: Optional[str] = None,
    ) -> ClinicalNoteDraft:
        """Generate a structured clinical note from the transcript.

        The note mirrors the section headings, ordering, and style of
        the provided documentation_template. If no template is given,
        falls back to a standard SOAP note structure.
        """
        note_prompt = render_prompt(
            "scribe_prompt.md",
            transcript=transcription.transcript,
            documentation_template=documentation_template or "NOT PROVIDED",
        )

        response = self.client.models.generate_content(
            model=self.MODEL,
            contents=note_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ClinicalNoteDraft,
            ),
        )

        return ClinicalNoteDraft.model_validate_json(response.text)

    # ------------------------------------------------------------------
    # Validation (called by Validator agent downstream)
    # ------------------------------------------------------------------

    def validate_note_structure(
        self, note: str, template: Optional[str] = None
    ) -> Dict[str, Any]:
        """Surface-level structural check before the Validator agent runs."""
        missing = []
        if template:
            # Check that major section headings from the template appear in the note
            import re
            headings = re.findall(r"^#{1,3}\s+(.+)$", template, re.MULTILINE)
            missing = [h for h in headings if h.lower() not in note.lower()]

        return {
            "is_valid": len(missing) == 0,
            "missing_sections": missing,
            "compliance_issues": [],
        }