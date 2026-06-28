"""Audio-related API routes."""

import shutil
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.services.audio_service import AudioService

router = APIRouter(prefix="/audio", tags=["Audio"])

UPLOAD_DIR = Path("tmp/audio_uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def get_audio_service() -> AudioService:
    return AudioService()


class GenerateNoteResponse(BaseModel):
    transcript:        str
    clinical_note:     str
    matched_templates: list
    warnings:          list[str]
    consultation_id:   Optional[str] = None


@router.post(
    "/generate-note",
    response_model=GenerateNoteResponse,
    status_code=status.HTTP_200_OK,
    summary="Transcribe an audio recording and generate a structured clinical note.",
)
async def generate_note_from_audio(
    audio_file:       UploadFile      = File(..., description="Audio recording of the consultation."),
    chief_complaint:  Optional[str]   = Form(None, description="Patient's presenting complaint. Used to retrieve the most relevant template from Supabase."),
    age:              Optional[int]   = Form(None, description="Patient age. Improves template matching."),
    sex:              Optional[str]   = Form(None, description="Patient sex. Improves template matching."),
    specialty:        Optional[str]   = Form(None, description="Medical specialty filter for template retrieval."),
    top_k:            int             = Form(1,    description="Number of templates to retrieve and merge (min: 1)."),
    consultation_id:  Optional[str]   = Form(None, description="Links the note to an existing consultation record."),
    service:          AudioService    = Depends(get_audio_service),
) -> GenerateNoteResponse:
    """
    Upload an audio file and receive a structured clinical note.

    The Librarian retrieves the most relevant template from Supabase using the
    **chief_complaint** and patient demographics. CliniScribe then mirrors that
    template's structure in the output note. If no chief_complaint is provided,
    the note falls back to standard SOAP format.
    """
    suffix    = Path(audio_file.filename).suffix if audio_file.filename else ".audio"
    temp_path = UPLOAD_DIR / f"{uuid.uuid4()}{suffix}"

    try:
        with temp_path.open("wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)

        result = service.generate_note_from_audio(
            audio_path=str(temp_path),
            chief_complaint=chief_complaint,
            age=age,
            sex=sex,
            specialty=specialty,
            top_k=top_k,
            consultation_id=consultation_id,
        )

    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Processing error: {e}")
    finally:
        if temp_path.exists():
            temp_path.unlink()

    return GenerateNoteResponse(
        transcript=result["transcript"],
        clinical_note=result["clinical_note"],
        matched_templates=result["matched_templates"],
        warnings=result["warnings"],
        consultation_id=consultation_id,
    )