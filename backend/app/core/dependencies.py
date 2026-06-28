"""app/core/dependencies.py

Shared FastAPI dependencies for injecting clients and agents.
All clients are constructed once and reused via module-level singletons.
"""

from functools import lru_cache

from google import genai
from supabase import create_client, Client as SupabaseClient

from app.agents.librarian import Librarian
from app.core.config import settings   # your existing config with env vars


# ---------------------------------------------------------------------------
# Singletons — constructed once at startup
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def get_gemini_client() -> genai.Client:
    return genai.Client(api_key=settings.GEMINI_API_KEY)


@lru_cache(maxsize=1)
def get_supabase_client() -> SupabaseClient:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


# ---------------------------------------------------------------------------
# Agent dependencies — injected into routes via Depends()
# ---------------------------------------------------------------------------

def get_librarian() -> Librarian:
    return Librarian(
        gemini_client=get_gemini_client(),
        supabase_client=get_supabase_client(),
    )