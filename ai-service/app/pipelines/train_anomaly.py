import os
import json
import hashlib
import logging
from datetime import datetime, timezone
from typing import Dict, Any
import pandas as pd
import joblib

from app.models.anomaly_model import EnhancedAnomalyModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def compute_sha256(filepath: str) -> str:
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def train_and_serialize_anomaly_model(dataset_csv_path: str, model_dir: str) -> Dict[str, Any]:
    if not os.path.exists(dataset_csv_path):
        logger.error(f"Dataset {dataset_csv_path} not found!")
        return {}

    os.makedirs(model_dir, exist_ok=True)
    df = pd.read_csv(dataset_csv_path)
    ds_hash = compute_sha256(dataset_csv_path)

    model = EnhancedAnomalyModel()
    metrics = model.fit_and_evaluate(df, test_size=0.20, seed=42)

    # Save joblib binary
    joblib_path = os.path.join(model_dir, "model.joblib")
    joblib.dump(model, joblib_path)
    logger.info(f"Saved Anomaly Model joblib binary to {joblib_path}")

    # Save metadata.json
    metadata = {
        "model_name": "EnhancedAnomalyModel",
        "model_version": "1.1.0",
        "artifact_format": "joblib",
        "framework": "python/scikit-learn",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "input_schema_version": "1.0",
        "features": model.features,
        "target": "is_anomaly",
        "categories": model.categories,
        "training_dataset": {
            "name": os.path.basename(dataset_csv_path),
            "sha256": ds_hash,
            "row_count": len(df)
        },
        "evaluation": metrics
    }

    meta_path = os.path.join(model_dir, "metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"Saved Anomaly Model metadata to {meta_path}")

    return metadata


if __name__ == "__main__":
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    dataset_path = os.path.join(base_dir, "data-engineering", "Output_Data", "processed", "dahiti_egypt_anomaly_dataset.csv")
    m_dir = os.path.join(os.path.dirname(__file__), "..", "models", "artifacts", "anomaly")
    train_and_serialize_anomaly_model(dataset_path, m_dir)
