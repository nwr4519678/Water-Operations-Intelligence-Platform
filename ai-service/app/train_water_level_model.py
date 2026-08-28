"""Train and serialize the canonical water-level model used by the API."""
import hashlib, json, os
from datetime import datetime, timezone
from typing import Any
import joblib
import pandas as pd
from app.models.water_level_model import EnhancedWaterLevelModel

def compute_sha256(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""): digest.update(chunk)
    return digest.hexdigest()

def train_and_serialize_water_level_model(dataset_csv_path: str, model_dir: str) -> dict[str, Any]:
    if not os.path.isfile(dataset_csv_path): raise FileNotFoundError(dataset_csv_path)
    os.makedirs(model_dir, exist_ok=True); df = pd.read_csv(dataset_csv_path)
    model = EnhancedWaterLevelModel(); metrics = model.fit_and_evaluate(df, test_size=0.20, seed=42)
    joblib.dump(model, os.path.join(model_dir, "model.joblib"))
    metadata = {"model_name": model.model_name, "model_version": model.model_version, "artifact_format": "joblib", "framework": "python", "trained_at": datetime.now(timezone.utc).isoformat(), "input_schema_version": "1.0", "features": model.features, "targets": model.targets, "state_labels": model.state_labels, "training_dataset": {"name": os.path.basename(dataset_csv_path), "sha256": compute_sha256(dataset_csv_path), "row_count": len(df)}, "evaluation": metrics}
    with open(os.path.join(model_dir, "metadata.json"), "w", encoding="utf-8") as stream: json.dump(metadata, stream, indent=2)
    return metadata
