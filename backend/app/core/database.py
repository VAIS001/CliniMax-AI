from supabase import create_client, Client
from app.core.config import settings

def get_supabase_client() -> Client:
    """
    Initializes and returns an authenticated instance of the Supabase Client.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise ValueError("Missing Supabase credentials in environment variables.")
        
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)