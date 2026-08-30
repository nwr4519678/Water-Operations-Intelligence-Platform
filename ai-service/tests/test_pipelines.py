import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.pipelines.benchmark import benchmark_anomaly_detection, benchmark_water_level_forecasting


def test_benchmark_functions(tmp_path):
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    anomaly_csv = os.path.join(base_dir, "data-engineering", "Output_Data", "processed", "dahiti_egypt_anomaly_dataset.csv")
    wl_csv = os.path.join(base_dir, "data-engineering", "Output_Data", "processed", "dahiti_egypt_water_level_dataset.csv")

    if os.path.exists(anomaly_csv):
        anom_res = benchmark_anomaly_detection(anomaly_csv)
        assert "baselines" in anom_res
        assert "f1_lift_vs_zscore_3.0_percent" in anom_res["performance_gain"]

    if os.path.exists(wl_csv):
        wl_res = benchmark_water_level_forecasting(wl_csv)
        assert "baselines" in wl_res
        assert "mae_error_reduction_vs_persistence_percent" in wl_res["performance_gain"]
