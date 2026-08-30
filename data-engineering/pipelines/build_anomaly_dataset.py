"""
Build Dataset 1: Anomaly Detection Dataset for 19 DAHITI Virtual Stations in Egypt.

Transforms raw water level time series into a high-dimensional feature set
optimized for detecting sensor noise, outlier spikes, operational anomalies,
and extreme hydrological events.
"""

import os
import json
import logging
from datetime import datetime
from typing import List, Dict, Any
import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def process_station_anomaly_features(station_json: Dict[str, Any]) -> pd.DataFrame:
    """Extract and compute anomaly detection features for a single DAHITI station JSON object."""
    target_info = station_json.get("target", {})
    dahiti_id = int(target_info.get("id", 0))
    target_name = target_info.get("target_name", "Unknown")
    lat = float(target_info.get("latitude", 0.0))
    lon = float(target_info.get("longitude", 0.0))
    
    # Infer water body type from target name
    if "Nasser" in target_name or "Lake" in target_name:
        water_type = "Lake"
    elif "Reservoir" in target_name:
        water_type = "Reservoir"
    else:
        water_type = "River"

    records = station_json.get("data", [])
    if not records:
        return pd.DataFrame()

    df = pd.DataFrame(records)
    df["timestamp"] = pd.to_datetime(df["date"])
    df = df.sort_values("timestamp").reset_index(drop=True)

    df["dahiti_id"] = dahiti_id
    df["target_name"] = target_name
    df["water_body_type"] = water_type
    df["latitude"] = lat
    df["longitude"] = lon
    df["wse"] = df["wse"].astype(float)
    df["wse_u"] = df["wse_u"].astype(float)
    df["satellite_mission"] = df["data"].astype(str)

    # 1. Rate of change (dWSE / dt in m/day)
    df["days_diff"] = df["timestamp"].diff().dt.total_seconds() / (24 * 3600)
    df["days_diff"] = df["days_diff"].replace(0, np.nan).fillna(10.0)
    df["dwse_dt"] = df["wse"].diff() / df["days_diff"]
    df["dwse_dt"] = df["dwse_dt"].fillna(0.0).round(4)

    # 2. Short-term (7-day window equivalent ~ 3 points) and medium-term (30-day window ~ 5 points) rolling statistics
    df["rolling_mean_7d"] = df["wse"].rolling(window=3, min_periods=1).mean().round(3)
    df["rolling_std_7d"] = df["wse"].rolling(window=3, min_periods=1).std().fillna(0.05).round(3)
    df["rolling_zscore_7d"] = ((df["wse"] - df["rolling_mean_7d"]) / (df["rolling_std_7d"] + 1e-6)).round(3)

    df["rolling_mean_30d"] = df["wse"].rolling(window=5, min_periods=1).mean().round(3)
    df["rolling_std_30d"] = df["wse"].rolling(window=5, min_periods=1).std().fillna(0.08).round(3)
    df["rolling_zscore_30d"] = ((df["wse"] - df["rolling_mean_30d"]) / (df["rolling_std_30d"] + 1e-6)).round(3)

    # 3. Climatological seasonal normal median
    df["month"] = df["timestamp"].dt.month
    month_medians = df.groupby("month")["wse"].transform("median")
    df["seasonal_climatology_median"] = month_medians.round(3)
    df["seasonal_anomaly"] = (df["wse"] - df["seasonal_climatology_median"]).round(3)

    # 4. Measurement uncertainty ratio
    df["uncertainty_ratio"] = (df["wse_u"] / (df["rolling_std_30d"] + 1e-6)).round(3)

    # 5. IQR Outlier detection
    q25 = df["wse"].quantile(0.25)
    q75 = df["wse"].quantile(0.75)
    iqr = q75 - q25
    lower_bound = q25 - 1.5 * iqr
    upper_bound = q75 + 1.5 * iqr
    df["iqr_outlier_flag"] = ((df["wse"] < lower_bound) | (df["wse"] > upper_bound)).astype(int)

    # 6. Composite Anomaly Ground-Truth Label & Category
    is_z_anomaly = df["rolling_zscore_7d"].abs() > 2.5
    is_step_anomaly = df["dwse_dt"].abs() > 0.35
    is_high_uncertainty = df["wse_u"] > 0.45

    df["is_anomaly"] = (is_z_anomaly | is_step_anomaly | is_high_uncertainty | (df["iqr_outlier_flag"] == 1)).astype(int)

    def classify_anomaly(row):
        if row["is_anomaly"] == 0:
            return "normal"
        if row["wse_u"] > 0.45:
            return "sensor_noise"
        if row["dwse_dt"] > 0.35:
            return "flash_spike"
        if row["dwse_dt"] < -0.35:
            return "rapid_drop"
        if row["wse"] < lower_bound:
            return "drought_drop"
        return "outlier_spike"

    df["anomaly_category"] = df.apply(classify_anomaly, axis=1)

    # Select clean column schema
    output_columns = [
        "dahiti_id", "target_name", "water_body_type", "latitude", "longitude",
        "timestamp", "wse", "wse_u", "satellite_mission",
        "rolling_mean_7d", "rolling_std_7d", "rolling_zscore_7d",
        "rolling_mean_30d", "rolling_std_30d", "rolling_zscore_30d",
        "dwse_dt", "seasonal_climatology_median", "seasonal_anomaly",
        "uncertainty_ratio", "iqr_outlier_flag", "is_anomaly", "anomaly_category"
    ]

    return df[output_columns]


def build_full_anomaly_dataset(raw_dir: str, output_file_csv: str, output_file_parquet: str = None) -> pd.DataFrame:
    """Load raw JSON outputs for all 19 stations and build the composite Anomaly Detection Dataset."""
    station_dfs = []
    
    if not os.path.exists(raw_dir):
        logger.error(f"Raw directory {raw_dir} does not exist!")
        return pd.DataFrame()

    json_files = [f for f in os.listdir(raw_dir) if f.endswith(".json")]
    logger.info(f"Building Anomaly Dataset from {len(json_files)} station files in {raw_dir}...")

    for fname in sorted(json_files):
        fpath = os.path.join(raw_dir, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            station_data = json.load(f)
        
        df_station = process_station_anomaly_features(station_data)
        if not df_station.empty:
            station_dfs.append(df_station)

    if not station_dfs:
        logger.warning("No station data processed!")
        return pd.DataFrame()

    composite_df = pd.concat(station_dfs, ignore_index=True)
    composite_df["timestamp"] = pd.to_datetime(composite_df["timestamp"]).dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    os.makedirs(os.path.dirname(output_file_csv), exist_ok=True)
    composite_df.to_csv(output_file_csv, index=False)
    logger.info(f"Successfully saved Anomaly Dataset CSV to {output_file_csv} ({len(composite_df)} rows, {len(composite_df.columns)} columns)")

    if output_file_parquet:
        try:
            composite_df.to_parquet(output_file_parquet, index=False)
            logger.info(f"Successfully saved Anomaly Dataset Parquet to {output_file_parquet}")
        except Exception as e:
            logger.warning(f"Could not save Parquet (pyarrow/fastparquet might be missing): {e}")

    return composite_df


if __name__ == "__main__":
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    raw_path = os.path.join(base_dir, "Output_Data", "raw")
    csv_path = os.path.join(base_dir, "Output_Data", "processed", "dahiti_egypt_anomaly_dataset.csv")
    parquet_path = os.path.join(base_dir, "Output_Data", "processed", "dahiti_egypt_anomaly_dataset.parquet")
    build_full_anomaly_dataset(raw_path, csv_path, parquet_path)
