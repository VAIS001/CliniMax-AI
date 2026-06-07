from fastapi import APIRouter, HTTPException
from app.schemas.intake import (
    IntakeRequest, 
    IntakeResponse, 
    IntakeChatRequest, 
    IntakeChatResponse
)
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/api", tags=["Intake"])

@router.post("/intake", response_model=IntakeResponse)
async def post_intake(payload: IntakeRequest):
    try:
        result = await gemini_service.process_patient_intake(
            name=payload.name, 
            symptoms=payload.symptoms
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Processing failed: {str(e)}")

@router.post("/intake/chat", response_model=IntakeChatResponse)
async def intake_chat_endpoint(payload: IntakeChatRequest):
    try:
        # Convert Pydantic models to dicts for the service layer
        history_dicts = [{"role": msg.role, "text": msg.text} for msg in payload.history]
        
        # Get the next response from Gemini
        ai_reply = gemini_service.continue_intake_chat(
            history=history_dicts, 
            next_message=payload.next_message
        )
        
        # Check if the model appended the completion flag
        is_complete = "CLINICAL_INTAKE_COMPLETE" in ai_reply
        
        # Clean up the flag before sending it to the frontend UI
        clean_reply = ai_reply.replace("CLINICAL_INTAKE_COMPLETE", "").strip()
        
        return IntakeChatResponse(reply=clean_reply, is_complete=is_complete)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))    