from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # --- Database ---
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = "password"
    DB_NAME: str = "placement_portal"

    # --- Auth / JWT ---
    SECRET_KEY: str = "change-this-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # --- App ---
    APP_NAME: str = "Placement Portal API"
    ENV: str = "development"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # --- Signup domain allow-list (matches frontend AuthLoginForm check) ---
    ALLOWED_EMAIL_DOMAINS: str = "iith.ac.in,hustlegrad.com,miet.ac.in"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def allowed_domains_list(self) -> List[str]:
        return [d.strip() for d in self.ALLOWED_EMAIL_DOMAINS.split(",") if d.strip()]

    @property
    def database_url(self) -> str:
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
