import os
import csv
from build_all_stations_full_datasets import generate_full_all_stations_datasets

def export_all():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    out_dir1 = os.path.join(base_dir, "Output_Data", "processed")
    out_dir2 = os.path.join(base_dir, "data", "processed")

    os.makedirs(out_dir1, exist_ok=True)
    os.makedirs(out_dir2, exist_ok=True)

    anom_headers, anom_rows, wl_headers, wl_rows = generate_full_all_stations_datasets()

    # 1. Export Anomaly Dataset (9,500 rows across 19 stations)
    for target_dir in [out_dir1, out_dir2]:
        anom_path = os.path.join(target_dir, "dahiti_egypt_anomaly_dataset.csv")
        with open(anom_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(anom_headers)
            writer.writerows(anom_rows)
        print(f"Exported Anomaly Dataset -> {anom_path} ({len(anom_rows)} rows)")

    # 2. Export Water Level Dataset (9,500 rows across 19 stations)
    for target_dir in [out_dir1, out_dir2]:
        wl_path = os.path.join(target_dir, "dahiti_egypt_water_level_dataset.csv")
        with open(wl_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(wl_headers)
            writer.writerows(wl_rows)
        print(f"Exported Water Level Dataset -> {wl_path} ({len(wl_rows)} rows)")

if __name__ == "__main__":
    export_all()
