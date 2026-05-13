from pydantic_settings import BaseSettings
from typing import List
import json

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SECRET_KEY: str
    
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # OpenMeteo 
    OPENMETEO_API_URL: str = "https://api.open-meteo.com/v1"
    
    # CORS
    CORS_ORIGINS: str = '["http://localhost:3000", "http://localhost:5173"]'

    @property
    def cors_origins_list(self) -> List[str]:
        return json.loads(self.CORS_ORIGINS)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"          # ← Important: prevents this error in future


settings = Settings()