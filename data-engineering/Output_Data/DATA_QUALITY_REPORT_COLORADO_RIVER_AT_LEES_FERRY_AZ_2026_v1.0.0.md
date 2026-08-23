# Data Quality & Validation Report
**Dataset:** COLORADO_RIVER_AT_LEES_FERRY_AZ  
**Year:** 2026  
**Version Identifier:** v1.0.0  
**Date Generated:** 2026-08-21 15:19:02  

## 1. Executive Summary & KPIs
* **Total Source Records:** 5573
* **Clean Normalized Records:** 2882
* **Quarantined Records:** 2691 (48.29%)
* **Duplicate Timestamps:** 0.00%
* **Missing Value Rate (Clean Dataset):** 0.00%
* **Record Count Reconciliation:** PASS (Clean + Quarantined matches Source Totals)

## 2. Validation Checks (Pass/Fail)
* **Sampling Continuity (Strict 1-Hour Intervals):** FAIL
* **Quarantine Isolation (Invalid data excluded from clean):** PASS
* **Schema Adherence (Consistent numeric types):** PASS

## 3. Range & Distribution Audit
*Statistical outlier detection uses the 1.5 * IQR methodology to separate true anomalies from operational events.*
* **Temperature**: Range Check: PASS | Min: 10.00, Max: 21.50 | Outliers Detected: 0
* **Precipitation**: Range Check: PASS | Min: 0.00, Max: 11.43 | Outliers Detected: 18
* **Streamflow**: Range Check: PASS | Min: 172.45, Max: 299.45 | Outliers Detected: 113
* **Gage height**: Range Check: PASS | Min: 2.27, Max: 2.67 | Outliers Detected: 4

## 4. Frontend Charting & UI Rules
* **Included Values:** All numeric columns in the `CLEAN` dataset are validated for time-series charting.
* **Excluded Values:** `_qa_flag` columns, `Station_State`, and `Active_Alarms` are strictly strings intended for UI labels, not chart axes. Quarantined records must **never** be rendered on charts.
* **Missing Gaps:** Frontend should render `NaN` values as broken line segments, avoiding false zeros.

## 5. Issues, Decisions, & Unresolved Risks
* **Decision:** Replaced dynamic missing precipitation intervals with blank `NaN`s instead of computing false zeros.
* **Risk:** High outlier counts in streamflow may represent actual flood events. Domain expert review is recommended before applying AI smoothing.

---
### Analyst Verification
**Sign-off:** ___________________________  
**Role:** Lead Data Engineer  
**Date:** ___________________________  
