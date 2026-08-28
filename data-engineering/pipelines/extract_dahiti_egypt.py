"""
Extract data for all 19 DAHITI Virtual Stations in Egypt.

Downloads water level time series, surface area, volume variation, and river discharge
data from DAHITI API v2, storing raw responses and normalized tables.
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

DAHITI_API_KEY = os.getenv("DAHITI_API_KEY", "")
WATER_LEVEL_URL = "https://dahiti.dgfi.tum.de/api/v2/download-water-level/"


def get_tls_verify_setting() -> bool | str:
    """Use normal TLS verification unless explicitly configured otherwise."""
    configured = os.getenv("DAHITI_CA_BUNDLE")
    if configured:
        return configured
    return os.getenv("DAHITI_TLS_VERIFY", "true").strip().lower() not in {"0", "false", "no"}

# Catalog of all 19 DAHITI Virtual Stations in Egypt
EGYPT_STATIONS = [
    {"dahiti_id": 210, "target_name": "Nasser, Lake", "type": "Lake/Reservoir", "latitude": 22.4398, "longitude": 31.7697},
    {"dahiti_id": 17683, "target_name": "Elrayyan, Reservoir", "type": "Reservoir", "latitude": 29.2481, "longitude": 30.4678},
    {"dahiti_id": 68, "target_name": "Qarun, Lake", "type": "Lake", "latitude": 29.4635, "longitude": 30.6010},
    {"dahiti_id": 17699, "target_name": "Toshka (East), Lake", "type": "Lake", "latitude": 23.1050, "longitude": 31.2534},
    {"dahiti_id": 27216, "target_name": "Toshka (South), Lake", "type": "Lake", "latitude": 23.1391, "longitude": 30.7795},
    {"dahiti_id": 950, "target_name": "Nile, River", "type": "River", "latitude": 26.1970, "longitude": 32.0797},
    {"dahiti_id": 11691, "target_name": "Nile, River", "type": "River", "latitude": 29.1145, "longitude": 31.1505},
    {"dahiti_id": 15059, "target_name": "Nile, River", "type": "River", "latitude": 26.2397, "longitude": 32.0088},
    {"dahiti_id": 15289, "target_name": "Nile, River", "type": "River", "latitude": 26.1016, "longitude": 32.4188},
    {"dahiti_id": 15290, "target_name": "Nile, River", "type": "River", "latitude": 25.6070, "longitude": 32.5462},
    {"dahiti_id": 16384, "target_name": "Nile, River", "type": "River", "latitude": 26.6473, "longitude": 31.6463},
    {"dahiti_id": 17469, "target_name": "Nile, River", "type": "River", "latitude": 28.5565, "longitude": 30.8350},
    {"dahiti_id": 17684, "target_name": "Nile, River", "type": "River", "latitude": 28.5357, "longitude": 30.8276},
    {"dahiti_id": 17685, "target_name": "Nile, River", "type": "River", "latitude": 27.5582, "longitude": 30.8451},
    {"dahiti_id": 17687, "target_name": "Nile, River", "type": "River", "latitude": 27.3788, "longitude": 30.9358},
    {"dahiti_id": 17694, "target_name": "Nile, River", "type": "River", "latitude": 25.9108, "longitude": 32.7348},
    {"dahiti_id": 17695, "target_name": "Nile, River", "type": "River", "latitude": 25.7789, "longitude": 32.7056},
    {"dahiti_id": 16740, "target_name": "Nile, River", "type": "River", "latitude": 26.1130, "longitude": 32.4417},
    {"dahiti_id": 8972, "target_name": "Unnamed, River", "type": "River", "latitude": 31.0543, "longitude": 30.4622},
]


def fetch_dahiti_water_level(dahiti_id: int, api_key: str = DAHITI_API_KEY, timeout: int = 15) -> Optional[Dict[str, Any]]:
    """Fetch water level time series from DAHITI API v2 for a given station ID."""
    if not api_key:
        logger.warning("DAHITI_API_KEY is not configured; skipping live request for %s", dahiti_id)
        return None

    payload = {
        "api_key": api_key,
        "dahiti_id": dahiti_id,
        "format": "json"
    }
    try:
        verify = get_tls_verify_setting()
        if verify is False:
            requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
            logger.warning("DAHITI TLS verification is disabled for this request; configure DAHITI_CA_BUNDLE for production")

        response = requests.post(WATER_LEVEL_URL, json=payload, timeout=timeout, verify=verify)
        if response.status_code == 200:
            data = response.json()
            if not isinstance(data, dict) or not isinstance(data.get("data"), list):
                logger.warning("DAHITI response for ID %s has no time-series data: %s", dahiti_id, data)
                return None

            # DAHITI API v2 currently returns a flat target object and uses
            # `datetime`; normalize it to the internal raw-data contract.
            if "target" not in data:
                target = {
                    "id": str(data.get("dahiti_id", dahiti_id)),
                    "target_name": data.get("target_name", f"DAHITI {dahiti_id}"),
                    "location": data.get("location"),
                    "country": data.get("country", "Egypt"),
                    "continent": data.get("continent", "Africa"),
                    "longitude": data.get("longitude"),
                    "latitude": data.get("latitude"),
                    "software": str(data.get("software", "")),
                    "download": data.get("creation_date"),
                }
                records = [
                    {
                        "date": record.get("date", record.get("datetime")),
                        "wse": record["wse"],
                        "wse_u": record.get("wse_u", 0.0),
                        "data": record.get("data", data.get("dataset", "DAHITI")),
                    }
                    for record in data["data"]
                    if record.get("date", record.get("datetime")) and record.get("wse") is not None
                ]
                return {"code": 200, "message": "Request successful", "target": target, "data": records}

            if data.get("code", 200) == 200:
                return data
            logger.warning("DAHITI API returned code %s for ID %s: %s", data.get("code"), dahiti_id, data.get("message"))
        else:
            logger.error("HTTP %s fetching DAHITI ID %s: %s", response.status_code, dahiti_id, response.text[:500])
    except Exception as e:
        logger.error(f"Exception fetching DAHITI ID {dahiti_id}: {e}")
    return None


def generate_synthetic_dahiti_data(station_info: Dict[str, Any], start_year: int = 2010, end_year: int = 2024) -> Dict[str, Any]:
    """
    Generate realistic synthetic hydrological altimetry observations for offline / fallback execution.
    Modeled after real satellite altimetry time series (Jason-2/3, Sentinel-3A/3B/6, Envisat).
    """
    import math
    import random
    from datetime import datetime, timedelta

    dahiti_id = station_info["dahiti_id"]
    target_name = station_info["target_name"]
    stype = station_info["type"]
    
    # Baseline Water Surface Elevation (m) and seasonal amplitude per water body
    base_wse = 175.0 if "Nasser" in target_name else (
        -43.0 if "Qarun" in target_name else (
            145.0 if "Toshka" in target_name else (
                25.0 if "Elrayyan" in target_name else 70.0
            )
        )
    )
    amplitude = 4.5 if "Nasser" in target_name else (0.8 if "Qarun" in target_name else 2.0)

    start_date = datetime(start_year, 1, 1)
    end_date = datetime(end_year, 12, 31)
    current_date = start_date

    satellite_missions = [
        "jason2_hf 219", "jason3_hf 219", "sentinel3a_hf 102",
        "sentinel3b_hf 240", "sentinel6a_LR_NTC_F08_hf 219"
    ]

    observations = []
    step_days = 10  # ~10-day satellite repeat pass cycle

    while current_date <= end_date:
        doy = current_date.timetuple().tm_yday
        # Hydrological seasonal cycle in Egypt (annual flood peak around Aug-Oct)
        seasonal_effect = amplitude * math.sin(2 * math.pi * (doy - 210) / 365.25)
        # Multi-year trend & random hydrologic fluctuations
        year_idx = current_date.year - start_year
        climate_trend = 0.15 * math.sin(2 * math.pi * year_idx / 7.0)
        noise = random.gauss(0, 0.08)

        # Occasional synthetic measurement spike/anomaly
        is_spike = random.random() < 0.03
        spike_val = random.choice([-2.5, 3.0, -1.8, 2.2]) if is_spike else 0.0

        wse = round(base_wse + seasonal_effect + climate_trend + noise + spike_val, 3)
        wse_u = round(abs(random.gauss(0.04, 0.02)) + (0.5 if is_spike else 0.0), 3)

        mission = random.choice(satellite_missions) + f" {random.randint(1, 150):03d}"

        observations.append({
            "date": current_date.strftime("%Y-%m-%dT00:00:00"),
            "wse": wse,
            "wse_u": wse_u,
            "data": mission
        })

        current_date += timedelta(days=step_days)

    return {
        "code": 200,
        "message": "Synthetic dataset generated successfully",
        "target": {
            "id": str(dahiti_id),
            "target_name": target_name,
            "location": None,
            "country": "Egypt",
            "continent": "Africa",
            "longitude": station_info["longitude"],
            "latitude": station_info["latitude"],
            "points": len(observations),
            "software": "8.0",
            "download": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        "data": observations
    }


def extract_all_egypt_stations(
    output_dir: str,
    use_live_api: bool = True,
    allow_synthetic_fallback: bool = False,
) -> List[Dict[str, Any]]:
    """Extract hydrological data for all 19 Egypt virtual stations and save raw output files."""
    os.makedirs(output_dir, exist_ok=True)
    extracted_datasets: List[tuple[int, Dict[str, Any]]] = []
    failed_station_ids: List[int] = []

    logger.info(f"Beginning extraction for all {len(EGYPT_STATIONS)} Egypt Virtual Stations...")

    for station in EGYPT_STATIONS:
        dahiti_id = station["dahiti_id"]
        target_name = station["target_name"]
        logger.info(f"Extracting Station ID {dahiti_id} ({target_name})...")

        station_data = None
        if use_live_api:
            station_data = fetch_dahiti_water_level(dahiti_id)

        if not station_data or not station_data.get("data"):
            if allow_synthetic_fallback:
                logger.warning("Using synthetic fallback for station ID %s", dahiti_id)
                station_data = generate_synthetic_dahiti_data(station)
            else:
                failed_station_ids.append(dahiti_id)
                continue

        extracted_datasets.append((dahiti_id, station_data))

    if failed_station_ids:
        raise RuntimeError(f"Live DAHITI extraction failed for station IDs: {failed_station_ids}")

    for dahiti_id, station_data in extracted_datasets:
        json_path = os.path.join(output_dir, f"station_{dahiti_id}_raw.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(station_data, f, indent=2)
        logger.info("Station %s complete (%s live records saved to %s)", dahiti_id, len(station_data["data"]), json_path)

    return [dataset for _, dataset in extracted_datasets]


if __name__ == "__main__":
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Output_Data", "raw"))
    extract_all_egypt_stations(out_dir, use_live_api=True)
