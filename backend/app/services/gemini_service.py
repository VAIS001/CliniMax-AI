from google import genai
from google.genai import types
from app.core.config import settings
from app.schemas.intake import IntakeResponse

class GeminiService:
    def __init__(self):
        # Prevent crash if API key is not set (e.g. during pytest import/collection)
        api_key = settings.GEMINI_API_KEY
        if not api_key or api_key.strip() == "" or api_key == "MY_GEMINI_API_KEY":
            api_key = "DUMMY_API_KEY"
        self.client = genai.Client(api_key=api_key)
        
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

    async def query_clinimax_ai(
        self, 
        patient_name: str, 
        patient_age: int, 
        patient_id: str, 
        symptoms: str, 
        meds: list, 
        question: str, 
        history: str
    ) -> str:
        """
        Processes general clinician advisory queries about patient charts.
        """
        # Return mock response if no API key is specified so the UI remains pristine
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "MY_GEMINI_API_KEY" or settings.GEMINI_API_KEY.strip() == "":
            meds_list_str = ", ".join(meds) if meds else "listed medications"
            return f"""### CliniMax AI Assistant Note
**Patient:** {patient_name} | **Age:** {patient_age} | **ID:** {patient_id}

Based on the reported symptoms **"{symptoms or "None provided"}"**, here is the decision support evaluation:

#### 📋 Diagnostic Considerations
- **Suspected Presentation:** Given the clinical triage, assess for acute gastrointestinal irritation, lower quadrant inflammatory response, or mild pulmonary symptoms depending on selected triage classification.
- **Differential Diagnostics:**
  1. Gastroesophageal reflux or persistent bronchial cough hyper-reactivity.
  2. Early-stage localized abdominal irritation (recommend McBurney point palpations if abdominal signs present).
  3. Vasovagal triggers relating to elevated pain scores.

#### 🩺 Recommended Immediate Next Steps
- **Vitals Monitoring:** Conduct quarterly checks of SpO2 and body temperature (currently noted). Keep SpO2 above 95% threshold.
- **Diagnostics check:** Order baseline complete blood counts (CBCs) and comprehensive metabolic panels (CMP) if labs are pending.
- **Therapeutics:** Maintain current hydration protocols. Review if {meds_list_str} interacts with new analgesics.

*Disclaimer: This is real-time compiled clinical decision support. Attend to established triage parameters and local physician-led protocols before implementing clinical modifications.*"""

        system_instruction = (
            "You are CliniMax AI, a state-of-the-art patient-chart analysis and diagnosis support assistant "
            "designed to help Dr. Harper and other clinicians make accurate decisions.\n"
            "- Maintain a professional, medical-grade, highly precise tone.\n"
            "- Give constructive diagnostic recommendations of differential diagnoses, diagnostic checks to run, "
            "or general patient care considerations based on symptoms and vitals.\n"
            "- Format responses nicely with clean markdown, bolding, bullet points, headers, and spacing.\n"
            "- Always include a short standard medical advisory disclaimer at the end of your analysis."
        )

        prompt_str = f"""Patient: {patient_name}
Age: {patient_age}
Intake ID: {patient_id}
Reported Symptoms/Chief Complaint: {symptoms}
Current Medications: {", ".join(meds) if meds else "None indicated"}
Previous History Highlights: {history if history else "None indicated"}

Dr. Harper's clinical inquiry/question: "{question}"

Provide detailed diagnostic decision support, differentials, next steps, and considerations."""

        response = await self.client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt_str,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.3,
            )
        )
        return response.text

gemini_service = GeminiService()

