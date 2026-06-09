from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime
from uuid import UUID

class IntakeRequest(BaseModel):
    name: str
    symptoms: str

class IntakeResponse(BaseModel):
    triage: str
    summary: str

class ChatMessage(BaseModel):
    role: str  # Must be "user" or "model"
    text: str

class IntakeChatRequest(BaseModel):
    history: List[ChatMessage]
    next_message: str

class IntakeChatResponse(BaseModel):
    reply: str
    is_complete: bool



class ConsultationBase(BaseModel):
    patient_name: str
    raw_symptoms: str
    triage_priority: str
    clinical_summary: str
    chat_history: List[ChatMessage]

class ConsultationCreate(ConsultationBase):
    pass

class ConsultationResponse(ConsultationBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True # Allows Pydantic to parse SQLAlchemy/Supabase dict objects easily