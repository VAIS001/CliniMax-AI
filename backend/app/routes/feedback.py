"""Feedback-related API routes."""

from fastapi import APIRouter

router = APIRouter()


@router.post("/")
def submit_feedback():
    return {"message": "feedback received"}
