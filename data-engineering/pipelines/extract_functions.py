import requests
import json
from pathlib import Path
import pandas as pd

def extract_telemetry_readings(site_id: str, start_dt: str, end_dt: str):
    url = (
        f"https://waterservices.usgs.gov/nwis/iv/?format=json&sites={site_id}"
        f"&startDT={start_dt}&endDT={end_dt}&parameterCd=00065,00060,00010,00045,70969"
    )
    
    response = requests.get(url)
    response.raise_for_status()
    raw_data = response.json()
    
    try:
        station_name = raw_data["value"]["timeSeries"][0]["sourceInfo"]["siteName"]
    except (KeyError, IndexError):
        station_name = f"Unknown_Station_{site_id}"

    data_year = start_dt.split("-")[0]

    output_dir = Path(__file__).parent.parent / "Output_Data"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = output_dir / f"RAW_{site_id}_{data_year}_payload.json"
    
    with open(file_path, "w") as f:
        json.dump(raw_data, f, indent=4)
        
    print(f"Raw payload saved to: {file_path}")
    return raw_data, station_name

def extract_pump_rul_data(file_path: str):
    print(f"Loading raw RUL dataset from {file_path}...")
    df = pd.read_csv(file_path)

    df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
    print("Dropped unnamed index column.")
    
    return df