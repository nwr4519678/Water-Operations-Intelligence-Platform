"""
Master Production Model Training & Serialization Runner.
"""

import os
import logging
from app.train_anomaly_model import train_and_serialize_anomaly_model
from app.train_water_level_model import train_and_serialize_water_level_model

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def run_full_training():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

    anomaly_csv = os.path.join(base_dir, "data-engineering", "data", "processed", "dahiti_egypt_anomaly_dataset.csv")

    wl_csv = os.path.join(base_dir, "data-engineering", "data", "processed", "dahiti_egypt_water_level_dataset.csv")

    artifact_dir = os.path.join(os.path.dirname(__file__), "models", "artifacts")
    anomaly_model_dir = os.path.join(artifact_dir, "anomaly")
    wl_model_dir = os.path.join(artifact_dir, "water_level")

    logger.info("=== 1. TRAINING & SERIALIZING ANOMALY DETECTION MODEL ===")
    anomaly_meta = train_and_serialize_anomaly_model(anomaly_csv, anomaly_model_dir)

    logger.info("=== 2. TRAINING & SERIALIZING WATER LEVEL FORECASTING MODEL ===")
    wl_meta = train_and_serialize_water_level_model(wl_csv, wl_model_dir)

    logger.info("=== PRODUCTION MODEL SERIALIZATION COMPLETE ===")
    return anomaly_meta, wl_meta


if __name__ == "__main__":
    run_full_training()
