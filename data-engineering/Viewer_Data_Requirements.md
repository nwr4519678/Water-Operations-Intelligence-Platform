# D1: Viewer Data Requirements, KPI Definitions, and Dataset Acceptance Matrix

## 1. Entities Inventory
* **Organization/Region:** USGS / NWIS (National Water Information System).
* **Station:** Unique 8-digit site identifier (e.g., `09504500`).
* **Sensor/Parameter:** Gage height, Streamflow, Temperature, Precipitation.
* **Measurement:** Time-series telemetry values.
* **Alarm:** Threshold breach notifications (e.g., High Flow).
* **Report:** Aggregated system status over time (e.g., Daily Averages).
* **AI Insight:** Predictions or anomaly detection based on clean telemetry.
* **Quality Flags:** `P` (Provisional data subject to revision). Validated against API `qualifiers`.

## 2. KPI Formulas & Station Status Rules
* **Total Stations:** `COUNT(DISTINCT station_id)` in the active registry.
* **Online/Offline Status:** A station is **Online** if at least one valid measurement is received within the stale-data threshold.
* **Stale-Data Threshold:** > 2 hours since the last recorded `timestamp_utc`.
* **Alarm Count:** `SUM(active_alarms)` where current telemetry exceeds predefined threshold parameters.

## 3. Chart Parameters & Valid Ranges
* **Timezone:** UTC (`timestamp_utc`).
* **Sampling Interval:** 1 Hour (Downsampled from 15-minute raw intervals).
* **Gap Rules:** Missing 15-minute intervals are ignored during aggregation; missing hourly blocks are rendered as `NaN` to break the chart line.
* **Valid Ranges:** Excludes API sentinel values (`-999999.0`), which are transformed to `None` prior to aggregation. Accepted quality flags include `P` (Provisional) and `A` (Approved).

## 4. Minimum Fields (Alarms, Reports, AI Cards)
* **Alarms:** `station_id`, `timestamp_utc`, `parameter`, `trigger_value`, `threshold_limit`, `severity`.
* **Reports:** `station_id`, `reporting_period`, `metric_mean`, `metric_max`, `data_completeness_pct`.
* **AI Cards:** `station_id`, `prediction_timestamp`, `predicted_metric`, `confidence_interval`, `anomaly_flag`.

## 5. Viewer Data Acceptance Matrix

| UI Field / Metric | Source Column | Transformation Rule | Unit | Test / Seed Value |
| :--- | :--- | :--- | :--- | :--- |
| **Water Level** | `Gage height` | `.resample('1h').mean()` | ft | `1.97` |
| **Flow Rate** | `Streamflow` | `.resample('1h').mean()` | ft³/s | `23.40` |
| **Water Temp** | `Temperature` | `.resample('1h').mean()` | °C | *Varies by station* |
| **Rainfall Total** | `Precipitation` | `.resample('1h').sum()` | inches | `0.00` |
| **Last Updated** | `timestamp_utc` | `pd.to_datetime(utc=True)` | UTC | `2026-07-01 07:00:00+00:00` |

## 6. Sample Expected Output (Seed Data)

Based on the pipeline processing logic, the expected backend output ready for UI rendering matches this structure:

| timestamp_utc | Gage height | Streamflow |
| :--- | :--- | :--- |
| **2026-07-01 07:00:00+00:00** | 1.9700 | 23.400 |
| **2026-07-01 08:00:00+00:00** | 1.9725 | 23.525 |
| **2026-07-01 09:00:00+00:00** | 1.9750 | 23.650 |
