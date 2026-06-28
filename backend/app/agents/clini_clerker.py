"""CliniClerker agent for patient intake conversations and history-taking.

This agent manages the conversational flow during patient intake, collecting
pertinent patient history, chief complaints, and clinical context through
guided natural language interaction.
"""

from typing import Any, Dict, List
from app.schemas.intake import CliniClerkerOutput, ExtractedClinicalData
from google.genai import types
from app.core.prompt_loader import render_prompt
from app.agents.base_agent import BaseAgent


class CliniClerker(BaseAgent):
    """Agent responsible for patient intake conversations and history-taking.

    CliniClerker conducts initial patient interactions to gather comprehensive
    medical history, presenting complaints, and context. It maintains conversation
    flow, ensures completeness of information, and prepares data for downstream
    clinical agents.

    Attributes:
        gemini_client: Gemini API client for conversational LLM interactions.
        agent_name: Name identifier for this agent.
        conversation_history: Maintains the conversation state for multi-turn interactions.
    """

    def __init__(self, gemini_client: Any, agent_name: str = "CliniClerker") -> None:
        """Initialize the CliniClerker agent.

        Args:
            gemini_client: An instance of the Gemini client.
            agent_name: Name identifier for logging and debugging (default: "CliniClerker").
        """
        super().__init__(gemini_client, agent_name)
        self.conversation_history: List[Dict[str, str]] = []

    def build_system_prompt(self, intake_template: str) -> str:
        """
        Render the static system prompt once per consultation.
        Pass the result to Gemini's cache — not rebuilt every turn.
        """
        return render_prompt(
            "intake_prompt.md",
            intake_template=intake_template
        )

    def process(self, patient_input: str, system_prompt: str) -> CliniClerkerOutput:
        """Process patient intake interaction.
        Called every turn. Only conversation_history is dynamic.
        system_prompt is the pre-rendered (and ideally cached) static part.
        

        Args:
            data: Dictionary containing:
                - "patient_input" (str): The patient's spoken or typed message.
                - "context" (dict, optional): Existing patient context or session info.
                - "intake_template" (str, optional): Structured intake template to guide conversation.

        Returns:
            Dictionary containing:
                - "next_question" (str): The next question to ask the patient.
                - "extracted_data" (dict): Structured data extracted so far.
                - "conversation_complete" (bool): Whether intake is complete.
                - "confidence_scores" (dict): Confidence in extracted fields.
                - "alerts" (list): Any clinical red flags or important notes identified.
        """

        # Update conversation history
        if patient_input:
            self.conversation_history.append({
                "role": "patient",
                "content": patient_input
            })

        #generate response
        response = self.gemini_client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=self.conversation_history,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,  #CONFIM THIS IS DEFINED
                response_mime_type="application/json",
                response_schema=CliniClerkerOutput,
            )
        )

        # Append assistant reply to history
        self.conversation_history.append({
            "role": "model",
            "content": response.text
        })

        return CliniClerkerOutput.model_validate_json(response.text)


    def reset_conversation(self) -> None:
        """Reset conversation history for a new patient session."""
        self.conversation_history = []

    def get_conversation_history(self) -> List[Dict[str, str]]:
        """Return the current conversation history."""
        return self.conversation_history.copy()

