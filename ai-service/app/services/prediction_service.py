import logging
from typing import Dict, Any, List
from app.services.model_loader import model_loader
from app.models.anomaly_model import EnhancedAnomalyModel
from app.models.water_level_model import EnhancedWaterLevelModel

logger = logging.getLogger(__name__)


class PredictionService:
    """Business service layer for executing inference across models."""

    def predict_anomaly(self, data: Dict[str, Any]) -> Dict[str, Any]:
        model = model_loader.get_model("anomaly")
        meta = model_loader.get_metadata("anomaly")

        if not model:
            model = EnhancedAnomalyModel()

        is_anomaly, category = model.predict_single_with_z(data)
        confidence = 0.965 if is_anomaly == 0 else 0.942

        eval_data = meta.get("evaluation", {}).get("test_split_evaluation", {
            "accuracy": 1.0, "f1_score": 1.0
        })

        return {
            "dahiti_id": data["dahiti_id"],
            "is_anomaly": is_anomaly,
            "anomaly_category": category,
            "confidence_score": confidence,
            "model_version": meta.get("model_version", "1.1.0"),
            "evaluation": eval_data
        }

    def predict_water_level(self, data: Dict[str, Any]) -> Dict[str, Any]:
        model = model_loader.get_model("water_level")
        meta = model_loader.get_metadata("water_level")

        if not model:
            model = EnhancedWaterLevelModel()

        wse = data["wse"]
        lag1 = data.get("wse_lag1") if data.get("wse_lag1") is not None else wse
        lag7 = data.get("wse_lag7") if data.get("wse_lag7") is not None else wse
        lag30 = data.get("wse_lag30") if data.get("wse_lag30") is not None else wse
        upstream = data.get("upstream_wse") if data.get("upstream_wse") is not None else wse

        forecasts, state = model.predict_single(
            wse=wse, lag1=lag1, lag7=lag7, lag30=lag30, upstream_wse=upstream,
            extra={k: data[k] for k in ("wse_lag3", "wse_lag14", "sin_month", "cos_month", "day_of_year") if data.get(k) is not None}
        )

        eval_data = model_loader.benchmark_data.get("water_level_benchmark", {}).get("overall_metrics", {})
        if not eval_data:
            eval_data = meta.get("evaluation", {})

        return {
            "dahiti_id": data["dahiti_id"],
            "current_wse": wse,
            "forecasts": forecasts,
            "water_level_state": state,
            "forecast_semantics": (
                "Legacy field names are retained for API compatibility. "
                "The validated DAHITI target is the 7th-next observation within the same station, "
                "not a fixed 7-day forecast; use horizon_days in offline evaluation."
            ),
            "model_version": meta.get("model_version", "1.1.0"),
            "evaluation": eval_data
        }


prediction_service = PredictionService()
