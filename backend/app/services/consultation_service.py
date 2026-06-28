"""Consultation service — orchestrates the CliniClerker pipeline.

Workflow:
  1. At session start, Librarian fetches the most relevant template(s)
     from Supabase based on the patient's chief complaint and demographics.
  2. CliniClerker uses the merged template + system prompt to drive the
     history-taking conversation one question at a time.
  3. On completion, the formatted document and extracted data are saved
     to the consultations table in Supabase.
"""

from typing import List, Optional

from google import genai

from app.agents.clini_clerker import CliniClerker
from app.agents.librarian import Librarian
from app.core.database import get_supabase_client
from app.schemas.intake import (
    CliniClerkerOutput,
    ConsultationCreate,
)


class ConsultationService:
    """Orchestrator for the WhatsApp-based clinical history-taking pipeline."""

    def __init__(self) -> None:
        self._supabase = None
        self.table_name = "consultations"

        # Shared Gemini client — used by both agents
        gemini_client = genai.Client()

        self.librarian = Librarian(
            gemini_client=gemini_client,
            supabase_client=get_supabase_client(),
        )
        self.clerker = CliniClerker(gemini_client=gemini_client)
        self.system_prompt: Optional[str] = None

    @property
    def supabase(self):
        if self._supabase is None:
            self._supabase = get_supabase_client()
        return self._supabase

    # ------------------------------------------------------------------
    # CliniClerker workflow
    # ------------------------------------------------------------------

    def start_consultation(
        self,
        chief_complaint: str,
        age: Optional[int] = None,
        sex: Optional[str] = None,
        specialty: Optional[str] = None,
        top_k: int = 1,
    ) -> str:
        """Initialise a new consultation session.

        Calls the Librarian to retrieve the most relevant template(s) from
        Supabase, then builds the CliniClerker system prompt with that template.
        Called once when the patient sends their first WhatsApp message.

        Args:
            chief_complaint: Patient's presenting complaint.
            age:             Patient age (improves template matching).
            sex:             Patient sex (improves template matching).
            specialty:       Optional specialty filter for template search.
            top_k:           Number of templates to retrieve and merge (default: 1).

        Returns:
            The opening question from CliniClerker to send to the patient.
        """
        # 1 — Librarian fetches and merges the most relevant template(s)
        librarian_result = self.librarian.process({
            "chief_complaint": chief_complaint,
            "age":             age,
            "sex":             sex,
            "specialty":       specialty,
            "top_k":           top_k,
        })

        merged_template = librarian_result["merged_template"]

        # 2 — Build the static system prompt (rendered once, cached for the session)
        self.system_prompt = self.clerker.build_system_prompt(
            intake_template=merged_template
        )

        # 3 — Send the opening patient message to get the first question
        opening = self.clerker.process(
            patient_input=chief_complaint,
            system_prompt=self.system_prompt,
        )

        return opening.next_question

    def handle_message(self, patient_input: str) -> str:
        """Process one incoming consultation/WhatsApp message and return the next response.

        Args:
            patient_input: The patient's latest message text.

        Returns:
            The next question to send, or the final formatted document
            when the consultation is complete.
        """
        if not self.system_prompt:
            raise RuntimeError(
                "Consultation has not been started. "
                "Call start_consultation() before handle_message()."
            )

        output: CliniClerkerOutput = self.clerker.process(
            patient_input=patient_input,
            system_prompt=self.system_prompt,
        )

        if output.conversation_complete:
            # Persist to Supabase
            self._save_completed_consultation(output)
            # TODO: trigger Validator agent, send clinician notification
            return output.formatted_document

        return output.next_question

    # ------------------------------------------------------------------
    # Supabase persistence
    # ------------------------------------------------------------------

    def _save_completed_consultation(self, output: CliniClerkerOutput) -> dict:
        """Persist the completed clerking to the consultations table."""
        payload = {
            "extracted_data":   output.extracted_data.model_dump(),
            "formatted_document": output.formatted_document,
            "chat_history":     self.clerker.conversation_history,
            "alerts":           output.alerts,
        }
        response = self.supabase.table(self.table_name).insert(payload).execute()
        return response.data[0] if response.data else {}

    def create_consultation(self, data: ConsultationCreate) -> dict:
        """Save a manually compiled clinical intake report to Supabase."""
        payload = {
            "patient_name":    data.patient_name,
            "raw_symptoms":    data.raw_symptoms,
            "triage_priority": data.triage_priority,
            "clinical_summary": data.clinical_summary,
            "chat_history":    [msg.model_dump() for msg in data.chat_history],
        }
        response = self.supabase.table(self.table_name).insert(payload).execute()
        return response.data[0] if response.data else {}

    def get_all_consultations(self) -> List[dict]:
        """Retrieve all past consultation records ordered by creation date."""
        response = (
            self.supabase.table(self.table_name)
            .select("*")
            .order("created_at", descending=True)
            .execute()
        )
        return response.data if response.data else []


consultation_service = ConsultationService()