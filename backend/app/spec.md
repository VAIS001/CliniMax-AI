# AI Healthcare Assistant Backend
## Project Specification Document

## Overview

This project is an AI-powered healthcare consultation backend designed to assist healthcare facilities facing workforce shortages and high patient loads.

The system acts as a Physician Assistant that:

- Collects patient information
- Performs structured intake
- Conducts preliminary consultations using AI
- Generates clinical documentation
- Assists with triage and patient prioritization
- Provides healthcare professionals with organized patient summaries

The backend is built using:

- FastAPI
- Python
- Gemini API (or other LLMs)
- PostgreSQL (future)
- SQLAlchemy
- Pydantic
- Uvicorn

---

# Project Goals

## Primary Goals

1. Reduce physician workload
2. Improve patient triage efficiency
3. Standardize clinical documentation
4. Support healthcare facilities with limited staff
5. Create a scalable AI consultation platform

---

# System Architecture

```text
Client
  │
  ▼
FastAPI Backend
  │
  ├── Intake Module
  ├── Consultation Module
  ├── AI Service Layer
  ├── Database Layer
  └── Documentation Generator
  │
  ▼
Database
```

---

# Backend Directory Structure

```text
backend/
│
├── app/
│   ├── main.py
│   │
│   ├── routes/
│   │   ├── intake.py
│   │   └── health.py
│   │
│   ├── services/
│   │   ├── gemini_service.py
│   │   └── consultation_service.py
│   │
│   ├── schemas/
│   │   └── intake.py
│   │
│   ├── models/
│   │   └── consultation.py
│   │
│   └── core/
│       ├── config.py
│       └── database.py
│
├── tests/
│   ├── test_health.py
│   └── test_intake.py
│
├── requirements.txt
│
└── PROJECT_SPEC.md
```

---

# Folder Breakdown

---

## app/

The main application package.

Contains all business logic, API endpoints, database models, services, and configurations.

---

## app/main.py

### Purpose

Application entry point.

Creates and configures the FastAPI application.

### Responsibilities

- Initialize FastAPI
- Register API routes
- Configure middleware
- Configure startup events
- Configure shutdown events

### Example

```python
app = FastAPI()

app.include_router(health_router)
app.include_router(intake_router)
```

---

## app/routes/

Contains API endpoints.

Routes are responsible for:

- Receiving HTTP requests
- Validating input
- Calling services
- Returning responses

Routes should NOT contain business logic.

---

### app/routes/health.py

#### Purpose

System health monitoring endpoint.

#### Responsibilities

- Verify backend is running
- Verify dependencies are operational

#### Example Endpoint

```http
GET /health
```

Response:

```json
{
  "status": "healthy"
}
```

---

### app/routes/intake.py

#### Purpose

Patient intake endpoint.

#### Responsibilities

- Receive patient information
- Validate patient data
- Forward information to consultation service

#### Example Endpoint

```http
POST /intake
```

Example Request:

```json
{
  "age": 30,
  "gender": "male",
  "chief_complaint": "fever and cough"
}
```

---

## app/services/

Contains business logic.

Services perform application operations.

Routes call services.

Services may call other services.

---

### app/services/gemini_service.py

#### Purpose

Handles communication with Gemini API.

#### Responsibilities

- Send prompts
- Receive responses
- Parse AI output
- Handle API errors

#### Example Methods

```python
generate_consultation()

generate_triage()

generate_summary()
```

---

### app/services/consultation_service.py

#### Purpose

Consultation orchestration layer.

Coordinates intake data and AI analysis.

#### Responsibilities

- Process patient intake
- Build AI prompts
- Call Gemini service
- Generate consultation report
- Determine triage level

#### Example Flow

```text
Patient Data
      │
      ▼
Consultation Service
      │
      ▼
Gemini Service
      │
      ▼
AI Response
      │
      ▼
Clinical Summary
```

---

## app/schemas/

Contains Pydantic models.

Schemas define:

- Request formats
- Response formats
- Validation rules

Schemas ensure data integrity.

---

### app/schemas/intake.py

#### Purpose

Defines patient intake data structure.

#### Example

```python
class IntakeRequest(BaseModel):
    age: int
    gender: str
    chief_complaint: str
```

Benefits:

- Automatic validation
- API documentation generation
- Type safety

---

## app/models/

Contains database models.

Models define how data is stored.

Typically built using:

- SQLAlchemy
- SQLModel

---

### app/models/consultation.py

#### Purpose

Represents a consultation record.

#### Example Fields

```python
id
patient_id
consultation_summary
triage_level
created_at
```

#### Responsibilities

- Store consultation history
- Support analytics
- Enable auditing

---

## app/core/

Contains shared infrastructure.

These files are used across the entire application.

---

### app/core/config.py

#### Purpose

Application configuration management.

#### Responsibilities

- Environment variables
- API keys
- Settings management

#### Example

```python
GEMINI_API_KEY
DATABASE_URL
DEBUG
```

Benefits:

- Centralized configuration
- Easy deployment
- Improved security

---

### app/core/database.py

#### Purpose

Database connection management.

#### Responsibilities

- Create database engine
- Manage sessions
- Handle database lifecycle

#### Example

```python
engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(...)
```

---

# tests/

Contains automated tests.

Ensures system reliability.

---

## tests/test_health.py

Tests health endpoints.

Examples:

- Health endpoint returns 200
- Status response is valid

---

## tests/test_intake.py

Tests intake functionality.

Examples:

- Valid intake accepted
- Invalid data rejected
- AI consultation generated

---

# requirements.txt

Lists project dependencies.

Example:

```text
fastapi
uvicorn
sqlalchemy
pydantic
google-generativeai
pytest
python-dotenv
```

Installation:

```bash
pip install -r requirements.txt
```

---

# API Flow

```text
Patient
   │
   ▼
POST /intake
   │
   ▼
Intake Route
   │
   ▼
Consultation Service
   │
   ▼
Gemini Service
   │
   ▼
AI Consultation
   │
   ▼
Database Storage
   │
   ▼
Response
```

---

# Future Expansion

## Authentication

```text
app/auth/
```

Features:

- JWT
- OAuth
- Role management

---

## Electronic Medical Records

```text
app/emr/
```

Features:

- Patient history
- Medication tracking
- Follow-up records

---

## Triage Engine

```text
app/triage/
```

Features:

- Risk scoring
- Emergency classification
- Queue prioritization

---

## Analytics

```text
app/analytics/
```

Features:

- Consultation statistics
- Disease trends
- Hospital workload metrics

---

# Development Principles

1. Routes handle HTTP concerns only.
2. Services contain business logic.
3. Schemas validate data.
4. Models represent database entities.
5. Core contains shared infrastructure.
6. Tests cover all critical functionality.
7. AI integrations remain isolated in service layers.

---

# Current MVP Scope

### Included

- Health endpoint
- Patient intake endpoint
- Gemini integration
- Consultation generation
- Clinical summary generation
- Structured API responses

### Excluded (Future Versions)

- Authentication
- Multi-hospital support
- EHR integration
- Billing
- Appointment scheduling
- Advanced analytics