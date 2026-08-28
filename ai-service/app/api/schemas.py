import math
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, field_validator


def validate_finite_number(v: float, field_name: str) -> float:
    if math.isnan(v) or math.isinf(v):
        raise ValueError(f"{field_name} must be a finite number (NaN and Infinity are invalid)")
    return v


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    models_loaded: List[str]


class AnomalyPredictionRequest(BaseModel):
    dahiti_id: int = Field(..., gt=0, example=210, description="Valid positive DAHITI station ID")
    wse: float = Field(..., example=178.12, description="Water Surface Elevation (m)")
    wse_u: float = Field(..., ge=0.0, example=0.032, description="Measurement Uncertainty (m)")
    rolling_zscore_7d: float = Field(0.0, example=0.5)
    rolling_zscore_30d: float = Field(0.0, example=0.8)
    dwse_dt: float = Field(0.0, example=0.02)
    uncertainty_ratio: float = Field(0.1, example=0.15)
    iqr_outlier_flag: int = Field(0, ge=0, le=1, example=0)

    @field_validator("wse", "wse_u", "rolling_zscore_7d", "rolling_zscore_30d", "dwse_dt", "uncertainty_ratio")
    @classmethod
    def check_finite(cls, v: float, info) -> float:
        return validate_finite_number(v, info.field_name)


class AnomalyPredictionResponse(BaseModel):
    dahiti_id: int
    is_anomaly: int
    anomaly_category: str
    confidence_score: float
    model_version: str
    evaluation: Dict[str, Any]


class BatchAnomalyRequest(BaseModel):
    records: List[AnomalyPredictionRequest] = Field(..., min_length=1)


class WaterLevelPredictionRequest(BaseModel):
    dahiti_id: int = Field(..., gt=0, example=210)
    wse: float = Field(..., example=178.12)
    wse_lag1: Optional[float] = Field(None, example=178.15)
    wse_lag7: Optional[float] = Field(None, example=178.35)
    wse_lag30: Optional[float] = Field(None, example=178.80)
    upstream_wse: Optional[float] = Field(None, example=178.12)
    observed_at: Optional[str] = Field(None, description="UTC timestamp of the current DAHITI observation")
    wse_lag3: Optional[float] = None
    wse_lag14: Optional[float] = None
    sin_month: Optional[float] = None
    cos_month: Optional[float] = None
    day_of_year: Optional[float] = None

    @field_validator("wse", "wse_lag1", "wse_lag7", "wse_lag30", "upstream_wse")
    @classmethod
    def check_finite(cls, v: Optional[float], info) -> Optional[float]:
        if v is not None:
            return validate_finite_number(v, info.field_name)
        return v


class MultiHorizonForecast(BaseModel):
    target_wse_1d: float
    target_wse_7d: float
    target_wse_14d: float
    target_wse_30d: float


class WaterLevelPredictionResponse(BaseModel):
    dahiti_id: int
    current_wse: float
    forecasts: MultiHorizonForecast
    water_level_state: str
    forecast_semantics: str
    model_version: str
    evaluation: Dict[str, Any]


class BatchWaterLevelRequest(BaseModel):
    records: List[WaterLevelPredictionRequest] = Field(..., min_length=1)


# --- Backend Integration Contracts (.NET IAiModelClient) ---

class AiTelemetryObservation(BaseModel):
    timestampUtc: Optional[str] = None
    value: float
    uncertaintyMeters: Optional[float] = None


class BackendInsightRequest(BaseModel):
    organizationId: Optional[str] = None
    stationId: Optional[str] = None
    insightType: str
    asOfUtc: Optional[str] = None
    parameterId: Optional[int] = None
    observations: Optional[List[AiTelemetryObservation]] = None


class BackendInsightResponse(BaseModel):
    modelVersion: str
    insightType: str
    payloadJson: str
    isFallback: bool = False
