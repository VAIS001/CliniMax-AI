from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, intake, consultation # Add consultations import here

# ... app initialization & CORS setup stay the same ...

app = FastAPI(title="CliniMax Backend API", version="0.1.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your Vercel deployment URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(intake.router)
app.include_router(consultation.router) # Register your new Supabase route here


@app.get("/")
def root():
    return {"message": "Welcome to CliniMax Core API API. Go to /docs for Swagger documentation."}