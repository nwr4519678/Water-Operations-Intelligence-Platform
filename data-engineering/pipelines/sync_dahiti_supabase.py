"""Fetch the Egypt DAHITI catalog/readings and upsert them into Supabase.

Required environment variables:
  DAHITI_API_KEY   DAHITI API key
  SUPABASE_URL     https://<project>.supabase.co
  SUPABASE_SERVICE_ROLE_KEY  server-side key (never expose to the browser)

Run after infrastructure/database/supabase-dahiti.sql has been applied:
  python data-engineering/pipelines/sync_dahiti_supabase.py
"""

import json
import hashlib
import os
from datetime import datetime, timezone
from pathlib import Path

import requests

from extract_dahiti_egypt import EGYPT_STATIONS, fetch_dahiti_water_level

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")


def upsert(table: str, rows: list[dict]) -> None:
    if not rows:
        return
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        json=rows,
        timeout=60,
    )
    response.raise_for_status()


def validate_sync(rows: list[dict]) -> None:
    expected = {station["dahiti_id"] for station in EGYPT_STATIONS}
    actual = {row["dahiti_id"] for row in rows}
    if actual != expected:
        raise RuntimeError(f"Station coverage mismatch: expected {len(expected)}, got {len(actual)}")
    if len(rows) != len({row["source_hash"] for row in rows}):
        raise RuntimeError("Duplicate source hashes detected before upload")


def main() -> None:
    if not SUPABASE_URL or not SUPABASE_KEY or not os.environ.get("DAHITI_API_KEY"):
        raise SystemExit("Set DAHITI_API_KEY, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first")

    synced_at = datetime.now(timezone.utc).isoformat()
    station_rows: list[dict] = []
    reading_rows: list[dict] = []

    for station in EGYPT_STATIONS:
        station_id = station["dahiti_id"]
        payload = fetch_dahiti_water_level(station_id, os.environ["DAHITI_API_KEY"])
        target = (payload or {}).get("target", {})
        if not target and payload:
            target = payload
        records = (payload or {}).get("data", [])
        if not records:
            raise RuntimeError(f"DAHITI station {station_id} returned no observations")
        timestamps = [item["date"].replace("Z", "+00:00") for item in records]
        station_rows.append({
            "dahiti_id": station_id,
            "target_name": target.get("target_name", station["target_name"]),
            "target_type": station["type"],
            "country": target.get("country", "Egypt"),
            "continent": target.get("continent", "Africa"),
            "latitude": target.get("latitude", station["latitude"]),
            "longitude": target.get("longitude", station["longitude"]),
            "profile": {"source": "DAHITI", "dahiti_id": station_id},
            "data_access": {"water_level_altimetry": "api"},
            "source_url": f"https://dahiti.dgfi.tum.de/en/{station_id}/",
            "last_synced_at": synced_at,
            "observation_count": len(records),
            "first_observed_at": min(timestamps),
            "last_observed_at": max(timestamps),
            "updated_at": synced_at,
        })
        for item in records:
            observed_at = item["date"].replace("Z", "+00:00")
            source_record = item.get("data")
            source_hash = hashlib.sha256(
                f"{station_id}|{observed_at}|{item['wse']}|{item.get('wse_u')}|{source_record}".encode()
            ).hexdigest()
            reading_rows.append({
                "dahiti_id": station_id,
                "observed_at": observed_at,
                "wse": item["wse"],
                "uncertainty": item.get("wse_u"),
                "source_record": source_record,
                "source_hash": source_hash,
                "raw": item,
            })

    validate_sync(reading_rows)
    upsert("dahiti_stations", station_rows)
    # REST upserts are batched to avoid request-size limits.
    for start in range(0, len(reading_rows), 500):
        upsert("dahiti_water_levels", reading_rows[start:start + 500])
    print(json.dumps({
        "stations": len(station_rows),
        "readings": len(reading_rows),
        "source": "DAHITI live API",
        "synthetic": False,
        "unique_source_hashes": len({row["source_hash"] for row in reading_rows}),
    }))


if __name__ == "__main__":
    main()
