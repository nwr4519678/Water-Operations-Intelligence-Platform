import os
import logging
from app.pipelines.train_anomaly import train_and_serialize_anomaly_model
from app.pipelines.train_water_level import train_and_serialize_water_level_model

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def run_full_training():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

    anomaly_csv = os.path.join(base_dir, "data-engineering", "Output_Data", "processed", "dahiti_egypt_anomaly_dataset.csv")
    if not os.path.exists(anomaly_csv):
        anomaly_csv = os.path.join(base_dir, "data-engineering", "data", "processed", "dahiti_egypt_anomaly_dataset.csv")

    wl_csv = os.path.join(base_dir, "data-engineering", "Output_Data", "processed", "dahiti_egypt_water_level_training_dataset.csv")
    if not os.path.exists(wl_csv):
        wl_csv = os.path.join(base_dir, "data-engineering", "data", "processed", "dahiti_egypt_water_level_training_dataset.csv")

    artifacts_dir = os.path.join(os.path.dirname(__file__), "..", "models", "artifacts")
    anomaly_dir = os.path.join(artifacts_dir, "anomaly")
    wl_dir = os.path.join(artifacts_dir, "water_level")

    logger.info("=== 1. TRAINING & SERIALIZING ANOMALY DETECTION MODEL ===")
    anomaly_meta = train_and_serialize_anomaly_model(anomaly_csv, anomaly_dir)

    logger.info("=== 2. TRAINING & SERIALIZING WATER LEVEL FORECASTING MODEL ===")
    wl_meta = train_and_serialize_water_level_model(wl_csv, wl_dir)

    logger.info("=== PRODUCTION MODEL SERIALIZATION COMPLETE ===")
    return anomaly_meta, wl_meta


if __name__ == "__main__":
    run_full_training()
