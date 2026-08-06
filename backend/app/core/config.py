from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_service_key: str = ""
    frontend_url: str = "http://localhost:5173"
    model_path: str = "ml/model.pkl"
    vectorizer_path: str = "ml/vectorizer.pkl"
    label_encoder_path: str = "ml/label_encoder.pkl"
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_name: str = "TicketFlow AI Support"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
