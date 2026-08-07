"""
================================================================================
FINAL YEAR CAPSTONE PROJECT: OmniSupport AI (TicketFlow AI)
Project Title: AI-Powered Customer Support Ticket Prioritization System
Tech Stack   : Python (FastAPI), Machine Learning (Scikit-Learn), React, Supabase
================================================================================
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.routers import tickets, analytics, model, tokens, enterprise, webhooks
from app.schemas.ticket import PredictRequest, PredictResponse
from app.services.ml_service import predict_priority

# Initialize settings and FastAPI application
settings = get_settings()

app = FastAPI(
    title="OmniSupport AI — Ticket Prioritization System",
    description="Student Project: AI Microservice for Automatic Helpdesk Ticket Prioritization",
    version="1.0.0",
)

# Configure CORS Middleware for Frontend React communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(tickets.router)
app.include_router(analytics.router)
app.include_router(model.router)
app.include_router(tokens.router)
app.include_router(enterprise.router)
app.include_router(webhooks.router)


# Main ML Priority Prediction Endpoint used by the Frontend
@app.post("/api/predict-priority", response_model=PredictResponse, tags=["Machine Learning"])
async def predict_priority_root(req: PredictRequest):
    """Predict ticket priority level (Critical, High, Medium, Low) based on user input."""
    try:
        result = predict_priority(req.subject, req.description, req.category or "")
        return PredictResponse(**result)
    except FileNotFoundError as err:
        raise HTTPException(status_code=503, detail=f"Model file missing: {str(err)}")
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(err)}")


# Root and Health Check Endpoints
@app.get("/", tags=["Health"])
async def root():
    return {
        "project": "OmniSupport AI Ticket Prioritization System",
        "status": "Running",
        "version": "1.0.0"
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "message": "Backend API is online"}
