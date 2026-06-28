from app.agents.clini_scribe import CliniScribe


def test_clini_scribe_process_passes_transcription_to_note_generation(monkeypatch):
    agent = CliniScribe(gemini_client=object())

    captured = {}

    def fake_generate_clinical_note(transcription, template_id=None, consultation_id=None):
        captured["transcription"] = transcription
        captured["template_id"] = template_id
        captured["consultation_id"] = consultation_id
        return {"clinical_note": "placeholder note"}

    monkeypatch.setattr(agent, "generate_clinical_note", fake_generate_clinical_note)

    payload = {
        "audio_data": b"fake-audio",
        "audio_format": "wav",
        "template_id": "tpl-123",
        "consultation_id": "consult-456",
    }

    result = agent.process(payload)

    #Watch this test
    assert captured["transcription"].transcript == "fake-audio"
    assert captured["template_id"] == "tpl-123"
    assert captured["consultation_id"] == "consult-456"
    assert result["transcript"] == "fake-audio"
    assert result["clinical_note"] == "placeholder note"
