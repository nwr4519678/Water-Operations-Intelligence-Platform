"""
Build Dataset 2: Water Level Forecasting & Operational State Detection Dataset.

Resamples irregular DAHITI altimetry time series onto regular daily time steps,
calculates cyclical temporal embeddings, multi-step historical lags, spatial Nile connectivity,
and multi-horizon forward target horizons for water level prediction and state classification.
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


def regularize_and_feature_engineer_station(station_json: Dict[str, Any], nasser_df: pd.DataFrame = None) -> pd.DataFrame:
    """Resample irregular satellite altimetry data onto a uniform daily time grid and compute forecasting features."""
    target_info = station_json.get("target", {})
    dahiti_id = int(target_info.get("id", 0))
    target_name = target_info.get("target_name", "Unknown")
    lat = float(target_info.get("latitude", 0.0))
    lon = float(target_info.get("longitude", 0.0))

    if "Nasser" in target_name or "Lake" in target_name:
        water_type = "Lake"
    elif "Reservoir" in target_name:
        water_type = "Reservoir"
    else:
        water_type = "River"

    records = station_json.get("data", [])
    if not records:
        return pd.DataFrame()

    df_raw = pd.DataFrame(records)
    # DAHITI timestamps include satellite pass time-of-day, while the
    # forecasting series is daily. Normalize to UTC day before merging so
    # original measurements are retained instead of being falsely marked as
    # interpolated because their clock time differs from the daily index.
    df_raw["timestamp"] = pd.to_datetime(df_raw["date"], utc=True).dt.floor("D")
    df_raw["wse"] = df_raw["wse"].astype(float)
    df_raw = (
        df_raw.groupby("timestamp", as_index=False)["wse"]
        .mean()
        .sort_values("timestamp")
        .reset_index(drop=True)
    )

    # Create uniform daily timeline from min to max date
    min_date = df_raw["timestamp"].min()
    max_date = df_raw["timestamp"].max()
    daily_index = pd.date_range(start=min_date, end=max_date, freq="D", name="timestamp")

    df_grid = pd.DataFrame(index=daily_index).reset_index()
    df_grid = pd.merge(df_grid, df_raw[["timestamp", "wse"]], on="timestamp", how="left")

    # Mark true satellite observations vs interpolated values
    df_grid["is_interpolated"] = df_grid["wse"].isna().astype(int)

    # Linear / Pchip interpolation with limit for smooth hydrological continuum
    df_grid["wse"] = df_grid["wse"].interpolate(method="linear", limit_direction="both").round(3)

    df_grid["dahiti_id"] = dahiti_id
    df_grid["target_name"] = target_name
    df_grid["water_body_type"] = water_type
    df_grid["latitude"] = lat
    df_grid["longitude"] = lon

    # 1. Temporal calendar & cyclical time embeddings
    df_grid["day_of_year"] = df_grid["timestamp"].dt.dayofyear
    df_grid["month"] = df_grid["timestamp"].dt.month
    df_grid["quarter"] = df_grid["timestamp"].dt.quarter
    df_grid["sin_month"] = np.sin(2 * np.pi * df_grid["month"] / 12.0).round(4)
    df_grid["cos_month"] = np.cos(2 * np.pi * df_grid["month"] / 12.0).round(4)

    # 2. Historical Lags (t-1, t-3, t-7, t-14, t-30 days)
    df_grid["wse_lag1"] = df_grid["wse"].shift(1).round(3)
    df_grid["wse_lag3"] = df_grid["wse"].shift(3).round(3)
    df_grid["wse_lag7"] = df_grid["wse"].shift(7).round(3)
    df_grid["wse_lag14"] = df_grid["wse"].shift(14).round(3)
    df_grid["wse_lag30"] = df_grid["wse"].shift(30).round(3)

    # 3. Rolling window stats (30-day window)
    df_grid["wse_max_30d"] = df_grid["wse"].rolling(window=30, min_periods=1).max().round(3)
    df_grid["wse_min_30d"] = df_grid["wse"].rolling(window=30, min_periods=1).min().round(3)
    df_grid["wse_mean_30d"] = df_grid["wse"].rolling(window=30, min_periods=1).mean().round(3)

    # 4. Spatial connection feature: Upstream Lake Nasser WSE (if available and station is downstream River Nile)
    if nasser_df is not None and not nasser_df.empty and dahiti_id != 210:
        df_grid = pd.merge(df_grid, nasser_df[["timestamp", "wse"]].rename(columns={"wse": "upstream_wse"}), on="timestamp", how="left")
        df_grid["upstream_wse"] = df_grid["upstream_wse"].interpolate(method="linear", limit_direction="both").round(3)
    else:
        df_grid["upstream_wse"] = df_grid["wse"]

    # 5. Multi-Horizon Forward Prediction Targets (t+1, t+7, t+14, t+30)
    df_grid["target_wse_1d"] = df_grid["wse"].shift(-1).round(3)
    df_grid["target_wse_7d"] = df_grid["wse"].shift(-7).round(3)
    df_grid["target_wse_14d"] = df_grid["wse"].shift(-14).round(3)
    df_grid["target_wse_30d"] = df_grid["wse"].shift(-30).round(3)

    # 6. Operational Water Level State Classification
    q10 = df_grid["wse"].quantile(0.10)
    q90 = df_grid["wse"].quantile(0.90)
    q98 = df_grid["wse"].quantile(0.98)

    def classify_state(val):
        if val <= q10:
            return "Low_Water"
        if val >= q98:
            return "Critical_Flood"
        if val >= q90:
            return "High_Water"
        return "Normal"

    df_grid["water_level_state"] = df_grid["wse"].apply(classify_state)

    cols = [
        "dahiti_id", "target_name", "water_body_type", "latitude", "longitude",
        "timestamp", "wse", "is_interpolated",
        "day_of_year", "month", "quarter", "sin_month", "cos_month",
        "wse_lag1", "wse_lag3", "wse_lag7", "wse_lag14", "wse_lag30",
        "wse_max_30d", "wse_min_30d", "wse_mean_30d", "upstream_wse",
        "target_wse_1d", "target_wse_7d", "target_wse_14d", "target_wse_30d",
        "water_level_state"
    ]

    return df_grid[cols]


def build_full_water_level_dataset(raw_dir: str, output_file_csv: str, output_file_parquet: str = None) -> pd.DataFrame:
    """Load raw JSON outputs for all 19 stations and build Dataset 2 (Water Level Detection & Forecasting)."""
    if not os.path.exists(raw_dir):
        logger.error(f"Raw directory {raw_dir} does not exist!")
        return pd.DataFrame()

    json_files = [f for f in os.listdir(raw_dir) if f.endswith(".json")]
    
    # First locate Lake Nasser (ID 210) to serve as upstream reference
    nasser_json = None
    for fname in json_files:
        if "210" in fname:
            with open(os.path.join(raw_dir, fname), "r", encoding="utf-8") as f:
                nasser_json = json.load(f)
            break

    nasser_df = None
    if nasser_json:
        nasser_records = nasser_json.get("data", [])
        if nasser_records:
            n_df = pd.DataFrame(nasser_records)
            n_df["timestamp"] = pd.to_datetime(n_df["date"], utc=True).dt.floor("D")
            n_df["wse"] = n_df["wse"].astype(float)
            n_df = n_df.groupby("timestamp", as_index=False)["wse"].mean()
            daily_idx = pd.date_range(n_df["timestamp"].min(), n_df["timestamp"].max(), freq="D", name="timestamp")
            nasser_df = pd.DataFrame(index=daily_idx).reset_index()
            nasser_df = pd.merge(nasser_df, n_df[["timestamp", "wse"]], on="timestamp", how="left")
            nasser_df["wse"] = nasser_df["wse"].interpolate(method="linear", limit_direction="both")

    station_dfs = []
    logger.info(f"Building Water Level Forecasting Dataset from {len(json_files)} station files...")

    for fname in sorted(json_files):
        fpath = os.path.join(raw_dir, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            station_data = json.load(f)

        df_station = regularize_and_feature_engineer_station(station_data, nasser_df)
        if not df_station.empty:
            station_dfs.append(df_station)

    if not station_dfs:
        logger.warning("No station data processed for Water Level dataset!")
        return pd.DataFrame()

    composite_df = pd.concat(station_dfs, ignore_index=True)
    composite_df["timestamp"] = pd.to_datetime(composite_df["timestamp"]).dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    os.makedirs(os.path.dirname(output_file_csv), exist_ok=True)
    composite_df.to_csv(output_file_csv, index=False)
    logger.info(f"Successfully saved Water Level Dataset CSV to {output_file_csv} ({len(composite_df)} rows, {len(composite_df.columns)} columns)")

    if output_file_parquet:
        try:
            composite_df.to_parquet(output_file_parquet, index=False)
            logger.info(f"Successfully saved Water Level Dataset Parquet to {output_file_parquet}")
        except Exception as e:
            logger.warning(f"Could not save Parquet: {e}")

    return composite_df


if __name__ == "__main__":
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    raw_path = os.path.join(base_dir, "Output_Data", "raw")
    csv_path = os.path.join(base_dir, "Output_Data", "processed", "dahiti_egypt_water_level_dataset.csv")
    parquet_path = os.path.join(base_dir, "Output_Data", "processed", "dahiti_egypt_water_level_dataset.parquet")
    build_full_water_level_dataset(raw_path, csv_path, parquet_path)
