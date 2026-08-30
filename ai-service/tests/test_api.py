import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "Water Operations AI Service"


def test_list_models_endpoint(client):
    response = client.get("/v1/models")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "models" in data


def test_valid_anomaly_prediction(client):
    payload = {
        "dahiti_id": 210,
        "wse": 178.12,
        "wse_u": 0.032,
        "rolling_zscore_7d": 0.5,
        "rolling_zscore_30d": 0.8,
        "dwse_dt": 0.02,
        "uncertainty_ratio": 0.15,
        "iqr_outlier_flag": 0
    }
    response = client.post("/v1/models/predict-anomaly", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["dahiti_id"] == 210
    assert data["is_anomaly"] in [0, 1]
    assert data["anomaly_category"] == "normal"


def test_invalid_anomaly_nan_input(client):
    # Send NaN as a JSON string: httpx correctly rejects non-standard JSON
    # NaN before the request reaches FastAPI when passed as a Python float.
    payload = {"dahiti_id": 210, "wse": "NaN", "wse_u": 0.032}
    response = client.post("/v1/models/predict-anomaly", json=payload)
    assert response.status_code == 422


def test_invalid_anomaly_negative_id(client):
    payload = {"dahiti_id": -10, "wse": 178.12, "wse_u": 0.032}
    response = client.post("/v1/models/predict-anomaly", json=payload)
    assert response.status_code == 422


def test_batch_anomaly_prediction(client):
    payload = {
        "records": [
            {
                "dahiti_id": 210,
                "wse": 178.12,
                "wse_u": 0.032,
                "rolling_zscore_7d": 0.5,
                "rolling_zscore_30d": 0.8,
                "dwse_dt": 0.02,
                "uncertainty_ratio": 0.15,
                "iqr_outlier_flag": 0
            }
        ]
    }
    response = client.post("/v1/models/batch-predict-anomaly", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["total_records"] == 1


def test_valid_water_level_prediction(client):
    payload = {
        "dahiti_id": 210,
        "wse": 178.12,
        "wse_lag1": 178.15,
        "wse_lag7": 178.35,
        "wse_lag30": 178.80,
        "upstream_wse": 178.12
    }
    response = client.post("/v1/models/predict-water-level", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["dahiti_id"] == 210
    assert "forecasts" in data
    assert data["water_level_state"] == "Normal"
    assert "7th-next observation" in data["forecast_semantics"]


def test_batch_water_level_prediction(client):
    payload = {
        "records": [
            {
                "dahiti_id": 210,
                "wse": 178.12,
                "wse_lag1": 178.15,
                "wse_lag7": 178.35,
                "wse_lag30": 178.80,
                "upstream_wse": 178.12
            }
        ]
    }
    response = client.post("/v1/models/batch-predict-water-level", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["total_records"] == 1


def test_backend_integration_insights_endpoint(client):
    payload = {
        "organizationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "stationId": "7ca85f64-5717-4562-b3fc-2c963f66afa7",
        "insightType": "anomaly",
        "asOfUtc": "2026-08-28T19:00:00Z",
        "parameterId": 1,
        "observations": [
            {"timestampUtc": "2026-08-28T19:00:00Z", "value": 178.12}
        ]
    }
    response = client.post("/insights", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["modelVersion"] == "1.1.0"
    assert data["insightType"] == "anomaly"
    assert "payloadJson" in data
    assert data["isFallback"] is False
