from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Water Operations AI Service", version="0.1.0")

class HealthResponse(BaseModel):
    status: str
    service: str

@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="healthy", service="ai-service")

@app.get("/v1/models")
def models() -> dict[str, list]:
    return {"data": []}
