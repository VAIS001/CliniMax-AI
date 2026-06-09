from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    """
    GIVEN a running FastAPI application
    WHEN the GET /health endpoint is requested
    THEN it should return a 200 status code and healthy status
    """
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_root_endpoint():
    """
    GIVEN a running FastAPI application
    WHEN the root GET / endpoint is requested
    THEN it should return a 200 status code with a welcome message
    """
    response = client.get("/")
    assert response.status_code == 200
    assert "Welcome to CliniMax" in response.json()["message"]