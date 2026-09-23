"""X-RAY SQUARED — FastAPI entry point.

Run with:  uvicorn main:app --reload --port 8000
Or:        python main.py
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from config import settings
from models.database import init_db
from models.schemas import HealthResponse
from services import prediction

# ---------- Logging ----------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("xray_squared.main")


# ---------- Lifespan ----------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup tasks: ensure dirs, init DB, attempt to load the model."""
    logger.info("Starting X-RAY SQUARED backend...")
    settings.ensure_directories()
    init_db()
    logger.info("Database initialized.")
    prediction.load_model()
    status = prediction.model_status()
    if status["available"]:
        logger.info("Model loaded on device=%s", status["device"])
    else:
        logger.warning("Model not available: %s", status["error"])
        logger.warning(
            "Backend will start, but /api/analyze will return HTTP 503 until "
            "pneumonia_resnet18_best.pth is placed in trained_models/."
        )
    yield
    logger.info("Shutting down X-RAY SQUARED backend.")


# ---------- App ----------
app = FastAPI(
    title="X-RAY SQUARED — AI-Assisted Chest X-Ray Screening API",
    description=(
        "Academic/research prototype for AI-assisted chest X-ray screening, "
        "explainability (Grad-CAM), case prioritization and human-in-the-loop "
        "review. NOT a medical diagnosis system."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


# ---------- CORS ----------
cors_origins = settings.CORS_ORIGINS
if "*" in cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
logger.info("CORS allowed origins: %s", cors_origins)


# ---------- Static files ----------
# Serve /uploads and /results so the frontend can load images via URL.
uploads_dir = settings.BACKEND_ROOT / settings.UPLOAD_DIR
results_dir = settings.BACKEND_ROOT / settings.RESULT_DIR
uploads_dir.mkdir(parents=True, exist_ok=True)
results_dir.mkdir(parents=True, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")
app.mount("/results", StaticFiles(directory=str(results_dir)), name="results")


# ---------- Routers ----------
from api import analyze, cases, reviews, reports, analytics  # noqa: E402

app.include_router(analyze.router)
app.include_router(cases.router)
app.include_router(reviews.router)
app.include_router(reports.router)
app.include_router(analytics.router)


# ---------- Health ----------
@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Backend health check",
    description="Returns backend status and whether the trained model is available.",
)
def health():
    return HealthResponse(status="ok", model_available=prediction.model_available())


@app.get(
    "/model-status",
    tags=["Health"],
    summary="Detailed model status (for debugging)",
)
def model_status():
    return prediction.model_status()


# ---------- Root ----------
@app.get("/", tags=["Root"])
def root():
    return {
        "name": "X-RAY SQUARED",
        "tagline": "Smarter X-Rays. Clearer AI Insights.",
        "docs": "/docs",
        "health": "/health",
        "model_available": prediction.model_available(),
    }


# ---------- Run directly: python main.py ----------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
        log_level="info",
    )
