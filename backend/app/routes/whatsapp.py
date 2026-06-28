"""WhatsApp webhook routes."""

from fastapi import APIRouter

router = APIRouter()


@router.post("/webhook")
def whatsapp_webhook():
    return {"message": "whatsapp webhook received"}
