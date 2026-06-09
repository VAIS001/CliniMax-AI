from typing import List
from app.core.database import get_supabase_client
from app.schemas.intake import ConsultationCreate, ConsultationResponse

class ConsultationService:
    def __init__(self):
        self.supabase = get_supabase_client()
        self.table_name = "consultations"

    def create_consultation(self, data: ConsultationCreate) -> dict:
        """
        Saves a newly compiled clinical intake report straight into Supabase.
        """
        # Formulate payload into raw JSON-compatible dictionary for Supabase
        payload = {
            "patient_name": data.patient_name,
            "raw_symptoms": data.raw_symptoms,
            "triage_priority": data.triage_priority,
            "clinical_summary": data.clinical_summary,
            "chat_history": [msg.model_dump() for msg in data.chat_history]
        }
        
        response = self.supabase.table(self.table_name).insert(payload).execute()
        return response.data[0] if response.data else {}

    def get_all_consultations(self) -> List[dict]:
        """
        Retrieves all past records ordered by creation date for the physician dashboard.
        """
        response = (
            self.supabase.table(self.table_name)
            .select("*")
            .order("created_at", descending=True)
            .execute()
        )
        return response.data if response.data else []

consultation_service = ConsultationService()