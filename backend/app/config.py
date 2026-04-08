from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str

    # File uploads
    upload_dir: str = "./uploads"

    # Auth
    secret_key: str
    access_token_expire_hours: int = 8

    # Resend
    resend_api_key: str
    resend_from_email: str

    # Umami (optional)
    umami_base_url: str = ""
    umami_api_key: str = ""
    umami_website_id: str = ""

    # Security
    admin_ip_whitelist: str = ""
    trust_proxy: bool = False

    # CORS
    allowed_origins: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    @property
    def async_database_url(self) -> str:
        url = self.database_url
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
