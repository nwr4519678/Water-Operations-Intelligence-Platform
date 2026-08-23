# Data Quality & Validation Report
**Dataset:** POTOMAC_RIVER_NEAR_WASH_DC_LITTLE_FALLS_PUMP_STA  
**Year:** 2026  
**Version Identifier:** v1.0.0  
**Date Generated:** 2026-08-21 15:19:03  

## 1. Executive Summary & KPIs
* **Total Source Records:** 5574
* **Clean Normalized Records:** 5143
* **Quarantined Records:** 431 (7.73%)
* **Duplicate Timestamps:** 0.00%
* **Missing Value Rate (Clean Dataset):** 0.00%
* **Record Count Reconciliation:** PASS (Clean + Quarantined matches Source Totals)

## 2. Validation Checks (Pass/Fail)
* **Sampling Continuity (Strict 1-Hour Intervals):** FAIL
* **Quarantine Isolation (Invalid data excluded from clean):** PASS
* **Schema Adherence (Consistent numeric types):** PASS

## 3. Range & Distribution Audit
*Statistical outlier detection uses the 1.5 * IQR methodology to separate true anomalies from operational events.*
* **Temperature**: Range Check: PASS | Min: 0.10, Max: 34.10 | Outliers Detected: 0
* **Streamflow**: Range Check: PASS | Min: 21.24, Max: 1184.11 | Outliers Detected: 403
* **Gage height**: Range Check: PASS | Min: 0.77, Max: 1.96 | Outliers Detected: 260

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
