"""
ML Service — loads trained model and provides prediction interface.
"""
import re
import joblib
import numpy as np
from pathlib import Path
from app.core.config import get_settings

settings = get_settings()

_model = None
_vectorizer = None
_label_encoder = None


def _load_artifacts():
    global _model, _vectorizer, _label_encoder
    base = Path(__file__).resolve().parent.parent.parent  # backend/

    model_path = base / settings.model_path
    vec_path = base / settings.vectorizer_path
    le_path = base / settings.label_encoder_path

    if not model_path.exists():
        raise FileNotFoundError(
            f"Model not found at {model_path}. "
            "Run `python ml/train.py` first to train the model."
        )

    _model = joblib.load(model_path)
    _vectorizer = joblib.load(vec_path)
    _label_encoder = joblib.load(le_path)


def get_model():
    if _model is None:
        _load_artifacts()
    return _model, _vectorizer, _label_encoder


def preprocess_text(subject: str, description: str, category: str = "") -> str:
    """Combine and clean ticket text for inference."""
    text = f"{subject} {category} {description}"
    text = re.sub(r"http\S+", " ", text)
    text = re.sub(r"[^a-zA-Z0-9\s.,!?-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip().lower()
    return text


def predict_priority(subject: str, description: str, category: str = "") -> dict:
    """
    Predict ticket priority label with confidence.

    Returns:
        {
            priority: str,
            confidence: float,
            confidence_score: float,
            probabilities: {Critical, High, Medium, Low},
            reasoning: str
        }
    """
    model, vectorizer, label_encoder = get_model()

    text = preprocess_text(subject, description, category)
    X = vectorizer.transform([text])

    # Prediction
    pred_idx = model.predict(X)[0]
    proba = model.predict_proba(X)[0]

    priority_label = label_encoder.inverse_transform([pred_idx])[0]
    confidence = float(np.max(proba))

    # Map all class probabilities
    classes = label_encoder.inverse_transform(np.arange(len(proba)))
    prob_dict = {cls: round(float(p), 4) for cls, p in zip(classes, proba)}

    # Generate a lightweight reasoning string
    reasoning = _build_reasoning(text, priority_label, confidence)

    return {
        "priority": priority_label,
        "confidence": confidence,
        "confidence_score": round(confidence * 100, 1),
        "probabilities": prob_dict,
        "reasoning": reasoning,
    }


def _build_reasoning(text: str, priority: str, confidence: float) -> str:
    keywords = {
        "Critical": ["critical", "down", "outage", "403", "500", "block", "urgent", "production", "cannot", "failed"],
        "High": ["error", "bug", "issue", "failure", "broken", "sync", "billing", "payment", "auth"],
        "Medium": ["slow", "warning", "intermittent", "delay", "ui", "display", "dark mode"],
        "Low": ["documentation", "update", "request", "typo", "suggestion", "example"],
    }
    found = [kw for kw in keywords.get(priority, []) if kw in text]
    if found:
        return f"Detected {priority.lower()}-signal keywords: {', '.join(found[:3])}. Confidence: {confidence:.0%}."
    return f"Model classified as {priority} with {confidence:.0%} confidence based on ticket semantics."
