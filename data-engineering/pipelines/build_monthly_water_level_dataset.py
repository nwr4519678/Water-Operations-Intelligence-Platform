"""Export original DAHITI observations with a monthly partition column.

This deliberately does not average, interpolate, resample, or drop readings.
Each output row maps to one source observation from DAHITI.
"""
import json
import os
from typing import Any
import pandas as pd


def build_monthly_dataset(raw_dir: str, output_csv: str, output_parquet: str | None = None) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for name in sorted(os.listdir(raw_dir)):
        if not name.endswith("_raw.json"):
            continue
        with open(os.path.join(raw_dir, name), encoding="utf-8") as stream:
            payload = json.load(stream)
        target = payload.get("target", {})
        station_id = int(target.get("id", payload.get("dahiti_id")))
        for record in payload.get("data", []):
            observed_at = pd.to_datetime(record.get("date"), utc=True)
            if pd.isna(observed_at) or record.get("wse") is None:
                continue
            rows.append({
                "dahiti_id": station_id,
                "target_name": target.get("target_name", payload.get("target_name", "Unknown")),
                "latitude": target.get("latitude", payload.get("latitude")),
                "longitude": target.get("longitude", payload.get("longitude")),
                "observed_at": observed_at,
                "month": observed_at.strftime("%Y-%m"),
                "wse": float(record["wse"]),
                "wse_u": float(record.get("wse_u", 0.0)),
                "source_record": record.get("data", "DAHITI"),
                "source": "DAHITI",
            })
    result = pd.DataFrame(rows).sort_values(["dahiti_id", "observed_at"]).reset_index(drop=True)
    if result.empty:
        raise RuntimeError("No DAHITI observations found")
    result["month_observation_count"] = result.groupby(["dahiti_id", "month"])["wse"].transform("size")
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    result.to_csv(output_csv, index=False, date_format="%Y-%m-%dT%H:%M:%SZ")
    if output_parquet:
        result.to_parquet(output_parquet, index=False)
    return result


if __name__ == "__main__":
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    build_monthly_dataset(
        os.path.join(root, "Output_Data", "raw"),
        os.path.join(root, "Output_Data", "processed", "dahiti_egypt_water_level_monthly_dataset.csv"),
        os.path.join(root, "Output_Data", "processed", "dahiti_egypt_water_level_monthly_dataset.parquet"),
    )
