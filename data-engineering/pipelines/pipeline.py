import extract_functions
import transform_functions
import exporting_functions
from pathlib import Path

STATION_IDS = [
    "09504500",
    "09380000", 
    "01646500", 
    "14105700", 
    "07010000"
]
START_DATE = "2026-01-01"
END_DATE = "2026-08-21"
current_script_dir = Path(__file__).parent
RAW_RUL_FILE = current_script_dir.parent / "CSVs" / "raw_rul_hrs.csv"

def run_pipeline():
    for STATION_ID in STATION_IDS:
        print(f"Starting pipeline for Station {STATION_ID}...")
        
        raw_telemetry, station_name = extract_functions.extract_telemetry_readings(
            STATION_ID, START_DATE, END_DATE
        )
        
        cleaned_dict = transform_functions.transform_telemtry_readings(raw_telemetry)
        
        final_df = exporting_functions.export_station_readings(station_name, cleaned_dict)
        print(f"Pipeline complete! Check the CSVs folder for deliverables.")

def run_rul_pipeline():
    print("Starting Pump RUL Pipeline...")
    
    raw_df = extract_functions.extract_pump_rul_data(RAW_RUL_FILE)
    
    hourly_df = transform_functions.transform_pump_rul_data(raw_df)
    
    final_df = exporting_functions.export_pump_rul_data(hourly_df)
    
    print("Pump RUL Pipeline complete! Check the CSVs folder.")

if __name__ == "__main__":
    run_pipeline()