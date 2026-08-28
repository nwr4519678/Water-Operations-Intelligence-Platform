"""
Unit tests for DAHITI Egypt ingestion and dataset generation pipelines.
"""

import sys
import os
import pytest
import pandas as pd

# Add pipelines to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "pipelines")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from extract_dahiti_egypt import EGYPT_STATIONS, generate_synthetic_dahiti_data
from build_anomaly_dataset import process_station_anomaly_features
from build_water_level_dataset import regularize_and_feature_engineer_station
from water_operations_data.contracts import DahitiStationInfo, AnomalyDatasetRecord, WaterLevelDatasetRecord


def test_egypt_stations_count():
    assert len(EGYPT_STATIONS) == 19
    nasser_station = next((s for s in EGYPT_STATIONS if s["dahiti_id"] == 210), None)
    assert nasser_station is not None
    assert nasser_station["target_name"] == "Nasser, Lake"


def test_synthetic_data_generation():
    station_info = EGYPT_STATIONS[0]
    data = generate_synthetic_dahiti_data(station_info, start_year=2020, end_year=2021)
    assert data["code"] == 200
    assert "target" in data
    assert data["target"]["id"] == "210"
    assert len(data["data"]) > 0
    sample = data["data"][0]
    assert "date" in sample
    assert "wse" in sample
    assert "wse_u" in sample


def test_process_station_anomaly_features():
    station_info = EGYPT_STATIONS[0]
    raw_json = generate_synthetic_dahiti_data(station_info, start_year=2020, end_year=2021)
    df_anomaly = process_station_anomaly_features(raw_json)

    assert not df_anomaly.empty
    assert "rolling_mean_7d" in df_anomaly.columns
    assert "rolling_zscore_7d" in df_anomaly.columns
    assert "seasonal_anomaly" in df_anomaly.columns
    assert "is_anomaly" in df_anomaly.columns
    assert "anomaly_category" in df_anomaly.columns
    assert set(df_anomaly["is_anomaly"].unique()).issubset({0, 1})


def test_regularize_and_feature_engineer_station():
    station_info = EGYPT_STATIONS[0]
    raw_json = generate_synthetic_dahiti_data(station_info, start_year=2020, end_year=2021)
    df_wl = regularize_and_feature_engineer_station(raw_json)

    assert not df_wl.empty
    assert "sin_month" in df_wl.columns
    assert "wse_lag1" in df_wl.columns
    assert "target_wse_7d" in df_wl.columns
    assert "water_level_state" in df_wl.columns
    assert set(df_wl["water_level_state"].unique()).issubset({"Low_Water", "Normal", "High_Water", "Critical_Flood"})
