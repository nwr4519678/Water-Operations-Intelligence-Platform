# D1: Viewer Data Requirements, KPI Definitions, and Dataset Acceptance Matrix

## 1. Entities Inventory
* **Organization/Region:** USGS / NWIS (National Water Information System).
* **Station:** Unique 8-digit site identifier (e.g., `09504500`).
* **Sensor/Parameter:** Gage height, Streamflow, Temperature, Precipitation.
* **Measurement:** Time-series telemetry values.
* **State & Alarms:** `Station_State` (Online, Warning, Critical) and `Active_Alarms` strings based on threshold breaches or data integrity.
* **Report:** Aggregated system status over time (e.g., Daily Averages).
* **AI Insight:** Predictions or anomaly detection based on clean telemetry.
* **Quality Flags:** Explicit `_qa_flag` columns (e.g., `VALID`, `ERR_SENTINEL_MISSING`).

## 2. KPI Formulas & Station Status Rules
* **Total Stations:** `COUNT(DISTINCT station_id)` in the active registry.
* **Station State:** 
  * **Online:** Sensors valid and operating normally.
  * **Warning:** Threshold breach detected (e.g., Streamflow < 10.0 or > 500.0).
  * **Critical:** Sensor data missing, quarantined, or invalid (e.g., offline or sentinel values detected).
* **Stale-Data Threshold:** > 2 hours since the last recorded `timestamp_utc`.
* **Alarm Count:** `SUM(active_alarms)` where current telemetry triggers a Warning or Critical state.

## 3. Chart Parameters & Valid Ranges
* **Timezone:** UTC (`timestamp_utc`).
* **Sampling Interval:** 1 Hour (Downsampled from 15-minute raw intervals).
* **Gap Rules:** Missing 15-minute intervals are ignored during aggregation. Hourly blocks missing raw data are strictly rendered as `NaN` (using `min_count=1` for Precipitation to avoid false zeros) to break the chart line.
* **Valid Ranges:** Excludes API sentinel values (`-999999.0`). Invalid records are routed to a `QUARANTINE` dataset and are strictly excluded from the `CLEAN` frontend fixture.

## 4. Minimum Fields (Alarms, Reports, AI Cards)
* **Alarms:** `station_id`, `timestamp_utc`, `Station_State`, `Active_Alarms`.
* **Reports:** `station_id`, `reporting_period`, `metric_mean`, `metric_max`, `data_completeness_pct`.
* **AI Cards:** `station_id`, `prediction_timestamp`, `predicted_metric`, `confidence_interval`, `anomaly_flag`.

## 5. Viewer Data Acceptance Matrix

| UI Field / Metric | Source Column | Transformation Rule | Unit | Test / Seed Value |
| :--- | :--- | :--- | :--- | :--- |
| **Water Level** | `Gage height` | `.resample('1h').mean()` | ft | `1.97` |
| **Flow Rate** | `Streamflow` | `.resample('1h').mean()` | ft³/s | `23.40` |
| **Water Temp** | `Temperature` | `.resample('1h').mean()` | °C | *Varies by station* |
| **Rainfall Total** | `Precipitation` | `.resample('1h').sum(min_count=1)` | inches | `0.00` |
| **Station Health**| `Station_State` | `evaluate_station_health()` | string | `Online` |
| **Active Alarms** | `Active_Alarms` | `evaluate_station_health()` | string | `Resolved: Operating normally` |
| **Last Updated** | `timestamp_utc` | `pd.to_datetime(utc=True)` | UTC | `2026-07-01 07:00:00+00:00` |

## 6. Sample Expected Output (Seed Data)

| timestamp_utc | Gage height | Streamflow | Precipitation | Station_State | Active_Alarms |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **2026-07-01 07:00:00+00:00** | 1.9700 | 23.400 | 0.0 | Online | Resolved: Operating normally |
| **2026-07-01 08:00:00+00:00** | 1.9725 | 600.50 | 2.5 | Warning | WARN: High flow rate detected (Flood risk) |
| **2026-07-01 09:00:00+00:00** | NaN | NaN | NaN | Critical | CRITICAL_ALARM: Sensor data missing or invalid |