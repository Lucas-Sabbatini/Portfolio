import logging
import time
from contextlib import asynccontextmanager
from pathlib import Path

import resend
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.auth.router import router as auth_router
from app.config import get_settings
from app.content.router import router as content_router
from app.database import close_engine
from app.newsletter.router import router as newsletter_router
from app.post_images.router import router as post_images_router
from app.posts.router import router as posts_router
from app.rate_limit import limiter
from app.upload.router import router as upload_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()

# Set resend API key once at startup (not per-request)
resend.api_key = settings.resend_api_key


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_engine()


app = FastAPI(title="Blog API", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Cookie"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    logger.info("%s %s", request.method, request.url.path)
    response = await call_next(request)
    duration = time.time() - start
    logger.info(
        "%s %s completed %s in %.3fs",
        request.method,
        request.url.path,
        response.status_code,
        duration,
    )
    if request.url.path.startswith("/uploads/"):
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(posts_router)
app.include_router(content_router)
app.include_router(newsletter_router)
app.include_router(post_images_router)
app.include_router(upload_router)

# Serve uploaded files locally (dev only; production uses S3 via upload router)
if not settings.s3_bucket_name:
    _upload_dir = Path(settings.upload_dir)
    _upload_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(_upload_dir)), name="uploads")
