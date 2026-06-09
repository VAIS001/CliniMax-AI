import os
from supabase import create_client, Client

# Retrieve Supabase credentials from environment variables
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

# Initialize the Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def create_patient(patient_data: dict):
    """Inserts a new patient into the patients table and returns the result."""
    response = supabase.table("patients").insert(patient_data).execute()
    return response.data


def get_patient(patient_id: str):
    """Fetches a single patient by their UUID."""
    response = supabase.table("patients").select("*").eq("id", patient_id).execute()
    return response.data[0] if response.data else None


def save_consultation(consultation_data: dict):
    """Inserts a new consultation into the consultations table."""
    response = supabase.table("consultations").insert(consultation_data).execute()
    return response.data


def get_consultations(patient_id: str):
    """Fetches all consultations for a specific patient."""
    response = supabase.table("consultations").select("*").eq("patient_id", patient_id).execute()
    return response.data
