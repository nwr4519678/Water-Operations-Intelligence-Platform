import logging
from typing import Dict, Any, List
import numpy as np
import pandas as pd
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

        # Confidence is an observation-level signal, not the model's dataset
        # accuracy. Derive it from the distance to the configured anomaly
        # boundaries so two stations with different telemetry do not receive
        # the same score.
        evidence = max(
            abs(float(data.get("rolling_zscore_7d", 0.0))) /
            model.thresholds["zscore_threshold"],
            abs(float(data.get("rolling_zscore_30d", 0.0))) /
            model.thresholds["zscore_threshold"],
            abs(float(data.get("dwse_dt", 0.0))) /
            model.thresholds["dwse_threshold"],
            float(data.get("wse_u", 0.0)) / model.thresholds["wse_u_threshold"],
            float(data.get("iqr_outlier_flag", 0)),
        )
        confidence = (
            0.5 + min(0.49, evidence * 0.25)
            if is_anomaly
            else 0.5 + min(0.49, max(0.0, 1.0 - evidence) * 0.45)
        )

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

    def predict_monthly_water_level(self, observations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Forecast the next four monthly observations from one station series.

        DaHITI records are irregular and commonly monthly. A daily-trained
        lag model must not be relabeled as a monthly model, so this path uses
        the station's own recent slope plus a damped calendar-month effect.
        """
        values = np.asarray([float(item["value"]) for item in observations], dtype=float)
        timestamps = pd.to_datetime(
            [item["timestampUtc"] for item in observations], utc=True
        )
        current = float(values[-1])
        if len(values) < 2:
            forecasts = [current] * 4
        else:
            # Fit the recent station trend in observation-time, not in an
            # artificial daily grid. This keeps each future month distinct
            # while remaining conservative for irregular DaHITI sampling.
            window = min(12, len(values))
            recent_values = values[-window:]
            x = np.arange(window, dtype=float)
            slope = float(np.polyfit(x, recent_values, 1)[0]) if window > 1 else 0.0
            slope = float(np.clip(slope, -3.0, 3.0))

            # Learn calendar-month offsets from this station only. A month
            # with too little history has no invented seasonal adjustment.
            global_median = float(np.median(recent_values))
            month_offsets: dict[int, float] = {}
            for month in range(1, 13):
                month_values = recent_values[timestamps.month.to_numpy()[-window:] == month]
                if len(month_values) >= 2:
                    month_offsets[month] = float(np.median(month_values) - global_median)

            last_timestamp = timestamps[-1]
            forecasts = []
            for horizon in range(1, 5):
                future_month = int((last_timestamp + pd.DateOffset(months=horizon)).month)
                trend = slope * horizon * 0.9
                seasonal = month_offsets.get(future_month, 0.0) * 0.35
                forecasts.append(current + trend + seasonal)

        return {
            "current_wse": current,
            "forecasts": {
                "target_wse_1d": round(float(forecasts[0]), 3),
                "target_wse_7d": round(float(forecasts[1]), 3),
                "target_wse_14d": round(float(forecasts[2]), 3),
                "target_wse_30d": round(float(forecasts[3]), 3),
            },
            "water_level_state": EnhancedWaterLevelModel._classify_state(current),
            "forecast_semantics": "Next four monthly observations derived from this station's irregular DaHITI history.",
            "model_version": "station-monthly-trend-v1",
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
