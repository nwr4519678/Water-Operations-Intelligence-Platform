from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.services.model_loader import model_loader
from app.api.routes import router as api_router

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI Lifespan Startup: Loads binary joblib model artifacts once into memory."""
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    model_loader.load_artifacts()
    yield
    logger.info("Shutting down AI Service...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production AI Microservice serving serialized joblib models for 19 DAHITI Virtual Stations in Egypt",
    version=settings.VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Pydantic's error context may contain ValueError objects, which are not
    # JSON serializable by Starlette's JSONResponse.
    errors = [
        {
            "type": error.get("type", "validation_error"),
            "loc": error.get("loc", ()),
            "msg": error.get("msg", "Input validation failed"),
        }
        for error in exc.errors()
    ]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"status": "error", "message": "Input validation failed", "errors": errors}
    )


app.include_router(api_router)
