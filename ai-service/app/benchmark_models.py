"""Compatibility entrypoint for the canonical benchmark pipeline."""
from app.pipelines.benchmark import (
    benchmark_anomaly_detection,
    benchmark_water_level_forecasting,
    run_full_benchmark,
)

__all__ = ["benchmark_anomaly_detection", "benchmark_water_level_forecasting", "run_full_benchmark"]

if __name__ == "__main__":
    run_full_benchmark()
