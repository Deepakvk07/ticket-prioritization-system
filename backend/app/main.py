"""
FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.routers import tickets, analytics, model, tokens, enterprise, webhooks

settings = get_settings()

app = FastAPI(
    title="TicketFlow AI Microservice & Enterprise Integration Engine",
    description="Plug-and-play AI service for ServiceNow, Jira Service Management, Zendesk, and Freshdesk",
    version="2.1.0",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(tickets.router)
app.include_router(analytics.router)
app.include_router(model.router)
app.include_router(tokens.router)
app.include_router(enterprise.router)
app.include_router(webhooks.router)

# Alias: /api/predict-priority at top level for convenience
from app.schemas.ticket import PredictRequest, PredictResponse
from app.services.ml_service import predict_priority
from fastapi import HTTPException

@app.post("/api/predict-priority", response_model=PredictResponse, tags=["ml"])
async def predict_priority_root(req: PredictRequest):
    try:
        result = predict_priority(req.subject, req.description, req.category or "")
        return PredictResponse(**result)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/", tags=["health"])
async def root():
    return {"message": "TicketFlow AI API is running", "version": "2.0.0"}


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}
