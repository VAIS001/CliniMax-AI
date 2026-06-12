from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app

client = TestClient(app)

def test_intake_chat_ongoing():
    """
    GIVEN a multi-turn chat payload
    WHEN the user sends an incomplete symptom report
    THEN the AI should return a clarifying question and is_complete should be False
    """
    # Define our test input payload matching IntakeChatRequest schema
    payload = {
        "history": [
            {"role": "user", "text": "I have a headache"}
        ],
        "next_message": "It started yesterday evening."
    }

    # Mock the continue_intake_chat method so it doesn't call Google's servers
    with patch("app.services.gemini_service.gemini_service.continue_intake_chat") as mock_gemini:
        # Define what our fake Gemini should return
        mock_gemini.return_value = "Does the headache come with any nausea or blurry vision?"

        response = client.post("/api/intake/chat", json=payload)

        # Assertions
        assert response.status_code == 200
        response_data = response.json()
        assert response_data["reply"] == "Does the headache come with any nausea or blurry vision?"
        assert response_data["is_complete"] is False
        
        # Verify our service layer was actually called with the right data
        mock_gemini.assert_called_once_with(
            history=[{"role": "user", "text": "I have a headache"}],
            next_message="It started yesterday evening."
        )

def test_intake_chat_completion():
    """
    GIVEN a chat payload that fulfills all required medical history criteria
    WHEN Gemini appends the completion string flag
    THEN the endpoint should return is_complete True and clean up the flag text
    """
    payload = {
        "history": [
            {"role": "user", "text": "No other symptoms, and no medical history."}
        ],
        "next_message": "I'm not on any medications."
    }

    with patch("app.services.gemini_service.gemini_service.continue_intake_chat") as mock_gemini:
        # Simulate the model declaring that it is finished interviewing
        mock_gemini.return_value = "Thank you. I am compiling your report now. CLINICAL_INTAKE_COMPLETE"

        response = client.post("/api/intake/chat", json=payload)

        assert response.status_code == 200
        response_data = response.json()
        
        # Ensure the backend successfully strips out the raw token flag before answering the client UI
        assert "CLINICAL_INTAKE_COMPLETE" not in response_data["reply"]
        assert response_data["is_complete"] is True

def test_clinimax_ai_endpoint():
    """
    GIVEN a patient detail chart query
    WHEN the clinician posts a query to /api/clinimax-ai
    THEN it should return the clinical decision response
    """
    payload = {
        "patientName": "Eleanor Vance",
        "patientAge": 35,
        "id": "PT-8829-X",
        "symptoms": "Persistent short breath",
        "meds": ["Lisinopril 10mg"],
        "question": "What is the differential diagnosis?",
        "history": "No historical events."
    }

    with patch("app.services.gemini_service.gemini_service.query_clinimax_ai") as mock_query:
        mock_query.return_value = "Mocked Advisory Note"

        response = client.post("/api/clinimax-ai", json=payload)

        assert response.status_code == 200
        assert response.json() == {"response": "Mocked Advisory Note"}
        mock_query.assert_called_once_with(
            patient_name="Eleanor Vance",
            patient_age=35,
            patient_id="PT-8829-X",
            symptoms="Persistent short breath",
            meds=["Lisinopril 10mg"],
            question="What is the differential diagnosis?",
            history="No historical events."
        )