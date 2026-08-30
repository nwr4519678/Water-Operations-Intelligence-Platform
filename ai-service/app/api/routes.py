import json
import logging
import math
from typing import Dict, Any
import numpy as np
import pandas as pd
from fastapi import APIRouter

from app.core.config import settings
from app.services.model_loader import model_loader
from app.services.prediction_service import prediction_service
from app.api.schemas import (
    HealthResponse,
    AnomalyPredictionRequest,
    AnomalyPredictionResponse,
    BatchAnomalyRequest,
    WaterLevelPredictionRequest,
    WaterLevelPredictionResponse,
    BatchWaterLevelRequest,
    BackendInsightRequest,
    BackendInsightResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="healthy",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        models_loaded=model_loader.get_loaded_keys()
    )


@router.get("/v1/models")
def list_models() -> Dict[str, Any]:
    models_info = []

    anomaly_meta = model_loader.get_metadata("anomaly")
    if anomaly_meta:
        models_info.append({
            "model_name": anomaly_meta.get("model_name", "EnhancedAnomalyModel"),
            "model_version": anomaly_meta.get("model_version", "1.1.0"),
            "status": "loaded",
            "artifact_format": anomaly_meta.get("artifact_format", "joblib"),
            "features": anomaly_meta.get("features", []),
            "training_dataset": anomaly_meta.get("training_dataset", {}),
            "evaluation": anomaly_meta.get("evaluation", {}),
            "benchmark": model_loader.benchmark_data.get("anomaly_benchmark", {})
        })

    wl_meta = model_loader.get_metadata("water_level")
    if wl_meta:
        models_info.append({
            "model_name": wl_meta.get("model_name", "EnhancedWaterLevelModel"),
            "model_version": wl_meta.get("model_version", "1.1.0"),
            "status": "loaded",
            "artifact_format": wl_meta.get("artifact_format", "joblib"),
            "features": wl_meta.get("features", []),
            "state_labels": wl_meta.get("state_labels", []),
            "training_dataset": wl_meta.get("training_dataset", {}),
            "evaluation": wl_meta.get("evaluation", {}),
            "benchmark": model_loader.benchmark_data.get("water_level_benchmark", {})
        })

    return {"status": "success", "models": models_info}


@router.post("/v1/models/predict-anomaly", response_model=AnomalyPredictionResponse)
def predict_anomaly(req: AnomalyPredictionRequest) -> AnomalyPredictionResponse:
    res = prediction_service.predict_anomaly(req.model_dump())
    return AnomalyPredictionResponse(**res)


@router.post("/v1/models/batch-predict-anomaly")
def batch_predict_anomaly(req: BatchAnomalyRequest) -> Dict[str, Any]:
    results = [prediction_service.predict_anomaly(record.model_dump()) for record in req.records]
    return {"status": "success", "total_records": len(results), "predictions": results}


@router.post("/v1/models/predict-water-level", response_model=WaterLevelPredictionResponse)
def predict_water_level(req: WaterLevelPredictionRequest) -> WaterLevelPredictionResponse:
    res = prediction_service.predict_water_level(req.model_dump())
    return WaterLevelPredictionResponse(**res)


@router.post("/v1/models/batch-predict-water-level")
def batch_predict_water_level(req: BatchWaterLevelRequest) -> Dict[str, Any]:
    results = [prediction_service.predict_water_level(record.model_dump()) for record in req.records]
    return {"status": "success", "total_records": len(results), "predictions": results}


# --- .NET Backend Integration Bridge Endpoint (/insights) ---

