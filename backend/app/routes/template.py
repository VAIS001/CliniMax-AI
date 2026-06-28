"""Admin routes for clinical template management."""

import shutil
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.agents.librarian import Librarian
from app.core.dependencies import get_librarian
from app.schemas.librarian import (
    TemplateUploadRequest,
    TemplateUploadResponse,
    TemplateUpdateRequest,
)

router = APIRouter(prefix="/templates", tags=["Templates (Admin)"])

IMAGE_UPLOAD_DIR = Path("tmp/template_images")
IMAGE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

SUPPORTED_IMAGE_TYPES = {
    "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"
}


# ---------------------------------------------------------------------------
# POST /templates/
# Upload a template as raw text
# ---------------------------------------------------------------------------

@router.post(
    "/",
    response_model=TemplateUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a new clinical template as text.",
)
def upload_template(
    body: TemplateUploadRequest,
    librarian: Librarian = Depends(get_librarian),
    # TODO: restrict to physicians/admins
    # current_user = Depends(get_current_physician),
) -> TemplateUploadResponse:
    """
    Embed and store a new clinical template in Supabase.

    - **title**: Descriptive name (e.g. "Chest Pain Clerking — Cardiology").
    - **content**: Full text of a completed sample clerking note for this condition.
    - **specialty**: Optional medical specialty label for filtering.
    - **tags**: Optional keywords (e.g. ["chest pain", "cardiac", "STEMI"]).
    """
    try:
        result = librarian.upload_template(
            title=body.title,
            content=body.content,
            specialty=body.specialty,
            tags=body.tags,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Template upload failed: {e}",
        )

    return TemplateUploadResponse(**result)


# ---------------------------------------------------------------------------
# POST /templates/from-image
# Upload a template as an image — Gemini extracts the text
# ---------------------------------------------------------------------------

@router.post(
    "/from-image",
    response_model=TemplateUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a clinical template as an image. Gemini extracts the text.",
)
async def upload_template_from_image(
    image_file: UploadFile = File(..., description="Image of the completed sample clerking note (JPEG, PNG, WEBP, HEIC)."),
    title: str = Form(..., description="Descriptive name for the template."),
    specialty: Optional[str] = Form(None, description="Medical specialty."),
    tags: Optional[str] = Form(None, description="Comma-separated keywords e.g. 'chest pain,cardiac'."),
    librarian: Librarian = Depends(get_librarian),
) -> TemplateUploadResponse:
    """
    Extract text from a template image using Gemini, then embed and store it.

    Accepts a photo or scan of a completed clerking note. Gemini reads the image
    and extracts the full text before embedding and storing it as a template.

    - **image_file**: Photo or scan of the clerking note (JPEG, PNG, WEBP, HEIC, HEIF).
    - **title**: Descriptive name for the template.
    - **specialty**: Optional medical specialty label.
    - **tags**: Optional comma-separated keywords.
    """
    if image_file.content_type not in SUPPORTED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported image type '{image_file.content_type}'. "
                f"Supported: {sorted(SUPPORTED_IMAGE_TYPES)}"
            ),
        )

    suffix = Path(image_file.filename).suffix if image_file.filename else ".jpg"
    temp_path = IMAGE_UPLOAD_DIR / f"{uuid.uuid4()}{suffix}"

    try:
        with temp_path.open("wb") as buffer:
            shutil.copyfileobj(image_file.file, buffer)

        extracted_text = librarian.extract_text_from_image(
            image_path=temp_path,
            mime_type=image_file.content_type,
        )

        parsed_tags = [t.strip() for t in tags.split(",")] if tags else []

        result = librarian.upload_template(
            title=title,
            content=extracted_text,
            specialty=specialty,
            tags=parsed_tags,
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Image extraction or upload failed: {e}",
        )
    finally:
        if temp_path.exists():
            temp_path.unlink()

    return TemplateUploadResponse(**result)


# ---------------------------------------------------------------------------
# GET /templates/{template_id}
# Retrieve a single template
# ---------------------------------------------------------------------------

@router.get(
    "/{template_id}",
    summary="Retrieve a template by ID.",
)
def get_template(
    template_id: str,
    librarian: Librarian = Depends(get_librarian),
) -> dict:
    """Fetch a single clinical template by its UUID."""
    template = librarian.get_template_by_id(template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found.",
        )
    return template


# ---------------------------------------------------------------------------
# PATCH /templates/{template_id}
# Edit a template — re-embeds if content changed
# ---------------------------------------------------------------------------

@router.patch(
    "/{template_id}",
    response_model=TemplateUploadResponse,
    summary="Edit an existing clinical template.",
)
def update_template(
    template_id: str,
    body: TemplateUpdateRequest,
    librarian: Librarian = Depends(get_librarian),
) -> TemplateUploadResponse:
    """
    Update one or more fields of an existing template.

    If **content** is updated, the embedding is automatically regenerated.
    Any field left as `null` is left unchanged.
    """
    existing = librarian.get_template_by_id(template_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found.",
        )

    try:
        result = librarian.update_template(template_id=template_id, updates=body)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Template update failed: {e}",
        )

    return TemplateUploadResponse(**result)


# ---------------------------------------------------------------------------
# DELETE /templates/{template_id}
# Delete a template
# ---------------------------------------------------------------------------

@router.delete(
    "/{template_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a clinical template.",
)
def delete_template(
    template_id: str,
    librarian: Librarian = Depends(get_librarian),
) -> None:
    """Permanently delete a clinical template from Supabase."""
    existing = librarian.get_template_by_id(template_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found.",
        )

    try:
        librarian.delete_template(template_id=template_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Template deletion failed: {e}",
        )