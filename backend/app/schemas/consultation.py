"""Consultation request/response schemas."""

from typing import Optional


class ConsultationSchema:
    id: Optional[int] = None
    patient_name: Optional[str] = None
    notes: Optional[str] = None
