# Demo Dataset Fixture (D2)

## Overview
This fixture provides a deterministic, multi-region dataset designed to test all frontend UI components, including normal operations, threshold alarms, and missing-data edge cases.

## Included Regions & Stations
* **09504500:** Oak Creek, AZ
* **09380000:** Colorado River, AZ
* **01646500:** Potomac River, DC
* **14105700:** Columbia River, OR
* **07010000:** Mississippi River, MO
* **99999999:** Fake Station (Used to test empty/error UI states)

## Data States Tested
* **Online:** Normal operating range.
* **Warning:** Flow rates outside standard thresholds (e.g., < 10.0 or > 500.0).
* **Critical:** Sensor data missing, quarantined, or invalid.
* **Empty:** Station ID returned no metadata or readings.

## Expected KPI Totals (Acceptance Matrix)
*(Note: Fill these in after the final batch run)*
* **Total Stations Processed:** 6
* **Total Clean Records:** [Insert Total]
* **Total Quarantined Records:** [Insert Total]
* **Stations in Warning State:** [Insert Count]
* **Stations in Critical State:** [Insert Count]

## Notes for Frontend Developers
All quarantine records are strictly isolated in `QUARANTINE_...csv` files. The `CLEAN_...csv` files contain safe, AI-ready data. Missing sensor intervals are handled gracefully without defaulting to false zeros.