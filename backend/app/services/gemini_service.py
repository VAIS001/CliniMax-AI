from google import genai
from google.genai import types
from app.core.config import settings
from app.schemas.intake import IntakeResponse

class GeminiService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        # Define the system instruction once
        self.system_instruction = """
        You are CliniMax AI, an expert medical intake assistant. Your job is to interview the patient.
        1. Ask exactly ONE follow-up question at a time to clarify symptoms.
        2. Gather HPI (symptom details), Past Medical and Surgical History, Drug and Allergies History, Gynae History(if is a woman) Family History and Social History.
        3. Do NOT provide a summary until you have gathered enough information.
        4. If you have enough information, end your message precisely with: "CLINICAL_INTAKE_COMPLETE"
        """

    def continue_intake_chat(self, history: list, next_message: str) -> str:
        """
        Takes the existing chat history, adds the new patient message, 
        and returns the model's next question or final response.
        """
        # Convert incoming history into the format the SDK expects
        formatted_history = []
        for msg in history:
            formatted_history.append(
                types.Content(
                    role=msg["role"], # "user" or "model"
                    parts=[types.Part.from_text(text=msg["text"])]
                )
            )

        # Initialize the chat session with instructions and history
        chat = self.client.chats.create(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(
                system_instruction=self.system_instruction,
                temperature=0.3,
            ),
            history=formatted_history
        )

        # Send the user's newest message to get the reply
        response = chat.send_message(next_message)
        return response.text

    async def process_patient_intake(self, name: str, symptoms: str) -> IntakeResponse:
        prompt = f"""
        You are an expert clinical triage assistant specializing in healthcare access in Africa.
        Analyze the following patient narrative:
        Patient Name: {name}
        Reported Symptoms: {symptoms}

        Tasks:
        1. Classify the triage priority into one of these categories: ROUTINE, URGENT, EMERGENCY.
        2. Generate a concise, objective clinical summary suitable for a physician dashboard.
        """

        # Using gemini-2.5-flash as it is fast, cost-effective, and supports structured outputs
        response = await self.client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=IntakeResponse,
                temperature=0.2, # Low temperature for more clinical consistency
            ),
        )

        # The SDK automatically ensures response.text satisfies the IntakeResponse structure
        return IntakeResponse.model_validate_json(response.text)

gemini_service = GeminiService()
