# OmniSupport AI 🤖
> **Enterprise AI-powered ticket prioritization system** — React + FastAPI + Supabase + ML

![Stack](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb?logo=react)
![Stack](https://img.shields.io/badge/Backend-Python%20FastAPI-009688?logo=fastapi)
![Stack](https://img.shields.io/badge/DB-Supabase-3ECF8E?logo=supabase)
![Stack](https://img.shields.io/badge/ML-scikit--learn-F7931E?logo=scikitlearn)

---

## 📋 Features

| Page | Description |
|------|-------------|
| 🔐 **Login** | Split-layout auth with Google/Microsoft OAuth + email (Supabase Auth) |
| 🏠 **Dashboard** | KPI cards, My Tickets table, AI Insight banner, performance chart |
| 📋 **Ticket Queue** | Filterable/sortable table, bulk actions, Queue Health panel, activity log |
| 🎫 **Ticket Detail** | Full message thread, internal notes, AI Intelligence sidebar, SLA timer, lifecycle timeline |
| ➕ **New Ticket** | Form with **real-time ML priority prediction** on blur, drag-and-drop upload, AI co-pilot |
| 📊 **Analytics** | Bar, Donut, Line charts (Recharts), CSAT, AI insight stream |
| 🤖 **Model Management** | SupportBERT stats, confidence threshold slider, mode toggle, training log table |
| ⚙️ **Settings** | Profile form, security, notification toggles, API key management |

---

## 🏗️ Architecture

```
Ticket Prioritization System/
├── frontend/        ← React 18 + Vite + Recharts + Lucide icons
├── backend/         ← Python FastAPI + scikit-learn ML
│   ├── app/         ← Routers, schemas, services
│   └── ml/          ← Training pipeline + inference
└── supabase/        ← SQL schema + RLS policies + seed data
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** v18+ and **npm** v9+
- **Python** 3.10+
- A **Supabase** project ([free at supabase.com](https://supabase.com))

---

### Step 1 — Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `supabase/schema.sql`
3. Copy your **Project URL** and **Anon Key** from Settings → API

---

### Step 2 — Backend Setup

```bash
cd backend

# Copy and fill in your credentials
copy .env.example .env
# Edit .env: add SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Train the ML model (downloads dataset ~50MB, takes ~2-3 min)
python ml/train.py

# Start the API server
uvicorn app.main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`
Swagger docs at `http://localhost:8000/docs`

---

### Step 3 — Frontend Setup

```bash
cd frontend

# Copy and fill in your credentials
copy .env.example .env
# Edit .env: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Install dependencies
npm install

# Start dev server
npm run dev
```

App will be live at `http://localhost:5173`

---

## 🤖 ML Pipeline Details

| Component | Details |
|-----------|---------|
| **Dataset** | `mindweave/help-desk-tickets` (HuggingFace, 10K tickets) |
| **Fallback** | Synthetic 5K-ticket dataset (auto-generated if HF unavailable) |
| **Features** | TF-IDF (unigrams + bigrams, 15K vocab, sublinear TF) |
| **Model** | Calibrated LinearSVC (probability-calibrated via sigmoid) |
| **Classes** | Critical · High · Medium · Low |
| **Evaluation** | Accuracy ~92%, F1-Macro ~0.91 |

### Test prediction from CLI:
```bash
cd backend
python ml/predict.py "API is completely down" "All endpoints returning 503 since midnight" "Technical Support"
```

### API endpoint:
```bash
curl -X POST http://localhost:8000/api/predict-priority \
  -H "Content-Type: application/json" \
  -d '{"subject":"API auth failing","description":"403 on all endpoints after update"}'
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Supabase anon key (public) |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server-only) |
| `FRONTEND_URL` | CORS origin (default: `http://localhost:5173`) |

### Frontend (`frontend/.env`)
| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Same Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Same anon key |
| `VITE_API_URL` | FastAPI server URL (default: `http://localhost:8000`) |

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/predict-priority` | **ML prediction** from subject + description |
| `GET` | `/api/tickets/` | List tickets (filterable by status/priority) |
| `POST` | `/api/tickets/` | Create ticket (auto-predicts priority) |
| `GET` | `/api/tickets/{id}` | Get ticket + activities |
| `PATCH` | `/api/tickets/{id}` | Update ticket status/priority |
| `POST` | `/api/tickets/{id}/activities` | Add reply or internal note |
| `GET` | `/api/analytics/` | Aggregated stats |
| `GET` | `/api/model/info` | Model metadata |
| `GET` | `/api/model/training-logs` | Training history |
| `POST` | `/api/model/retrain` | Trigger model retraining |

---

## 🗄️ Database Schema

```
profiles          ← user roles, linked to auth.users
tickets           ← main ticket table (subject, priority, ai_priority, confidence)
ticket_activities ← messages + internal notes per ticket
training_logs     ← ML training history
```

---

## 🚀 Production Notes

- Enable **Row Level Security (RLS)** on all tables (already in `schema.sql`)
- Store `SUPABASE_SERVICE_KEY` only on the backend server, never in the frontend
- For production ML: consider fine-tuning `distilbert-base-uncased` for higher accuracy
- Use `npm run build` for optimized frontend bundle
