"""
Master Orchestrator Script for DAHITI Egypt Ingestion & ML Dataset Generation.

Executes end-to-end data pipeline:
1. Ingests raw data for all 19 DAHITI Virtual Stations in Egypt.
2. Builds Dataset 1: Anomaly Detection Dataset.
3. Builds Dataset 2: Water Level Forecasting & Operational Detection Dataset.
"""

import os
import shutil
import logging
from extract_dahiti_egypt import extract_all_egypt_stations
from build_anomaly_dataset import build_full_anomaly_dataset
from build_water_level_dataset import build_full_water_level_dataset

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def run_pipeline():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    raw_dir = os.path.join(base_dir, "Output_Data", "raw")
    output_dir = os.path.join(base_dir, "Output_Data", "processed")
    data_proc_dir = os.path.join(base_dir, "data", "processed")

    logger.info("=== STEP 1: Ingesting Raw DAHITI Data for 19 Stations in Egypt ===")
    extract_all_egypt_stations(raw_dir, use_live_api=True)

    logger.info("=== STEP 2: Building Dataset 1 (Anomaly Detection) ===")
    anomaly_csv = os.path.join(output_dir, "dahiti_egypt_anomaly_dataset.csv")
    anomaly_parquet = os.path.join(output_dir, "dahiti_egypt_anomaly_dataset.parquet")
    df_anomaly = build_full_anomaly_dataset(raw_dir, anomaly_csv, anomaly_parquet)

    logger.info("=== STEP 3: Building Dataset 2 (Water Level Forecasting & Detection) ===")
    wl_csv = os.path.join(output_dir, "dahiti_egypt_water_level_dataset.csv")
    wl_parquet = os.path.join(output_dir, "dahiti_egypt_water_level_dataset.parquet")
    df_wl = build_full_water_level_dataset(raw_dir, wl_csv, wl_parquet)

    logger.info("=== STEP 4: Syncing Datasets to data/processed ===")
    os.makedirs(data_proc_dir, exist_ok=True)
    if os.path.exists(anomaly_csv):
        shutil.copy(anomaly_csv, os.path.join(data_proc_dir, "dahiti_egypt_anomaly_dataset.csv"))
    if os.path.exists(wl_csv):
        shutil.copy(wl_csv, os.path.join(data_proc_dir, "dahiti_egypt_water_level_dataset.csv"))

    logger.info("=== DAHITI PIPELINE EXECUTION COMPLETE ===")
    logger.info(f"Anomaly Dataset: {len(df_anomaly)} rows generated.")
    logger.info(f"Water Level Dataset: {len(df_wl)} rows generated.")


if __name__ == "__main__":
    run_pipeline()
