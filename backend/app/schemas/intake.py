from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Dict
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

class CliniMaxAIRequest(BaseModel):
    patientName: str
    patientAge: int
    id: str
    symptoms: str
    meds: List[str] = []
    question: str
    history: str = ""

class CliniMaxAIResponse(BaseModel):
    response: str

#new

class Biodata(BaseModel):
    age: Optional[int]
    sex: Optional[str]
    occupation: Optional[str]
    informant_relationship: Optional[str] = Field(None, description="Relationship to patient if not self")

class PresentingComplaint(BaseModel):
    complaint: str
    duration: str

class HistoryOfPresentingComplaint(BaseModel):
    chronological_narrative: str
    course: Optional[str]
    causes_suspected: Optional[str]
    complications: Optional[str]
    care_received_so_far: Optional[str]

class ExtractedClinicalData(BaseModel):
    # Biodata
    biodata: Biodata
    
    # Presenting Complaints
    presenting_complaints: List[PresentingComplaint] = Field(default_factory=list)
    
    # History
    history_of_presenting_complaint: HistoryOfPresentingComplaint
    past_medical_surgical_history: Optional[str]
    drug_history: Optional[str]
    gynaecological_history: Optional[str]
    
    # Pediatric/Specialized context
    nutritional_history: Optional[str]
    immunization_history: Optional[str]
    developmental_history: Optional[str]
    
    # Family & Social
    family_history: Optional[str]
    social_history: Optional[str]
    
    # Review & Summary
    review_of_systems: Optional[str]
    summary: Optional[str]
    
    # Safety
    red_flags: List[str] = Field(default_factory=list)

class CliniClerkerOutput(BaseModel):
    next_question: str = Field(..., description="The next conversational question to ask the patient.")
    extracted_data: ExtractedClinicalData
    conversation_complete: bool = Field(..., description="True if sufficient history is gathered to make a clinical decision.")
    confidence_scores: dict = Field(default_factory=dict)
    alerts: List[str] = Field(default_factory=list)
##

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

    model_config = ConfigDict(from_attributes=True)  # Allows Pydantic to parse SQLAlchemy/Supabase dict objects easily