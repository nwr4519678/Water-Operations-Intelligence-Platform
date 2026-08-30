"""Build the water-level training table from original DAHITI observations.

No resampling, averaging, or interpolation is performed here. Lag and target
columns are values from other original observations of the same station. The
suffix ``_obs`` is intentional: DAHITI timestamps are irregular, so these are
observation horizons, not fabricated day-based horizons.
"""
import os
import pandas as pd


def build_training_dataset(source_csv: str, output_csv: str, output_parquet: str | None = None) -> pd.DataFrame:
    df = pd.read_csv(source_csv, parse_dates=["observed_at"])
    df = df.sort_values(["dahiti_id", "observed_at"]).reset_index(drop=True)
    grouped = df.groupby("dahiti_id", sort=False)

    for offset in (1, 3, 7, 14, 30):
        df[f"wse_lag_{offset}_obs"] = grouped["wse"].shift(offset)
        df[f"target_observed_at_{offset}_obs"] = grouped["observed_at"].shift(-offset)
    for offset in (1, 3, 7, 14, 30):
        df[f"target_wse_next_{offset}_obs"] = grouped["wse"].shift(-offset)

    # Compatibility names consumed by the current AI service. Their meaning
    # is explicitly observation-based, not daily, because source timestamps
    # are irregular.
    for offset in (1, 3, 7, 14, 30):
        df[f"wse_lag{offset}"] = df[f"wse_lag_{offset}_obs"]
        df[f"target_wse_{offset}d"] = df[f"target_wse_next_{offset}_obs"]
    df["target_observed_at"] = df["target_observed_at_7_obs"]
    df["horizon_days"] = (
        pd.to_datetime(df["target_observed_at"], utc=True) -
        pd.to_datetime(df["observed_at"], utc=True)
    ).dt.total_seconds() / 86400.0

    df["month_number"] = df["observed_at"].dt.month
    df["sin_month"] = (2 * 3.141592653589793 * df["month_number"] / 12).map(__import__("math").sin)
    df["cos_month"] = (2 * 3.141592653589793 * df["month_number"] / 12).map(__import__("math").cos)
    df["water_level_state"] = df["wse"].map(
        lambda value: "Low_Water" if value < 20.0 else
        "Critical_Flood" if value > 180.5 else
        "High_Water" if value > 179.5 else "Normal"
    )
    df["day_of_year"] = df["observed_at"].dt.dayofyear
    df["quarter"] = df["observed_at"].dt.quarter
    df["upstream_wse"] = pd.NA

    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    df.to_csv(output_csv, index=False, date_format="%Y-%m-%dT%H:%M:%SZ")
    if output_parquet:
        df.to_parquet(output_parquet, index=False)
    return df


if __name__ == "__main__":
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    source = os.path.join(root, "Output_Data", "processed", "dahiti_egypt_water_level_monthly_dataset.csv")
    out = os.path.join(root, "Output_Data", "processed", "dahiti_egypt_water_level_training_dataset.csv")
    build_training_dataset(source, out, out.replace(".csv", ".parquet"))
