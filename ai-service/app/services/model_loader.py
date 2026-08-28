import os
import json
import logging
from typing import Dict, Any, Optional
import joblib

from app.core.config import settings
from app.models.anomaly_model import EnhancedAnomalyModel
from app.models.water_level_model import EnhancedWaterLevelModel

logger = logging.getLogger(__name__)


class ModelLoader:
    """Singleton Manager for loading joblib binaries and metadata into memory at lifespan startup."""

    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.metadata: Dict[str, Any] = {}
        self.benchmark_data: Dict[str, Any] = {}

    def load_artifacts(self):
        model_dir = settings.MODEL_DIR
        logger.info(f"Loading AI model artifacts from {model_dir}...")

        # 1. Anomaly Model Artifacts
        anomaly_joblib = os.path.join(model_dir, "anomaly", "model.joblib")
        anomaly_meta = os.path.join(model_dir, "anomaly", "metadata.json")
        if os.path.exists(anomaly_joblib) and os.path.exists(anomaly_meta):
            try:
                self.models["anomaly"] = joblib.load(anomaly_joblib)
                with open(anomaly_meta, "r", encoding="utf-8") as f:
                    self.metadata["anomaly"] = json.load(f)
                logger.info("Successfully loaded EnhancedAnomalyModel joblib binary.")
            except Exception as e:
                logger.warning(f"Joblib load notice ({e}). Initializing EnhancedAnomalyModel instance.")
                self.models["anomaly"] = EnhancedAnomalyModel()
                with open(anomaly_meta, "r", encoding="utf-8") as f:
                    self.metadata["anomaly"] = json.load(f)
        else:
            logger.warning(f"Anomaly model artifact not found at {anomaly_joblib}. Initializing fallback model.")
            self.models["anomaly"] = EnhancedAnomalyModel()

        # 2. Water Level Forecasting Model Artifacts
        wl_joblib = os.path.join(model_dir, "water_level", "model.joblib")
        wl_meta = os.path.join(model_dir, "water_level", "metadata.json")
        if os.path.exists(wl_joblib) and os.path.exists(wl_meta):
            try:
                self.models["water_level"] = joblib.load(wl_joblib)
                with open(wl_meta, "r", encoding="utf-8") as f:
                    self.metadata["water_level"] = json.load(f)
                logger.info("Successfully loaded EnhancedWaterLevelModel joblib binary.")
            except Exception as e:
                logger.warning(f"Joblib load notice ({e}). Initializing EnhancedWaterLevelModel instance.")
                self.models["water_level"] = EnhancedWaterLevelModel()
                with open(wl_meta, "r", encoding="utf-8") as f:
                    self.metadata["water_level"] = json.load(f)
        else:
            logger.warning(f"Water level model artifact not found at {wl_joblib}. Initializing fallback model.")
            self.models["water_level"] = EnhancedWaterLevelModel()

        # 3. Benchmark Summary Artifacts
        bench_file = os.path.join(model_dir, "benchmark_summary.json")
        if os.path.exists(bench_file):
            try:
                with open(bench_file, "r", encoding="utf-8") as f:
                    self.benchmark_data = json.load(f)
            except Exception as e:
                logger.warning(f"Could not load benchmark summary: {e}")

    def get_model(self, key: str) -> Optional[Any]:
        return self.models.get(key)

    def get_metadata(self, key: str) -> Dict[str, Any]:
        return self.metadata.get(key, {})

    def get_loaded_keys(self) -> list[str]:
        return list(self.models.keys())


model_loader = ModelLoader()
