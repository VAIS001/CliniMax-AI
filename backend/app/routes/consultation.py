from fastapi import APIRouter, HTTPException, status
from typing import List
from app.schemas.intake import ConsultationResponse, ConsultationCreate
from app.services.consultation_service import consultation_service

router = APIRouter(prefix="/api/consultations", tags=["Consultations"])

@router.get("", response_model=List[ConsultationResponse])
async def get_consultations():
    """
    Fetches all historical patient triage and intake files for the doctor dashboard views.
    """
    try:
        records = consultation_service.get_all_consultations()
        return records
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database retrieval failed: {str(e)}"
        )

@router.post("", response_model=ConsultationResponse, status_code=status.HTTP_201_CREATED)
async def save_consultation(payload: ConsultationCreate):
    """
    Saves a completed intake summary file to the system database logs.
    """
    try:
        record = consultation_service.create_consultation(payload)
        return record
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to record consultation entry: {str(e)}"
        )