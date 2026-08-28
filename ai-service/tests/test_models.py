import sys
import os
import pytest
import pandas as pd
import joblib

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.anomaly_model import EnhancedAnomalyModel
from app.models.water_level_model import EnhancedWaterLevelModel
from app.pipelines.train_anomaly import compute_sha256


def test_anomaly_model_joblib_serialization(tmp_path):
    model = EnhancedAnomalyModel()
    joblib_file = tmp_path / "model.joblib"

    joblib.dump(model, joblib_file)
    assert joblib_file.exists()

    loaded_model = joblib.load(joblib_file)
    assert loaded_model.model_name == "EnhancedAnomalyModel"

    row = {
        "wse_u": 0.03, "rolling_zscore_7d": 0.2, "rolling_zscore_30d": 0.4,
        "dwse_dt": 0.01, "uncertainty_ratio": 0.1, "iqr_outlier_flag": 0
    }
    is_anom, cat = loaded_model.predict_single_with_z(row)
    assert is_anom == 0
    assert cat == "normal"


def test_water_level_model_joblib_serialization(tmp_path):
    model = EnhancedWaterLevelModel()
    joblib_file = tmp_path / "model.joblib"

    joblib.dump(model, joblib_file)
    assert joblib_file.exists()

    loaded_model = joblib.load(joblib_file)
    assert loaded_model.model_name == "EnhancedWaterLevelModel"

    forecasts, state = loaded_model.predict_single(178.12, 178.15, 178.35, 178.80, 178.12)
    assert forecasts["target_wse_1d"] > 0
    assert state in ["Low_Water", "Normal", "High_Water", "Critical_Flood"]


def test_compute_sha256(tmp_path):
    dummy = tmp_path / "dataset.csv"
    dummy.write_text("a,b\n1,2\n")
    digest = compute_sha256(str(dummy))
    assert len(digest) == 64
