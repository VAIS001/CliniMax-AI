from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, intake, consultation, template, feedback, whatsapp, audio


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
app.include_router(health.router, prefix="/health")
app.include_router(intake.router, prefix="/intake")
app.include_router(consultation.router, prefix="/consultation")
app.include_router(template.router, prefix="/template")
app.include_router(feedback.router, prefix="/feedback")
app.include_router(whatsapp.router, prefix="/whatsapp")
app.include_router(audio.router, prefix="/audio")


@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {"message": "Welcome to CliniMax Core API API. Go to /docs for Swagger documentation."}