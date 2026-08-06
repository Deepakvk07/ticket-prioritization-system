from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class PriorityEnum(str, Enum):
    critical = "Critical"
    high = "High"
    medium = "Medium"
    low = "Low"


class StatusEnum(str, Enum):
    open = "Open"
    in_progress = "In Progress"
    on_hold = "On Hold"
    resolved = "Resolved"
    closed = "Closed"


class ActivityTypeEnum(str, Enum):
    message = "message"
    internal_note = "internal_note"
    status_change = "status_change"
    assignment = "assignment"


# ── Ticket Schemas ─────────────────────────────────────────────────────────────

class TicketCreate(BaseModel):
    subject: str
    description: str
    category: Optional[str] = "Technical Support"
    product_module: Optional[str] = "Core Platform"
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    attachments: Optional[List[dict]] = None


class TicketUpdate(BaseModel):
    status: Optional[StatusEnum] = None
    priority: Optional[PriorityEnum] = None
    assigned_to: Optional[str] = None


class TicketActivity(BaseModel):
    id: Optional[str] = None
    ticket_id: str
    type: ActivityTypeEnum
    author: str
    author_role: Optional[str] = None
    content: str
    created_at: Optional[datetime] = None


class TicketResponse(BaseModel):
    id: str
    subject: str
    description: str
    category: str
    product_module: str
    status: str
    priority: str
    ai_priority: Optional[str] = None
    confidence_score: Optional[float] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    assigned_to: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    activities: Optional[List[TicketActivity]] = []

    class Config:
        from_attributes = True


# ── ML Prediction Schemas ─────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    subject: str
    description: str
    category: Optional[str] = None


class PredictResponse(BaseModel):
    priority: PriorityEnum
    confidence: float
    confidence_score: float
    reasoning: str
    probabilities: dict


# ── Analytics Schemas ─────────────────────────────────────────────────────────

class AnalyticsResponse(BaseModel):
    total_tickets: int
    avg_resolution_time_minutes: float
    csat_score: float
    tickets_by_priority: dict
    tickets_by_status: dict
    tickets_by_day: List[dict]
    model_accuracy: float
    active_tickets: int


# ── Model Info Schemas ────────────────────────────────────────────────────────

class ModelInfoResponse(BaseModel):
    model_name: str
    version: str
    accuracy: float
    dataset_size: int
    last_trained: str
    architecture: str
    status: str


class TrainingLogEntry(BaseModel):
    id: str
    date: str
    model_id: str
    duration: str
    epochs: int
    accuracy_delta: float
    status: str
