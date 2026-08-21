import json
from pathlib import Path
from datetime import datetime, timezone

def generate_ai_fallback_fixtures():
    print("Generating AI Fallback Fixtures for Frontend Cards...")
    
    ai_fixtures = [
        {
            "station_id": "09504500",
            "station_name": "Oak_Creek_AZ",
            "prediction_timestamp": datetime.now(timezone.utc).isoformat(),
            "target_metric": "Streamflow",
            "predicted_value": 24.50,
            "confidence_interval": [22.10, 26.90],
            "confidence_score": 0.92,
            "anomaly_flag": False,
            "ui_state": "SUCCESS",
            "model_metadata": {
                "model_name": "WaterFlow-LSTM",
                "version": "v1.0-DEMO",
                "is_derived_data": True,
                "note": "Demo fixture data. Not official ground truth."
            }
        },
        {
            "station_id": "09380000",
            "station_name": "Colorado_River_AZ",
            "prediction_timestamp": datetime.now(timezone.utc).isoformat(),
            "target_metric": "Streamflow",
            "predicted_value": 480.20,
            "confidence_interval": [350.00, 610.40],
            "confidence_score": 0.45,
            "anomaly_flag": True,
            "ui_state": "LOW_CONFIDENCE",
            "model_metadata": {
                "model_name": "WaterFlow-LSTM",
                "version": "v1.0-DEMO",
                "is_derived_data": True,
                "note": "Demo fixture data. Not official ground truth."
            }
        },
        {
            "station_id": "01646500",
            "station_name": "Potomac_River_DC",
            "prediction_timestamp": datetime.now(timezone.utc).isoformat(),
            "target_metric": "Streamflow",
            "predicted_value": None,
            "confidence_interval": None,
            "confidence_score": None,
            "anomaly_flag": None,
            "ui_state": "NO_MODEL",
            "model_metadata": {
                "model_name": None,
                "version": None,
                "is_derived_data": True,
                "note": "AI model not yet trained for this regional watershed."
            }
        },
        {
            "station_id": "14105700",
            "station_name": "Columbia_River_OR",
            "prediction_timestamp": datetime.now(timezone.utc).isoformat(),
            "target_metric": "Streamflow",
            "predicted_value": None,
            "confidence_interval": None,
            "confidence_score": None,
            "anomaly_flag": None,
            "ui_state": "INSUFFICIENT_HISTORY",
            "model_metadata": {
                "model_name": "WaterFlow-LSTM",
                "version": "v1.0-DEMO",
                "is_derived_data": True,
                "note": "Station online, but lacks the minimum 7-day rolling telemetry window required for inference."
            }
        },
        {
            "station_id": "99999999",
            "station_name": "Fake_Test_Station",
            "prediction_timestamp": datetime.now(timezone.utc).isoformat(),
            "target_metric": "Streamflow",
            "predicted_value": None,
            "confidence_interval": None,
            "confidence_score": None,
            "anomaly_flag": None,
            "ui_state": "AI_UNAVAILABLE",
            "model_metadata": {
                "model_name": "WaterFlow-LSTM",
                "version": "v1.0-DEMO",
                "is_derived_data": True,
                "note": "Microservice timeout: AI prediction service failed to respond."
            }
        }
    ]

    current_script_dir = Path(__file__).parent
    output_dir = current_script_dir.parent / "Output_Data"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    output_path = output_dir / "AI_FALLBACK_FIXTURES.json"
    
    with open(output_path, "w") as f:
        json.dump(ai_fixtures, f, indent=4)
        
    print(f"AI Fallback Fixtures successfully generated at: {output_path}")

if __name__ == "__main__":
    generate_ai_fallback_fixtures()