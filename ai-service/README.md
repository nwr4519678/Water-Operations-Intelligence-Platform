# Water Operations AI Microservice (`ai-service`)

Production AI microservice serving modular serialized `joblib` model artifacts for **Anomaly Detection** and **Water Level Forecasting** across 19 DAHITI Virtual Stations in Egypt.

---

## 1. Modular Directory Layout

```text
ai-service/
├── app/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes.py            # FastAPI REST endpoints
│   │   └── schemas.py           # Pydantic V2 DTO schemas
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py            # Environment configuration
│   │   └── logging.py           # Structured logging setup
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── anomaly_model.py     # EnhancedAnomalyModel class definition
│   │   ├── water_level_model.py # EnhancedWaterLevelModel class definition
│   │   └── artifacts/           # Serialized joblib models & metadata
│   │       ├── anomaly/
│   │       │   ├── model.joblib
│   │       │   └── metadata.json
│   │       ├── water_level/
│   │       │   ├── model.joblib
│   │       │   └── metadata.json
│   │       └── benchmark_summary.json
│   │
│   ├── pipelines/
│   │   ├── __init__.py
│   │   ├── train_anomaly.py     # Training pipeline for Anomaly Model
│   │   ├── train_water_level.py # Training pipeline for Water Level Model
│   │   ├── train_all.py         # Master training runner
│   │   └── benchmark.py         # Baseline benchmarking runner
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── model_loader.py      # Lifespan joblib model loader & singleton
│   │   └── prediction_service.py# Business inference service logic
│   │
│   ├── __init__.py
│   └── main.py                  # FastAPI application entrypoint
│
├── tests/
│   ├── __init__.py
│   ├── test_models.py           # Model unit tests
│   ├── test_api.py              # API integration tests
│   └── test_pipelines.py        # Pipeline & training tests
│
├── Dockerfile
├── .dockerignore
├── README.md
└── requirements.txt
```

---

## 2. Model Performance Summary

### Model 1: Anomaly Detection (`EnhancedAnomalyModel`)
- **Artifact**: `app/models/artifacts/anomaly/model.joblib`
- **Metadata**: `app/models/artifacts/anomaly/metadata.json`
- **Test Split Accuracy**: **`100%`** (`8/8` samples in 80/20 test split)
- **Full Dataset Accuracy**: **`97.22%`** (`35/36` samples)
- **Full Dataset F1 Score**: **`0.9729`**
- **Benchmark Lift**: **`+45.93%`** F1 gain over standard 3.0 Z-score baseline.

### Model 2: Water Level Forecasting (`EnhancedWaterLevelModel`)
- **Artifact**: `app/models/artifacts/water_level/model.joblib`
- **Metadata**: `app/models/artifacts/water_level/metadata.json`
- **MAE (7-Day Forecast Horizon)**: **`0.142 meters`**
- **RMSE (7-Day Forecast Horizon)**: **`0.185 meters`**
- **$R^2$ Score**: **`0.9680`**
- **Operational Risk State F1 Score**: **`0.9559`** (`95.83%` Accuracy)
- **Benchmark Lift**: **`79.27%`** MAE error reduction over Persistence Baseline.

---

## 3. Running & Training

### Environment Setup
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Re-Training Models
```bash
python -m app.pipelines.train_all
python -m app.pipelines.benchmark
```

### Running the API Microservice Locally
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Running Test Suite
```bash
pytest tests/
```

---

## 4. REST API Endpoints

- `GET /health` : Microservice health check & loaded models list
- `GET /v1/models` : Active model registry, joblib artifact paths, features, and verified evaluation metrics
- `POST /v1/models/predict-anomaly` : Real-time anomaly prediction
- `POST /v1/models/batch-predict-anomaly` : Batch anomaly prediction
- `POST /v1/models/predict-water-level` : Real-time multi-horizon level forecasting & risk state
- `POST /v1/models/batch-predict-water-level` : Batch water level prediction

---

## 5. Docker Deployment

```bash
docker build -t water-operations-ai-service:latest .
docker run -d -p 8000:8000 --name ai-service water-operations-ai-service:latest
```
