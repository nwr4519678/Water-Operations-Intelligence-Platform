import os
import json
import math
import random

# All 19 DAHITI Virtual Stations in Egypt
EGYPT_STATIONS = [
    {"dahiti_id": 210, "target_name": "Nasser, Lake", "type": "Lake/Reservoir", "latitude": 22.4398, "longitude": 31.7697, "base_wse": 175.0, "amp": 4.5},
    {"dahiti_id": 17683, "target_name": "Elrayyan, Reservoir", "type": "Reservoir", "latitude": 29.2481, "longitude": 30.4678, "base_wse": 25.0, "amp": 1.2},
    {"dahiti_id": 68, "target_name": "Qarun, Lake", "type": "Lake", "latitude": 29.4635, "longitude": 30.6010, "base_wse": -43.0, "amp": 0.8},
    {"dahiti_id": 17699, "target_name": "Toshka (East), Lake", "type": "Lake", "latitude": 23.1050, "longitude": 31.2534, "base_wse": 145.0, "amp": 2.0},
    {"dahiti_id": 27216, "target_name": "Toshka (South), Lake", "type": "Lake", "latitude": 23.1391, "longitude": 30.7795, "base_wse": 146.2, "amp": 1.8},
    {"dahiti_id": 950, "target_name": "Nile, River", "type": "River", "latitude": 26.1970, "longitude": 32.0797, "base_wse": 70.0, "amp": 2.2},
    {"dahiti_id": 11691, "target_name": "Nile, River", "type": "River", "latitude": 29.1145, "longitude": 31.1505, "base_wse": 28.5, "amp": 1.5},
    {"dahiti_id": 15059, "target_name": "Nile, River", "type": "River", "latitude": 26.2397, "longitude": 32.0088, "base_wse": 69.5, "amp": 2.1},
    {"dahiti_id": 15289, "target_name": "Nile, River", "type": "River", "latitude": 26.1016, "longitude": 32.4188, "base_wse": 71.0, "amp": 2.3},
    {"dahiti_id": 15290, "target_name": "Nile, River", "type": "River", "latitude": 25.6070, "longitude": 32.5462, "base_wse": 73.2, "amp": 2.4},
    {"dahiti_id": 16384, "target_name": "Nile, River", "type": "River", "latitude": 26.6473, "longitude": 31.6463, "base_wse": 65.4, "amp": 2.0},
    {"dahiti_id": 17469, "target_name": "Nile, River", "type": "River", "latitude": 28.5565, "longitude": 30.8350, "base_wse": 38.1, "amp": 1.7},
    {"dahiti_id": 17684, "target_name": "Nile, River", "type": "River", "latitude": 28.5357, "longitude": 30.8276, "base_wse": 38.4, "amp": 1.7},
    {"dahiti_id": 17685, "target_name": "Nile, River", "type": "River", "latitude": 27.5582, "longitude": 30.8451, "base_wse": 52.0, "amp": 1.9},
    {"dahiti_id": 17687, "target_name": "Nile, River", "type": "River", "latitude": 27.3788, "longitude": 30.9358, "base_wse": 54.3, "amp": 1.9},
    {"dahiti_id": 17694, "target_name": "Nile, River", "type": "River", "latitude": 25.9108, "longitude": 32.7348, "base_wse": 72.1, "amp": 2.2},
    {"dahiti_id": 17695, "target_name": "Nile, River", "type": "River", "latitude": 25.7789, "longitude": 32.7056, "base_wse": 72.5, "amp": 2.3},
    {"dahiti_id": 16740, "target_name": "Nile, River", "type": "River", "latitude": 26.1130, "longitude": 32.4417, "base_wse": 70.8, "amp": 2.2},
    {"dahiti_id": 8972, "target_name": "Unnamed, River", "type": "River", "latitude": 31.0543, "longitude": 30.4622, "base_wse": 12.4, "amp": 1.1},
]

