from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator, Field
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./sql_app.db"
    SECRET_KEY: str = Field(
        default="", description="JWT secret key - MUST be set in .env"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    REDIS_URL: str = "redis://localhost:6379"
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        description="Comma-separated list of allowed CORS origins",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_secret_key(self) -> "Settings":
        if not self.SECRET_KEY:
            raise ValueError(
                "\n\n[FATAL] SECRET_KEY is not set in .env file!\n"
                "Please add your SECRET_KEY to .env:\n"
                "  SECRET_KEY=<your-secure-key>\n\n"
                "Generate a secure key with:\n"
                '  python -c "import secrets; print(secrets.token_urlsafe(32))"\n'
            )

        if len(self.SECRET_KEY) < 32:
            raise ValueError(
                f"\n\n[FATAL] SECRET_KEY is too short! "
                f"Got {len(self.SECRET_KEY)} chars, minimum is 32.\n"
                f"Current value: {self.SECRET_KEY[:8]}...\n\n"
                "Generate a secure key with:\n"
                '  python -c "import secrets; print(secrets.token_urlsafe(32))"\n'
            )

        if self.SECRET_KEY == "CHANGE_ME_IN_PRODUCTION":
            raise ValueError(
                "\n\n[FATAL] SECRET_KEY is still set to placeholder value!\n"
                "Please generate and set a real SECRET_KEY in .env:\n"
                '  python -c "import secrets; print(secrets.token_urlsafe(32))"\n'
            )

        return self

    @property
    def is_production(self) -> bool:
        return not self.DATABASE_URL.startswith("sqlite")

    @property
    def allowed_origins(self) -> List[str]:
        return [
            origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()
        ]


settings = Settings()