@router.post("/insights", response_model=BackendInsightResponse)
@router.post("/v1/insights", response_model=BackendInsightResponse)
def get_backend_insight(req: BackendInsightRequest) -> BackendInsightResponse:
    """Endpoint serving backend HttpAiModelClient requests from .NET WaterOperations.Infrastructure."""
    insight_type = req.insightType.strip().lower()
    
    # Build features from the actual backend observation series. Never use a
    # fabricated constant as production input.
    observations = sorted(req.observations or [], key=lambda item: item.timestampUtc or "")
    if not observations:
        return BackendInsightResponse(
            modelVersion="NO_DATA", insightType=insight_type,
            payloadJson=json.dumps({"status": "NO_DATA", "details": "No telemetry observations supplied"}),
            isFallback=True
        )
    values = np.asarray([float(obs.value) for obs in observations], dtype=float)
    if not np.isfinite(values).all():
        return BackendInsightResponse(
            modelVersion="INVALID_DATA", insightType=insight_type,
            payloadJson=json.dumps({"status": "INVALID_DATA", "details": "Telemetry contains non-finite values"}),
            isFallback=True
        )
    current_wse = float(values[-1])
    current_uncertainty = float(observations[-1].uncertaintyMeters or 0.032)
    station_id = 210
    if req.stationId:
        station_id = max(1, sum(ord(char) for char in req.stationId) % 2_000_000_000)

    def lag(offset: int) -> float:
        return float(values[-1 - offset]) if len(values) > offset else current_wse

    def anomaly_features() -> dict[str, float | int]:
        recent = values[-3:]
        medium = values[-5:]
        std7 = float(np.std(recent, ddof=1)) if len(recent) > 1 else 0.05
        std30 = float(np.std(medium, ddof=1)) if len(medium) > 1 else 0.08
        prev = float(values[-2]) if len(values) > 1 else current_wse
        z7 = (current_wse - float(np.mean(recent))) / (std7 + 1e-6)
        z30 = (current_wse - float(np.mean(medium))) / (std30 + 1e-6)
        q25, q75 = np.quantile(values, [0.25, 0.75]) if len(values) > 3 else (current_wse, current_wse)
        bound = 1.5 * (q75 - q25)
        return {
            "dahiti_id": station_id, "wse": current_wse, "wse_u": current_uncertainty,
            "rolling_zscore_7d": float(z7), "rolling_zscore_30d": float(z30),
            "dwse_dt": current_wse - prev, "uncertainty_ratio": current_uncertainty / (std30 + 1e-6),
            "iqr_outlier_flag": int(current_wse < q25 - bound or current_wse > q75 + bound),
        }

    if insight_type == "anomaly":
        anom_input = anomaly_features()
        res = prediction_service.predict_anomaly(anom_input)
        return BackendInsightResponse(
            modelVersion=res.get("model_version", "NO_MODEL"),
            insightType="anomaly",
            payloadJson=json.dumps(res),
            isFallback=False
        )
    elif insight_type in ["forecast", "water_level", "risk-score"]:
        wl_input = {
            "dahiti_id": station_id,
            "wse": current_wse,
            "wse_lag1": lag(1),
            "wse_lag3": lag(3),
            "wse_lag7": lag(7),
            "wse_lag14": lag(14),
            "wse_lag30": lag(30),
            "upstream_wse": current_wse
        }
        if observations[-1].timestampUtc:
            timestamp = pd.to_datetime(observations[-1].timestampUtc, utc=True)
            wl_input.update({
                "sin_month": math.sin(2 * math.pi * timestamp.month / 12),
                "cos_month": math.cos(2 * math.pi * timestamp.month / 12),
                "day_of_year": timestamp.dayofyear,
            })
        res = prediction_service.predict_water_level(wl_input)
        return BackendInsightResponse(
            modelVersion=res.get("model_version", "NO_MODEL"),
            insightType=insight_type,
            payloadJson=json.dumps(res),
            isFallback=False
        )
    else:
        payload = {
            "insight_type": insight_type,
            "station_id": req.stationId,
            "status": "HEALTHY",
            "details": f"AI microservice operational insight for {insight_type}"
        }
        return BackendInsightResponse(
            modelVersion="1.1.0",
            insightType=insight_type,
            payloadJson=json.dumps(payload),
            isFallback=False
        )