def generate_full_all_stations_datasets():
    random.seed(42)
    
    # 1. Generate Anomaly Dataset across all 19 stations
    anom_rows = []
    anom_headers = [
        "dahiti_id", "target_name", "water_body_type", "latitude", "longitude",
        "timestamp", "wse", "wse_u", "satellite_mission",
        "rolling_mean_7d", "rolling_std_7d", "rolling_zscore_7d",
        "rolling_mean_30d", "rolling_std_30d", "rolling_zscore_30d",
        "dwse_dt", "seasonal_climatology_median", "seasonal_anomaly",
        "uncertainty_ratio", "iqr_outlier_flag", "is_anomaly", "anomaly_category"
    ]
    
    # 2. Generate Water Level Forecasting Dataset across all 19 stations
    wl_rows = []
    wl_headers = [
        "dahiti_id", "target_name", "water_body_type", "latitude", "longitude",
        "timestamp", "wse", "wse_lag1", "wse_lag3", "wse_lag7", "wse_lag14",
        "wse_lag30", "upstream_wse", "wse_mean_30d", "sin_month", "cos_month", "day_of_year",
        "target_wse_1d", "target_wse_7d", "target_wse_14d", "target_wse_30d", "water_level_state"
    ]

    satellites = ["jason2_hf 219", "jason3_hf 219", "sentinel3a_hf 102", "sentinel3b_hf 240", "sentinel6a_LR_NTC_F08_hf 219"]

    for station in EGYPT_STATIONS:
        d_id = station["dahiti_id"]
        t_name = station["target_name"]
        wb_type = station["type"]
        lat = station["latitude"]
        lon = station["longitude"]
        base_wse = station["base_wse"]
        amp = station["amp"]

        # Generate 500 time-series points per station (~2010 to 2024 at 10-day intervals)
        for i in range(500):
            day_offset = i * 10
            year = 2010 + (day_offset // 365)
            doy = (day_offset % 365) + 1
            month = max(1, min(12, int(doy / 30.5) + 1))

            ts_str = f"{year}-{month:02d}-{(doy % 28) + 1:02d}T00:00:00Z"
            
            seasonal = amp * math.sin(2 * math.pi * (doy - 210) / 365.25)
            noise = random.gauss(0, 0.08)
            is_anomaly_sample = random.random() < 0.04
            spike = random.choice([-2.8, 3.2, -1.9, 2.5]) if is_anomaly_sample else 0.0

            wse = round(base_wse + seasonal + noise + spike, 3)
            wse_u = round(abs(random.gauss(0.04, 0.02)) + (0.5 if is_anomaly_sample else 0.0), 3)

            z7 = round(spike / 0.15 if is_anomaly_sample else random.gauss(0, 0.4), 3)
            z30 = round(spike / 0.25 if is_anomaly_sample else random.gauss(0, 0.5), 3)
            dwse_dt = round(spike / 10.0 if is_anomaly_sample else random.gauss(0, 0.02), 4)

            unc_ratio = round(wse_u / 0.1, 3)
            iqr_flag = 1 if is_anomaly_sample else 0
            is_anom = 1 if is_anomaly_sample else 0

            if is_anom == 0:
                cat = "normal"
            elif wse_u > 0.45:
                cat = "sensor_noise"
            elif dwse_dt > 0.15:
                cat = "flash_spike"
            elif dwse_dt < -0.15:
                cat = "rapid_drop"
            else:
                cat = "outlier_spike"

            mission = random.choice(satellites)

            anom_rows.append([
                d_id, t_name, wb_type, lat, lon, ts_str, wse, wse_u, mission,
                round(wse - 0.05, 3), 0.12, z7, round(wse - 0.10, 3), 0.22, z30,
                dwse_dt, round(base_wse, 3), round(seasonal, 3), unc_ratio, iqr_flag, is_anom, cat
            ])

            # Lags for forecasting
            wse_lag1 = round(wse - 0.02, 3)
            wse_lag3 = round(wse - 0.06, 3)
            wse_lag7 = round(wse - 0.12, 3)
            wse_lag14 = round(wse - 0.22, 3)
            wse_lag30 = round(wse - 0.40, 3)
            upstream = round(wse + 0.15, 3)
            wse_mean30 = round(base_wse, 3)

            sin_m = round(math.sin(2 * math.pi * month / 12.0), 4)
            cos_m = round(math.cos(2 * math.pi * month / 12.0), 4)

            t1d = round(wse + 0.01, 3)
            t7d = round(wse + 0.08, 3)
            t14d = round(wse + 0.14, 3)
            t30d = round(wse + 0.22, 3)

            # Keep generated labels identical to the production model policy.
            # Station-specific operational limits can be added later from
            # verified station profiles; they must not be hard-coded here.
            if wse < 20.0:
                state = "Low_Water"
            elif wse > 180.5:
                state = "Critical_Flood"
            elif wse > 179.5:
                state = "High_Water"
            else:
                state = "Normal"

            wl_rows.append([
                d_id, t_name, wb_type, lat, lon, ts_str, wse, wse_lag1, wse_lag3,
                wse_lag7, wse_lag14, wse_lag30, upstream, wse_mean30, sin_m, cos_m, doy,
                t1d, t7d, t14d, t30d, state
            ])

    return anom_headers, anom_rows, wl_headers, wl_rows

if __name__ == "__main__":
    generate_full_all_stations_datasets()
