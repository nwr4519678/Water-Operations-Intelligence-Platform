"""
Standalone script to serialize both models to joblib binaries.
Runs without any app package imports - self-contained.
"""
import os
import sys
import logging
from typing import Dict, Any, Tuple, Optional
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class EnhancedAnomalyModel:
    def __init__(self, thresholds=None):
        self.thresholds = thresholds or {
            "zscore_threshold": 2.2,
            "dwse_threshold": 0.30,
            "uncertainty_ratio_threshold": 0.40,
            "wse_u_threshold": 0.40
        }
        self.categories = ["normal", "sensor_noise", "flash_spike", "rapid_drop", "drought_drop", "outlier_spike"]
        self.features = [
            "wse", "wse_u", "rolling_zscore_7d", "rolling_zscore_30d",
            "dwse_dt", "seasonal_anomaly", "uncertainty_ratio", "iqr_outlier_flag"
        ]
        self.model_name = "EnhancedAnomalyModel"
        self.model_version = "1.1.0"
        self.metrics = {}

    def predict_single_with_z(self, row, z_thresh=None):
        z_t = z_thresh if z_thresh is not None else self.thresholds["zscore_threshold"]
        wse_u = float(row["wse_u"])
        z7 = float(row["rolling_zscore_7d"])
        z30 = float(row["rolling_zscore_30d"])
        dwse_dt = float(row["dwse_dt"])
        unc_ratio = float(row["uncertainty_ratio"])
        iqr_flag = int(row["iqr_outlier_flag"])

        is_z = abs(z7) > z_t or abs(z30) > z_t
        is_step = abs(dwse_dt) > self.thresholds["dwse_threshold"]
        is_noise = wse_u > self.thresholds["wse_u_threshold"] or unc_ratio > self.thresholds["uncertainty_ratio_threshold"]
        is_anomaly = 1 if (is_z or is_step or is_noise or iqr_flag == 1) else 0

        if is_anomaly == 0:
            category = "normal"
        elif wse_u > self.thresholds["wse_u_threshold"]:
            category = "sensor_noise"
        elif dwse_dt > self.thresholds["dwse_threshold"]:
            category = "flash_spike"
        elif dwse_dt < -self.thresholds["dwse_threshold"]:
            category = "rapid_drop"
        else:
            category = "outlier_spike"

        return is_anomaly, category


class EnhancedWaterLevelModel:
    def __init__(self, weights=None):
        self.weights = weights or {
            "lag1_weight": 0.45,
            "lag7_weight": 0.25,
            "lag30_weight": 0.15,
            "upstream_weight": 0.15,
            "decay_factor_7d": 0.98,
            "decay_factor_14d": 0.95,
            "decay_factor_30d": 0.90
        }
        self.state_labels = ["Low_Water", "Normal", "High_Water", "Critical_Flood"]
        self.features = [
            "wse", "wse_lag1", "wse_lag3", "wse_lag7", "wse_lag14",
            "wse_lag30", "upstream_wse", "sin_month", "cos_month", "day_of_year"
        ]
        self.targets = ["target_wse_1d", "target_wse_7d", "target_wse_14d", "target_wse_30d", "water_level_state"]
        self.model_name = "EnhancedWaterLevelModel"
        self.model_version = "1.1.0"
        self.metrics = {}

    def predict_single(self, wse, lag1, lag7, lag30, upstream_wse):
        w = self.weights
        base_estimate = (
            w["lag1_weight"] * lag1 +
            w["lag7_weight"] * lag7 +
            w["lag30_weight"] * lag30 +
            w["upstream_weight"] * (upstream_wse if upstream_wse < 100 else wse)
        )
        delta = wse - base_estimate

        forecast_1d = round(wse + 0.5 * delta, 3)
        forecast_7d = round(wse + 0.8 * delta * w["decay_factor_7d"], 3)
        forecast_14d = round(wse + 0.6 * delta * w["decay_factor_14d"], 3)
        forecast_30d = round(wse + 0.4 * delta * w["decay_factor_30d"], 3)

        if wse < 20.0 or (wse > 100 and wse < 145.0):
            state = "Low_Water"
        elif wse > 180.5 or (wse > 28.0 and wse < 40.0) or wse > 74.5:
            state = "Critical_Flood"
        elif wse > 179.5 or wse > 72.0:
            state = "High_Water"
        else:
            state = "Normal"

        return {"target_wse_1d": forecast_1d, "target_wse_7d": forecast_7d,
                "target_wse_14d": forecast_14d, "target_wse_30d": forecast_30d}, state


if __name__ == "__main__":
    try:
        import joblib
        logger.info(f"joblib version: {joblib.__version__}")
    except ImportError:
        logger.error("joblib not installed. Run: pip install joblib")
        sys.exit(1)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    ai_service_dir = os.path.join(script_dir, "..")

    # Output dirs - both old and new structure
    paths = [
        os.path.join(ai_service_dir, "app", "models", "artifacts", "anomaly"),
        os.path.join(ai_service_dir, "app", "models", "anomaly"),
        os.path.join(ai_service_dir, "app", "models", "artifacts", "water_level"),
        os.path.join(ai_service_dir, "app", "models", "water_level"),
    ]
    for p in paths:
        os.makedirs(p, exist_ok=True)

    # Serialize Anomaly Model
    anomaly_model = EnhancedAnomalyModel()
    anomaly_model.thresholds["zscore_threshold"] = 2.2  # best threshold

    for out_dir in [
        os.path.join(ai_service_dir, "app", "models", "artifacts", "anomaly"),
        os.path.join(ai_service_dir, "app", "models", "anomaly"),
    ]:
        out_path = os.path.join(out_dir, "model.joblib")
        joblib.dump(anomaly_model, out_path)
        size = os.path.getsize(out_path)
        logger.info(f"Saved EnhancedAnomalyModel -> {out_path} ({size} bytes)")

    # Serialize Water Level Model
    wl_model = EnhancedWaterLevelModel()

    for out_dir in [
        os.path.join(ai_service_dir, "app", "models", "artifacts", "water_level"),
        os.path.join(ai_service_dir, "app", "models", "water_level"),
    ]:
        out_path = os.path.join(out_dir, "model.joblib")
        joblib.dump(wl_model, out_path)
        size = os.path.getsize(out_path)
        logger.info(f"Saved EnhancedWaterLevelModel -> {out_path} ({size} bytes)")

    logger.info("=== ALL MODEL.JOBLIB ARTIFACTS GENERATED ===")

    # Verification: load back and run a test prediction
    loaded_anomaly = joblib.load(os.path.join(ai_service_dir, "app", "models", "artifacts", "anomaly", "model.joblib"))
    test_row = {"wse_u": 0.03, "rolling_zscore_7d": 0.2, "rolling_zscore_30d": 0.4,
                "dwse_dt": 0.01, "uncertainty_ratio": 0.1, "iqr_outlier_flag": 0}
    flag, cat = loaded_anomaly.predict_single_with_z(test_row)
    logger.info(f"Verification Anomaly: is_anomaly={flag}, category={cat}")

    loaded_wl = joblib.load(os.path.join(ai_service_dir, "app", "models", "artifacts", "water_level", "model.joblib"))
    forecasts, state = loaded_wl.predict_single(178.12, 178.15, 178.35, 178.80, 178.12)
    logger.info(f"Verification Water Level: state={state}, 7d_forecast={forecasts['target_wse_7d']}")

    print("\n=== SUCCESS: model.joblib files created and verified ===")
