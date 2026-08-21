---
title: Water Operations Intelligence Platform — Desktop Operations + Web Administration Specification (.NET 10 + Avalonia + React/TypeScript + Python Local Custom AI)
type: Master Technical Specification
status: production-ready
version: 5.0
scope: dashboard + platform + local AI + data engineering
tags: [telemetry, water-operations, dotnet10, avalonia, desktop, react, typescript, web, python, fastapi, scikit-learn, data-engineering, etl, local-ai, custom-models, full-spec]
---

# 💧🧠 Water Operations Intelligence Platform — Complete Application Specification

> [!info] What this document is
> The full, all-in specification for the Water Operations Intelligence Platform: core monitoring, role-specific user experiences, platform services, data engineering, and a locally-trained custom AI/ML layer. The production application has two clients: **Water Operations Desktop** built with **.NET 10 + Avalonia UI** for `OPERATOR` users, and **Water Operations Web** built with **React + TypeScript** for `ADMIN` and `VIEWER` users. Both clients use the same **ASP.NET Core .NET 10 backend**, REST APIs, and SignalR events. The **AI/ML layer is a standalone Python service** (FastAPI + scikit-learn/statsmodels/River), trained on the platform's own historical telemetry and running entirely on-premises, called by the .NET backend over the internal network only.

> [!important] Application boundary and role assignment
> This is a shared platform with role-specific clients. Operators use the installed Avalonia desktop application for continuous control-room monitoring and operational actions. Administrators and viewers use the browser-based React/TypeScript application. The backend is the security boundary: client-side route/button hiding is only a usability feature and never replaces server-side authorization. `OPERATOR`, `ADMIN`, and `VIEWER` permissions are enforced consistently for REST, SignalR, reports, exports, and AI endpoints.

## Table of Contents

1. [[#1 Platform Architecture]]
2. [[#2 Design Rationale — Why Each Layer Exists]]
3. [[#3 Core Monitoring Features (Full Detail)]]
4. [[#4 Platform-Wide Features]]
5. [[#5 Creative UX Features]]
6. [[#6 Local Custom AI/ML Layer (Python)]]
7. [[#7 Data Processing & Data Engineering Pipeline]]
8. [[#8 ML Training Pipeline & MLOps (Local, Python)]]
9. [[#9 Data Import & Continuous Learning]]
10. [[#10 Python AI Service Architecture]]
11. [[#11 .NET 10 Backend Architecture]]
12. [[#12 Client Applications Architecture]]
13. [[#13 Full API Contract (Core + AI)]]
14. [[#14 Data Model (Application + ML)]]
15. [[#15 Security & Performance for Local AI]]
16. [[#16 Project Structure]]
17. [[#17 Phased Roadmap]]
18. [[#18 Complete Feature Checklist]]

---

## 1. Platform Architecture

```text
┌───────────────────────────────────────────────────────────────────┐
│  AVALONIA DESKTOP CLIENT — OPERATOR CONTROL ROOM                   │
│  .NET 10 │ Avalonia UI │ MVVM │ Overview │ Map │ Stations │ Alarms  │
│  Charts │ Reports │ Offline cache │ operator actions │ AI panels     │
└───────────────────────────┬─────────────────────────────────────────┘
                             │ HTTPS (REST) + WSS (SignalR)
                             │
┌───────────────────────────┴─────────────────────────────────────────┐
│  REACT + TYPESCRIPT WEB CLIENT — ADMINISTRATION & VIEW-ONLY ACCESS  │
│  Vite │ React │ TypeScript │ Admin │ Viewer │ Reports │ Analytics    │
│  User/station/configuration management (ADMIN only)                 │
└───────────────────────────┬─────────────────────────────────────────┘
                             │ HTTPS (REST) + WSS (SignalR)
                             ▼
┌───────────────────────────────────────────────────────────────────┐
│                     .NET 10 BACKEND (ASP.NET Core)                 │
│                                                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────────┐ │
│  │ Telemetry   │  │ Auth/Users  │  │ Notification│  │ AI Gateway     │ │
│  │ API Module  │  │ Module      │  │ Module      │  │ (thin client,  │ │
│  │             │  │             │  │             │  │  no ML code)   │ │
│  └────────────┘  └────────────┘  └────────────┘  └───────┬───────┘ │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐          │         │
│  │ SignalR Hub │  │ Reports/Job │  │ Audit Log   │          │         │
│  │ (real-time) │  │ Engine      │  │ Module      │          │         │
│  └────────────┘  └────────────┘  └────────────┘          │         │
└───────────────────────────┬─────────────────────────────┼─────────┘
                             │ EF Core 10                   │ internal HTTP
                             ▼                               │ (private network/
┌───────────────────────────────────────────────────────────────────┐  loopback only,
│                    PostgreSQL / TimescaleDB                        │  never public)
│   Stations │ Measurements (raw + clean, time-series) │ Alarms │      │  │
│   Users │ Feature Store │ ML Model Registry │ Training Runs │       │  │
│   Data Quality Logs │ Audit Log                                     │  │
└───────────────────────────▲─────────────────────────────────────────┘  │
                             │ SQLAlchemy / asyncpg                        │
                             │                                             ▼
                    ┌────────────────────────────────────────────────────────┐
                    │            WaterTelemetry AI Service (Python)            │
                    │  FastAPI │ scikit-learn │ statsmodels │ River │ pandas   │
                    │  Data Cleaning/Validation │ Feature Store │              │
                    │  Forecasting │ Anomaly Detection │ Clustering │          │
                    │  Predictive Maintenance │ Fault Classifier │ Risk Score  │
                    │  APScheduler / Celery worker (retraining + data jobs)    │
                    └───────────────────────────┬────────────────────────────┘
                                                 │ local file system / model store
                                        ┌────────────────┐
                                        │ Trained .pkl /   │  ← scikit-learn/joblib
                                        │ .onnx artifacts   │    models, trained
                                        └────────────────┘    locally, no external calls
```

**Everything runs on-premises.** No component in this architecture calls an external AI/cloud API. The Avalonia desktop client and React web client never call the Python service directly. Both call the .NET backend, which performs authentication, authorization, validation, auditing, and protocol translation. The separate Python service only talks to PostgreSQL and is reachable from the .NET backend over the private network. It also owns the **data processing/engineering pipeline** (Section 7) that turns raw sensor readings into clean, feature-ready data before any model sees it.

---

## 2. Design Rationale — Why Each Layer Exists

| Layer | Why it exists | Why this technology |
|---|---|---|
| **Avalonia Desktop Client** | Operators need a dedicated, always-on control-room surface with reliable desktop behavior and offline-friendly state | Cross-platform .NET UI, MVVM, native windowing, local secure storage, and a single packaged operator application |
| **React + TypeScript Web Client** | Administrators need configuration and management tools; viewers need secure browser-based read-only analytics | Fast browser delivery, typed API contracts, responsive layouts, and role-specific routes without installing software |
| **ASP.NET Core 10 Web API** | Central, strongly-typed contract for all telemetry, auth, and AI data | .NET 10 gives native AOT-friendly performance, minimal APIs for lean endpoints, and first-class SignalR for push updates; it stays the *only* public surface even though AI inference and data processing now happen elsewhere |
| **SignalR (not raw WebSocket)** | Real-time station/alarm updates | Built into .NET, automatic reconnection, typed hub methods, integrates cleanly with ASP.NET auth |
| **Python Data & AI Service (FastAPI)** | Data must be cleaned/validated/engineered before any model is trustworthy, and AI must be a **custom, locally-trained model**, not a chatbot | Python's data ecosystem is the deepest fit for both halves of this job: **pandas/numpy/pandera** for cleaning, validation, and feature engineering (Section 7), and **scikit-learn**, a hand-rolled **SSA** forecaster, and **River** for the ML layer itself (Section 6) — all trained on our own data, running as a local Python process, zero external dependency |
| **Internal AI Gateway** (.NET → Python, HTTP over the private network) | Frontend and auth must stay centralized in one API surface | Keeps JWT/role enforcement, request logging, and the public `/ai/*` contract exactly where they already were; the model and data-engineering code lives in an independently deployable Python service, so it stays swappable without touching the frontend or auth layer |
| **PostgreSQL/TimescaleDB** | Time-series-heavy workload (millions of measurement rows) needs efficient range queries, and now also needs raw-vs-clean separation, continuous aggregates, and compression/retention policies | TimescaleDB extension gives hypertables + continuous aggregates + native compression without leaving the relational/SQL model the rest of the app already uses; both the .NET backend and the Python service connect to the same instance |
| **Quartz.NET background worker** | Report generation and threshold re-evaluation must run on schedule, off the request path | Reliable, persistent job scheduling native to .NET, avoids blocking API threads — model *retraining* and *data processing* jobs have moved to the Python service's own scheduler (Section 8.2, Section 7.5), so Quartz now only owns non-ML, non-data-engineering scheduled work |
| **APScheduler / Celery + Redis (Python service)** | Data-quality scans, feature-store maintenance, and model retraining must all run on schedule, independent of the .NET request path | Runs natively inside the Python service so scheduled jobs share the exact process/library versions as the pipeline code itself — no cross-runtime job-trigger complexity; Celery is the documented upgrade path once volume justifies a durable broker |

---

## 3. Core Monitoring Features (Full Detail)

### 3.1 Overview
- System KPI strip: Total/Online/Offline stations, Active/Critical/Warning alarm counts
- Live-updating current water levels per station (top N by severity, expandable to all)
- Recent alarms feed (live)
- Connection status indicator (Live / Reconnecting / Offline-cached)
- **"Focus Stations"** pinned section (manual pin + AI-suggested, see Section 6.7)
- **"Attention Soon"** predictive maintenance shortlist (Section 6.3)
- Regional/zone grouping toggle (aggregate KPIs per canal/zone, not just system-wide)

### 3.2 Map
- Pin view: color-coded markers by status
- Marker clustering above density threshold
- Popup detail on click + "View Details" deep link
- **Flow View** (animated particle flow along canal paths, Section 5.5)
- **Weather/Rain overlay** toggle
- Unmapped-station fallback list
- Draw-a-region selection tool (select stations by drawing a polygon on the map, bulk-view their status)

### 3.3 Stations
- Server-paginated, sortable, filterable list (status, region, search)
- Station Details: live KPIs, embedded mini chart, recent alarms, health forecast widget
- **Anomaly badge column** (Section 6.2)
- **Comparative Station Cards** (drag up to 4 into side-by-side view, Section 5.3)
- Bulk actions (export selected, bulk-acknowledge related alarms)
- Station metadata editor (name, coordinates, region, sensor list) for `ADMIN`

### 3.4 Charts
- Station + parameter + period selector, server-side downsampled resolution (backed by TimescaleDB continuous aggregates, Section 7.3)
- Live-tail append for "last 24h" view
- Threshold reference lines
- **Forecast overlay with confidence band** (Section 6.1)
- **Operator annotations** — click-to-pin a note on a chart point (Section 5.9)
- Multi-parameter overlay (plot Water Level + Flow Rate on dual y-axis)
- Interpolated/gap-filled chart segments render with a distinct dashed style (Section 7.3), so operators never mistake a filled gap for a real reading
- Export chart as PNG/SVG

### 3.5 Alarms
- Filterable/sortable alarm list, chronological + **Smart View clustering** (Section 6.5)
- Acknowledge/resolve actions (role-gated), optimistic UI update in both clients where safe
- Alarm detail drawer: full context, related station trend snapshot, similar past alarms
- **Sensor-fault vs real-event classification badge** (Section 6.8)
- Notification preferences per alarm severity (Section 4.3)

### 3.6 Reports
- Station + parameter + date range + format (PDF/Excel) generation, async job with polling
- Summary stats (Min/Max/Average/Event counts)
- **AI narrative summary section**, grounded strictly in the computed stats (Section 6.6 — statistical/template-based, not a generative chatbot)
- Scheduled recurring reports (daily/weekly/monthly emailed automatically)
- Report history/library with re-download

---

## 4. Platform-Wide Features

### 4.1 Authentication & User Management
- Login, JWT access/refresh flow, forced logout on refresh failure
- Roles: `VIEWER`, `OPERATOR`, `ADMIN` (+ extensible custom roles)
- Client assignment: `OPERATOR` → Avalonia desktop; `ADMIN` and `VIEWER` → React/TypeScript web
- `OPERATOR`: live monitoring, station details, alarm acknowledgment/resolution, annotations, reports, and operational handover workflows
- `VIEWER`: read-only overview, map, stations, charts, alarms, AI insights, and reports; no operational mutations
- `ADMIN`: all viewer capabilities plus users, roles, stations, thresholds, organizations, imports, audit, model health, and system configuration
- The API applies endpoint, resource, and action authorization independently of the client used to make the request
- User management screen (`ADMIN`): invite, deactivate, role assignment
- Password policy enforcement, optional MFA (TOTP)
- Session list & "log out other devices"

### 4.2 Settings & Personalization
- Theme: Light / Dark / **Control Room** (Section 5.6)
- Units preference (metric only, but configurable decimal precision)
- Timezone/locale display preference
- Default landing page per user
- Dashboard layout customization — **drag-and-drop widget builder** on Overview (Section 5.10)

### 4.3 Notifications
- In-app notification center (bell icon, unread count)
- Per-user, per-severity notification preferences (in-app / email / push)
- Web notifications for Critical alarms where permitted; desktop toast/sound notifications for operators
- Daily digest email option

### 4.4 Search & Navigation
- **Command Palette (⌘K)** — jump to any station/page/action
- Global search bar (stations, alarms, reports)
- Breadcrumb navigation on detail pages
- Keyboard shortcuts reference panel (`?` key)

### 4.5 Audit & Compliance
- Full audit log: logins, alarm acknowledgments, threshold edits, user management actions, report generation
- Audit log viewer (`ADMIN`) with filter/export
- Immutable log storage (append-only table)

### 4.6 Multi-Tenancy / Multi-Project Support
- Support multiple independent deployments/regions under one platform instance (`OrganizationId` scoping across all entities)
- Per-organization branding (logo, primary color) — white-label ready

### 4.7 Internationalization & Accessibility
- i18n-ready string layer (Arabic/English at minimum, RTL layout support)
- WCAG 2.1 AA compliance: keyboard navigation, screen-reader labels, color-contrast-safe status colors (never color-only — always paired with icon/text)

### 4.8 Offline & Client Resilience
- Avalonia desktop: encrypted local cache of the last-known Overview, station metadata, and alarms; visible connection state; queued operator annotations/acknowledgment attempts only when the operation is explicitly safe and idempotent
- React web: browser cache for the last-known read-only Overview/Alarms and a reconnection banner; no privileged administration action is completed offline
- The backend remains authoritative and reconciles stale client state after reconnection

### 4.9 Platform Health & Status
- Public/internal **Status Page**: API uptime, WebSocket connectivity, last data ingestion timestamp per station group
- `/health` endpoint surfaced in-app for `ADMIN` (DB latency, background job queue depth, ML model freshness, and now data-quality pass rate — Section 7.5 — all polled from the Python service via the AI Gateway)

### 4.10 Data Portability
- Export any table view (Stations, Alarms) as CSV/Excel directly from the UI, not only via the Reports module
- Bulk station import (CSV) for initial setup / new deployments

### 4.11 Help & Onboarding
- First-login guided tour (spotlight walkthrough of the 6 core pages)
- Contextual help tooltips (`?` icons next to non-obvious controls, e.g., forecast confidence band)
- In-app changelog/"What's New" panel

### 4.12 Sharing & Collaboration
- Shareable read-only snapshot links (time-boxed, e.g., "share current Canal 03 status for 24h" — for external stakeholders without full accounts)
- Comment/annotation thread per station (operator handover notes, separate from chart-point annotations)

---

## 5. Creative UX Features

| #    | Feature                             | Description                                                                                                                       |
| ---- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 5.1  | **Command Palette**                 | ⌘K instant navigation/actions across the whole app                                                                                |
| 5.2  | **Timeline Scrubber**               | Rewind the entire dashboard (Map + Overview + Stations) to any past moment                                                        |
| 5.3  | **Comparative Station Cards**       | Drag up to 4 stations into a synchronized side-by-side comparison                                                                 |
| 5.4  | **Incident Replay ("Story Mode")**  | Auto-assembled chronological playback of a past critical event across Map/Chart/Alarm feed                                        |
| 5.5  | **Digital Twin Flow View**          | Canals rendered as connected paths with animated particle flow intensity mapped to real Flow Rate                                 |
| 5.6  | **Control Room Theme**              | High-contrast, large-type mode for wall displays and night shifts                                                                 |
| 5.7  | **Annotated Threshold Editor**      | Drag-to-set Warning/Critical threshold lines directly on a chart                                                                  |
| 5.8  | **Response-Time Insights**          | Team-level (opt-in) metrics — average alarm acknowledgment time trend, not competitive gamification                               |
| 5.9  | **Chart Annotations**               | Operators pin timestamped notes directly onto historical charts for institutional memory                                          |
| 5.10 | **Drag-and-Drop Dashboard Builder** | Operators compose their own Overview layout from a widget library (KPI card, mini-map, alarm feed, focus stations, forecast tile) |
| 5.11 | **Web Responsive View**             | Condensed, alarm-first responsive layout for admin/viewer browser access, including tablet-sized screens                       |
| 5.12 | **Print-Friendly Report View**      | One-click clean print stylesheet for any report or station snapshot                                                               |
| 5.13 | **Region Draw Tool**                | Lasso-select stations on the Map for bulk status review                                                                           |
| 5.14 | **Snapshot Sharing**                | Time-boxed shareable read-only link for a station or Overview state                                                               |

---

## 6. Local Custom AI/ML Layer (Python)

> [!important] Hard constraint honored throughout this section
> Every model below is **trained from scratch on this platform's own historical telemetry**, using **Python (scikit-learn / statsmodels / River / numpy)**, and runs **entirely locally** inside the **WaterTelemetry AI Service** — a standalone FastAPI process on-premises, reachable only by the .NET backend over the private network. There is no LLM, no chatbot, no external API call anywhere in this layer. Every model here is trained on data that has already passed through the cleaning/validation/feature-engineering pipeline in Section 7 — none of them ever sees raw, unvalidated sensor data directly.

### 6.1 📈 Time-Series Forecasting (per station, per parameter)

- **Algorithm:** a hand-rolled **SSA (Singular Spectrum Analysis)** forecaster implemented directly in numpy/scipy (trajectory-matrix embedding → SVD → diagonal averaging → linear recurrence forecast) — kept custom and owned in-house rather than pulled from a generic forecasting library, so the confidence-interval math is fully understood; **statsmodels' `SARIMAX`** is kept as a documented fallback for stations whose seasonality doesn't fit SSA's assumptions well.
- **Input features:** the *cleaned, gap-handled* Water Level / Flow Rate series per station from the Feature Store (Section 7.4), resampled to a fixed interval (e.g., 15 min).
- **Output:** forecasted values for the next *N* horizon steps + confidence interval (computed from the SSA reconstruction residuals).
- **Training:** one model per `(stationId, parameter)` pair, retrained nightly on a rolling historical window (Section 8).
- **Serving:** loaded into memory by an in-process `ForecastModelCache` (a simple LRU dict) inside the FastAPI app; inference is a synchronous, sub-millisecond call — no queueing needed. The .NET AI Gateway proxies the `/ai/forecast/...` call straight through.
- **UI:** forecast overlay + threshold-breach ETA on the Charts page (as previously specified), computed by comparing the forecast trajectory against the station's configured thresholds.

### 6.2 🔎 Anomaly & Spike Detection

- **Algorithm:** **River's** incremental/streaming anomaly detectors (e.g., `HalfSpaceTrees`) for point anomalies, plus a change-point routine (either River's own drift detectors or the `ruptures` library run on rolling windows) for trend/level shifts.
- **Purpose:** catch statistically unusual-but-plausible readings a static threshold would miss — including the classic **flatline fault** (near-zero rolling variance is detected via a lightweight numpy variance-monitor rule layered on top of the streaming pipeline, flagged separately as `FLATLINE`). This is deliberately distinct from the rule-based, deterministic outlier rejection that happens earlier in Section 7.2 — that stage catches physically-impossible values before they're even stored as valid; this stage catches values that are physically plausible but statistically unusual.
- **Output:** anomaly score + boolean flag + human-readable reason code (`SPIKE`, `LEVEL_SHIFT`, `FLATLINE`).
- **Serving:** runs incrementally as new measurements arrive — this is exactly what River is designed for (`learn_one`/`score_one` per incoming reading, no batch retrain needed to reflect new data), so anomalies surface close to real time rather than only at the next scheduled retrain.
- **UI:** "Unusual pattern" badge on Stations table/detail, visually distinct from threshold alarms.

### 6.3 🩺 Predictive Maintenance (Battery & Communication Health)

- **Algorithm:** scikit-learn's **`HistGradientBoostingRegressor`** (or LightGBM, if the dataset size later justifies it) trained on historical battery-voltage decay curves and communication-failure frequency per station.
- **Features:** rolling battery discharge rate, days since last communication gap, gap frequency trend, ambient signal strength trend, and (new) the station's quarantine/rejection rate trend from Section 7.5's data-quality monitoring — a rising rate of rejected readings is itself often an early symptom of failing hardware.
- **Output:** predicted days-until-low-battery-threshold, and a communication-reliability trend score.
- **Training:** supervised on stations with a known prior maintenance/replacement event as the "label" (time-to-event framing); where labels are sparse, an unsupervised trend-slope fallback (`numpy.polyfit`/scikit-learn `LinearRegression` per station) is used until enough labeled events accumulate — a pragmatic, honest approach appropriate for a real from-scratch rollout.
- **UI:** "Health Forecast" widget on Station Details + system-wide "Attention Soon" list on Overview.

### 6.4 🧩 Station Behavior Clustering

- **Algorithm:** scikit-learn's **`KMeans`** on engineered per-station feature vectors (average level, volatility, diurnal pattern shape, alarm frequency).
- **Purpose:** automatically group stations into behavioral profiles (e.g., "stable low-flow," "high-variance flood-prone," "chronically unstable communication") — used to (a) set smarter default thresholds per cluster rather than one-size-fits-all, and (b) flag a station that suddenly moves to a different cluster than its historical norm as a meaningful macro-level anomaly.
- **UI:** cluster label shown as a subtle tag on Station Details ("Profile: High-Variance"); a cluster-change event raises a system-level insight on Overview.

### 6.5 🧭 Alarm Correlation & Root-Cause Clustering

- **Algorithm:** unsupervised spatial-temporal clustering — group alarms that co-occur within a configurable time window **and** are topologically connected (upstream/downstream relationship in the station graph), implemented as a custom clustering routine (graph-based union-find in pure Python + temporal windowing) layered over scikit-learn's **`KMeans`** output on alarm feature vectors (severity, type, station-cluster membership from 6.4, time delta).
- **Output:** grouped alarm clusters with a computed "likely common origin" station (the one whose alarm timestamp is earliest in the cluster and is topologically upstream).
- **UI:** "Smart View" on Alarms page groups related alarms with a plain-language, template-generated rationale (e.g., `"{count} alarms within {window} minutes, downstream of {originStation}"` — a deterministic template filled from model output, not free-text generation).

### 6.6 📝 Data-Driven Narrative Report Summaries

- **Approach:** **not** an LLM — a **deterministic natural-language template engine** (Jinja2 string templates, or plain Python f-strings for the simple cases) driven by the computed report statistics (Min/Max/Average/Event counts) and simple trend classification (rising/falling/stable, computed via a numpy linear-regression slope on the report period).
- **Example generation logic:**
  ```text
  IF criticalEvents > 0 AND concentratedInWeek(events) →
    "{count} critical events, concentrated in {week}."
  IF trendSlope > threshold → "levels trended upward across the period."
  ELSE → "levels remained within the normal range for {pct}% of the period."
  ```
- **Why this satisfies "AI feature" honestly:** it is a genuinely useful, rule-driven natural-language generation system built entirely in-house, with zero hallucination risk since every sentence maps to a verifiable computed statistic — appropriate and *excellent* precisely because it's simple, local, and 100% explainable.

### 6.7 🎯 Focus Station Recommendation

- **Algorithm:** lightweight collaborative-filtering-style scoring (plain pandas/numpy, no trained model needed) — ranks stations for a given user by a weighted function of: recency of that user's views/acknowledgments, station's current anomaly/alarm frequency, and cluster-based similarity to stations the user already frequently checks (reuses 6.4 clustering output).
- **Output:** ranked station list refreshed daily per user.
- **UI:** "Focus Stations" section on Overview (Section 3.1), always user-editable/overridable.

### 6.8 🧪 Sensor-Fault vs Real-Event Classifier

- **Algorithm:** scikit-learn binary classification (**`GradientBoostingClassifier`** or `LogisticRegression`, chosen per evaluation results) trained on historically **resolved** alarms labeled by operators as "real event" vs "sensor fault" (the acknowledge/resolve flow is extended with an optional one-click label to build this training set organically over time — see Section 8.4).
- **Features:** rate-of-change magnitude, concurrent flatline/spike anomaly flags (6.2), battery health trend (6.3), whether neighboring/topologically-connected stations show a correlated pattern.
- **Output:** probability the current Critical/Warning alarm is a sensor fault rather than a real hydraulic event.
- **UI:** confidence badge next to the alarm ("Likely real event — 92%" / "Possible sensor fault — 71%"), purely advisory, never auto-dismissing an alarm.

### 6.9 🌊 Composite Flood-Risk Score

- **Approach:** a deterministic scoring engine (not a black-box model), computed in plain Python, combining normalized outputs from 6.1 (forecast trajectory vs threshold), 6.2 (active anomalies), and topological upstream station states, into a single 0–100 risk score per station/region.
- **Formula shape:**
  `risk = w1·forecastProximityToThreshold + w2·upstreamRiskPropagation + w3·anomalyPresence + w4·recentTrendSlope`
  with weights tunable per deployment and fully visible in an admin settings panel — deliberately transparent rather than a trained black box, since risk scoring is exactly the kind of output that most needs to be explainable.
- **UI:** risk badge on Map/Overview per station/region, with a breakdown tooltip showing each contributing factor's value.

---

## 7. Data Processing & Data Engineering Pipeline

> [!important] Why this is its own section
> Every model in Section 6 and every scheduled retrain in Section 8 is only as trustworthy as the data underneath it. Raw field telemetry is never clean: sensors drop out, clocks drift, duplicate transmissions happen over flaky radio/cellular links, and a corroded probe can report a physically impossible reading. Treating "clean the data" as a one-line bullet inside the ML pipeline undersells how much real engineering work sits between "a sensor sent a byte" and "a model can trust that byte." This section makes that work explicit — it's the layer that runs *before* Section 6's models and *before* Section 8's training pipeline ever touch a number.

### 7.1 Raw Ingestion Layer (Kept Separate From "Clean" Data)

- The application-level ingestion already described in Section 3 (a station pushing a reading, written via the Telemetry API) lands in an **append-only raw hypertable** (`MeasurementRaw`), untouched, exactly as the device sent it.
- Two timestamps are recorded per raw row: the **device timestamp** (what the sensor claims) and the **ingestion timestamp** (when the platform received it) — the gap between them is itself a useful signal for detecting clock drift or a station that's been buffering readings offline and burst-uploading them later.
- Nothing is ever deleted or overwritten at this layer. If a cleaning rule downstream turns out to be wrong (Section 7.7), the platform can always reprocess from this untouched source of truth rather than having silently lost the original reading.

### 7.2 Cleaning & Validation Stage

- **Schema/type validation:** every incoming batch is checked against a declarative schema (via **pandera**) — correct types, non-null required fields, values within each parameter's physically valid range (e.g., water level can't be negative or exceed the station's staff-gauge height).
- **Domain-specific rules, applied in order:**
  - *Duplicate detection* — same `(stationId, parameter, deviceTimestamp)` received more than once (common over unreliable links that retry sends); configurable keep-first vs keep-last resolution.
  - *Physically-implausible-value handling* — a reading outside the parameter's valid range is never silently written as "clean" data; it's quarantined with a reason code, never dropped outright, so an admin can review it. This is a deterministic, rule-based rejection — a different, earlier concern than the *statistical* anomaly detection in Section 6.2, which operates only on values that already passed this stage.
  - *Timezone normalization* — every timestamp is converted to UTC at this stage; device-local time (and any daylight-saving quirks) never leaks past here.
  - *Unit normalization* — whatever unit a given sensor model reports in is converted to the platform's canonical unit before storage, so no downstream consumer (chart, model, report) ever has to know a particular station's raw wire format.
- **Output:** a `MeasurementClean` view (or a `qualityFlag` column: `VALID` / `INTERPOLATED` / `QUARANTINED`) that every other part of the platform — dashboards, reports, ML training — reads from instead of the raw table.

### 7.3 Gap Handling & Resampling

- Most models in Section 6 (the SSA forecaster in particular) need an evenly spaced series. Real field data isn't evenly spaced, so this stage resamples to a fixed interval (e.g., 15 min) with an explicit, length-aware gap policy:
  - **Short gaps** (below a configurable number of missed intervals): linear interpolation, flagged `is_interpolated = true`.
  - **Longer gaps:** left as a genuine gap (not fabricated), excluded from training windows and from any confidence-band calculation, and surfaced honestly on the UI.
- This flag travels all the way to the frontend — the Charts page (Section 3.4) renders interpolated segments with a distinct dashed style, so an operator never mistakes a filled gap for an actual reading.
- The expensive part of this — downsampled resolutions for the Charts page's "server-side downsampled resolution" (Section 3.4) — is computed once, at the database layer, using **TimescaleDB continuous aggregates**, and reused by both the dashboard and the AI Service's feature builders rather than recomputed by each consumer separately.

### 7.4 Feature Engineering & the Feature Store (Offline/Online Parity)

- This is where Section 8.1's "Feature Build" pipeline stage is actually implemented in detail. Two separate code paths compute features, and they must produce *identical* results for the same underlying logic, or the model suffers **train/serve skew** (a model that performs well in training but poorly in production because the live features were computed slightly differently than the training features):
  - **Offline/batch build** — pandas/numpy over a full historical window, used when training a model (Section 8.1).
  - **Online/incremental build** — the rolling-window updates that run on every new reading as it streams in (Section 9.3).
- **The fix:** a single shared feature-computation module per feature (e.g., `features/rolling_stats.py`, `features/diurnal_shape.py`) is called from *both* the batch training pipeline and the incremental streaming updater. There is never a second, slightly-different reimplementation of "rolling volatility" living in two places that could silently drift apart.
- **Feature Store schema:** a table (backed by a TimescaleDB continuous aggregate where practical) keyed by `(stationId, parameter, timestamp, featureSetVersion)`, storing the computed rolling stats, seasonal-decomposition inputs, and cluster features that Section 6's models train and infer against. Training and serving both read from this one versioned source — never two.

### 7.5 Data Quality Monitoring (Ongoing, Not Just at Ingestion)

- A scheduled job (same worker infrastructure as retraining, Section 8.2) continuously tracks, per station: validation pass rate, quarantine rate, interpolation rate, and schema-drift events (an unexpected new field appearing in a device payload). A rising quarantine rate is a genuine early warning sign of failing hardware — which is why it's also fed into Predictive Maintenance (Section 6.3) as a feature, not just displayed.
- **UI:** a dedicated **"Data Quality"** admin panel (distinct from the AI Model Health page in Section 8.3 — this one is about the fuel, not the engine) showing per-station pass/quarantine/interpolation rate trends, so a data problem is diagnosed as a data problem rather than misread as a model problem.

### 7.6 Data Retention, Archival & Compression

- **Compression:** TimescaleDB's native compression policy is applied to raw high-frequency measurements older than a configurable age (e.g., 30 days) — this keeps storage costs down for a table with millions of rows without deleting anything.
- **Retention:** full-resolution raw data is kept for a configurable period (e.g., 2 years); beyond that, only the downsampled continuous aggregates (hourly/daily rollups from Section 7.3) are retained. Configurable per deployment from the Admin settings, and ties into the existing data-portability features (Section 4.10).
- This also matters directly for Section 9.2's bulk historical import: an operator loading years of legacy data needs this pipeline to handle the volume in chunked, batched writes without blowing up memory — the same retention/compression policy applies to imported history exactly as it does to live-ingested data.

### 7.7 Data Versioning & Lineage

- Every training run (`MlTrainingRun.datasetRange`, Section 14) is extended conceptually to also record the **`featureSetVersion`** and the **cleaning-ruleset version** used to produce the data it trained on — so a model's full provenance can be reconstructed later: *"this model was trained on data cleaned with ruleset v3, features v2, spanning Jan–Jun 2026."*
- **Why this matters in practice:** if a cleaning rule is later discovered to be wrong (a classic example: a unit-conversion bug that silently corrupted one sensor model's readings for months), lineage is what lets the team identify exactly which promoted models were trained on the affected data and need retraining — rather than discovering the problem only when predictions start looking wrong with no way to trace why.

### 7.8 Where This Fits Against the ML Pipeline

| ML Pipeline Stage (Section 8.1) | Implemented by |
|---|---|
| 1. Extract | Section 7.1 (raw ingestion) + Section 7.2 (cleaning/validation) supply the trustworthy source this stage reads from |
| 2. Feature Build | Section 7.4 in full detail — this section *is* that stage, not a separate concern layered on top |
| 3–7 (Train → Serve) | Unchanged, described fully in Section 8 |

This section doesn't replace the ML training pipeline in Section 8 — it's what makes that pipeline's first two stages rigorous instead of a one-line bullet.

### 7.9 Tooling Summary

| Tool | Use |
|---|---|
| pandera | Declarative schema & data-quality validation rules (Section 7.2) |
| pandas / numpy | Cleaning, resampling, feature transforms (Sections 7.2–7.4) |
| polars (optional) | Drop-in high-throughput alternative to pandas if a very large bulk import (Section 9.2) makes pandas the bottleneck |
| TimescaleDB continuous aggregates | Server-side downsampling, computed once and reused by both the Charts UI and the AI Service's feature builders |
| TimescaleDB compression + retention policies | Storage-efficient long-term archival without manual deletion jobs (Section 7.6) |
| APScheduler / Celery (same worker infra as Section 8.2) | Scheduled data-quality scans (Section 7.5) |

---

## 8. ML Training Pipeline & MLOps (Local, Python)

### 8.1 Pipeline Stages

```text
1. Extract       → pull cleaned, validated measurements/alarms from PostgreSQL (via SQLAlchemy/
                    asyncpg, read/write role scoped to only the tables the AI Service needs) —
                    reads from the output of Section 7.1–7.2, never raw unvalidated data
2. Feature Build  → shared feature-computation modules (Section 7.4) build rolling stats,
                    seasonal decomposition inputs, cluster features
3. Train          → scikit-learn / statsmodels / River pipelines per model type (Section 6),
                    per-station where applicable
4. Evaluate       → hold-out validation (MAE/RMSE via scikit-learn.metrics for regression,
                    ROC-AUC for classification)
5. Register       → save serialized model (joblib `.pkl`, or ONNX via `skl2onnx` for
                    cross-runtime portability) + metrics + featureSetVersion + cleaning-ruleset
                    version (Section 7.7) to Model Registry table + file store
6. Promote        → new model only replaces the in-memory serving model if evaluation metrics
                     meet/exceed a configured minimum threshold (guards against silent regression)
7. Serve          → ForecastModelCache / AnomalyModelCache (in-process caches inside the FastAPI
                    app) reload the promoted models
```

### 8.2 Scheduling (APScheduler / Celery-beat jobs, all local, no external triggers)

| Job | Frequency | Runs in |
|---|---|---|
| Forecasting model retrain (per station/parameter) | Nightly | Python AI Service worker |
| Anomaly detector recalibration | Nightly | Python AI Service worker |
| Predictive maintenance regression retrain | Weekly | Python AI Service worker |
| Station clustering re-run | Weekly | Python AI Service worker |
| Sensor-fault classifier retrain | Weekly (as labeled data accumulates) | Python AI Service worker |
| Focus-station scoring refresh | Daily | Python AI Service worker |
| Data-quality scan (validation pass rate, quarantine rate, schema drift) | Daily | Python AI Service worker (Section 7.5) |
| Report generation, threshold re-evaluation | As previously specified | .NET `WaterTelemetry.Worker` (Quartz.NET, unchanged — non-ML, non-data-engineering jobs stayed in .NET) |

APScheduler is sufficient for a single-instance deployment (in-process scheduler, jobs stored in the same Postgres DB via `SQLAlchemyJobStore` for durability across restarts); if the AI Service is later scaled to multiple replicas, the documented upgrade path is Celery + Redis so only one worker picks up each scheduled job.

### 8.3 Model Registry (in the application database, not a separate MLOps platform)

- Table `MlModel`: `modelId`, `type`, `stationId (nullable)`, `version`, `trainedAt`, `metrics (json)`, `filePath` (a `.pkl`/`.onnx` path), `featureSetVersion`, `cleaningRulesetVersion` (Section 7.7), `status (Candidate/Promoted/Retired)`.
- Every promotion is an audit-logged event (ties into Section 4.5) — the Python service writes the registry row directly to Postgres, and a lightweight event/webhook back to the .NET backend triggers the audit-log entry (or the .NET Api simply reads the registry table itself when rendering the AI Model Health page, no event needed for read-only display).
- `ADMIN` UI page — **"AI Model Health"** — lists every model, its last training date, current metrics, its data lineage (feature/cleaning versions), and a manual "force retrain" trigger (proxied through the AI Gateway to a Python endpoint).

### 8.4 Building the Training Data Set Organically

- The alarm acknowledge/resolve flow (Section 3.5) is the primary organic data-labeling mechanism: an operator resolving an alarm can optionally tag it `Real Event` / `Sensor Fault` / `False Positive` — this single UX addition is what makes Section 6.8's classifier trainable from real operational history rather than needing a separate labeling project.
- Cold-start handling: until enough labeled data exists (configurable minimum sample size per model), the relevant AI widget shows **"Learning in progress — not enough historical data yet"** instead of an unreliable prediction. This is a required UI state, not an edge case.

---

## 9. Data Import & Continuous Learning

> [!important] Requirement this section satisfies
> The platform must not force a choice between "start with a bulk historical dataset" and "keep learning from whatever the field sensors send next." Both paths exist **at the same time**, feed the same Feature Store and Model Registry (Section 8.3), and never block each other. Uploading a ready-made dataset triggers an on-demand bootstrap training run immediately (no waiting for the nightly schedule); meanwhile the normal live-ingestion path keeps preparing and accumulating new data in the background so scheduled retrains stay current. Both paths run through the exact same cleaning/validation/feature pipeline in Section 7 — a bulk import gets no shortcuts around data quality.

### 9.1 Two Parallel Tracks

```text
┌───────────────────────────────┐        ┌───────────────────────────────┐
│  TRACK A — Bulk / Ready-Made    │        │  TRACK B — Continuous / Live    │
│  Data Bootstrap                 │        │  Ingestion                      │
│                                  │        │                                  │
│  Admin uploads CSV/Excel/JSON   │        │  Stations push measurements     │
│  historical export              │        │  as they always do (Section 3)  │
│         │                       │        │         │                       │
│         ▼                       │        │         ▼                       │
│  .NET Api validates + stages    │        │  Ingest → PostgreSQL raw         │
│  rows, forwards to AI Service   │        │  hypertable (Section 7.1)        │
│         │                       │        │         │                       │
│         ▼                       │        │         ▼                       │
│  Same cleaning/validation stage  │        │  Same cleaning/validation stage │
│  as live data (Section 7.2)      │        │  (Section 7.2) + incremental     │
│         │                       │        │  feature-window update           │
│         ▼                       │        │  (Section 7.4, cheap, runs on    │
│  Bulk write to Measurement       │        │  every batch, no full retrain    │
│  table (batched, chunked)       │        │  triggered)                      │
│         │                       │        │         │                       │
│         ▼                       │        │         ▼                       │
│  Feature Build over full         │        │  Waits for its normal            │
│  imported range (batch job,      │        │  APScheduler/Celery schedule     │
│  Section 7.4)                    │        │  (Section 8.2 — nightly/weekly)  │
│         │                       │        │  to retrain                     │
│         ▼                       │        │                                  │
│  ON-DEMAND Train → Evaluate →    │        │                                  │
│  Register → Promote gate         │        │                                  │
│  (same pipeline as Section 8.1,  │        │                                  │
│  just triggered NOW instead of   │        │                                  │
│  waiting on the schedule)        │        │                                  │
└───────────────┬─────────────────┘        └───────────────┬─────────────────┘
                │                                            │
                └──────────────► Shared Feature Store ◄──────┘
                              + Model Registry (8.3), both in Postgres
```

Both tracks write into the same underlying tables — a bootstrapped model is not a separate, throwaway artifact. Once Track A promotes an initial model, Track B's regular nightly/weekly retrains simply pick up where it left off, folding in whatever new data has arrived since.

### 9.2 Track A — Bulk Import & Immediate Bootstrap Training

- **Trigger:** `ADMIN`-only bulk import action, an extension of the existing CSV station import (Section 4.10) to historical *measurements* (and, where available, resolved-alarm labels for the 6.8 classifier).
- **Why "immediate" matters:** Section 8.4's cold-start rule ("Learning in progress — not enough historical data yet") exists because most models need a minimum sample size. If the operator already *has* that history sitting in a spreadsheet from a legacy system, there's no reason to force them through weeks of organic accumulation — the import satisfies the minimum-sample check itself, so the cold-start state can be skipped as soon as the bootstrap run finishes.
- **Pipeline:** runs the exact same 7-stage pipeline as a scheduled retrain (Extract → Feature Build → Train → Evaluate → Register → Promote → Serve), except:
  - It's triggered **on-demand** by the import completing, not by the scheduler.
  - It runs inside the **Python AI Service's own background worker** (Celery task / APScheduler one-off job) — not the .NET Worker — so it never blocks the live API, the dashboard, or the .NET Api process; the operator gets an async job with polling, identical in shape to Report generation (Section 3.6), just proxied by the .NET Api to the Python service.
  - It only trains models for the `(stationId, parameter)` combinations actually covered by the imported data — it doesn't force a full-platform retrain.
- **Safety:** the same Promote gate (Section 8.1, step 6) applies — a bootstrap-trained model still has to meet the minimum evaluation metric to go live; a bad import can't silently push a worse model to production.
- **UI:** "Import Historical Data" panel (AI Model Health admin page) shows upload → validation → staged row count → **"Training now"** progress → **"Promoted"/"Below quality threshold, kept as Candidate"** outcome, with a link to the resulting model's metrics.

### 9.3 Track B — Continuous Preparation From Live Data

- **Trigger:** none — this is always running, unchanged from the platform's normal operation. New measurements arrive via the standard ingestion path (Section 3) exactly as before, whether or not a bulk import has ever happened or is currently in progress.
- **What's new here vs. the base spec:** rather than only computing features at retrain time, each incoming batch of measurements triggers a lightweight **incremental feature-window update** inside the Python AI Service (rolling averages, volatility, diurnal-shape accumulators — Section 7.4) — cheap, no model training involved. This keeps the Feature Store current between scheduled retrains so that when the next nightly/weekly job (Section 8.2) does run, it isn't starting cold. For the streaming anomaly detector (6.2) specifically, River's online `learn_one` call happens on essentially every new reading, so that model is *always* current, not just refreshed at retrain time.
- **Retraining itself stays on schedule** (nightly for forecasting/anomaly, weekly for maintenance/clustering/classifier) — live data doesn't trigger its own ad-hoc retrain, which would risk thrashing the Promote gate with noisy, frequent model swaps. Track A's on-demand trigger is the deliberate exception, reserved for bulk imports specifically.

### 9.4 Running Both at Once Without Collisions

| Concern | Handling |
|---|---|
| Bulk import arrives while live data keeps streaming in | No conflict — Track A only *reads* history to build its training set; Track B's live writes to Measurement/feature tables continue unaffected. |
| A bootstrap run and a scheduled retrain target the same `(stationId, parameter)` model at once | A per-model training lock — a **Postgres advisory lock** keyed on `(stationId, parameter, type)`, chosen specifically because it works correctly even if the AI Service is later scaled to more than one worker process/replica — ensures whichever job started first runs to completion; the other queues rather than racing to write the same `MlTrainingRun`/`MlModel` rows. |
| Operator wants to know which state a model is in | `MlTrainingRun.status` plus a `triggerSource` field (`Scheduled` \| `BulkImport` \| `ManualRetrain`) distinguishes an on-demand bootstrap run from the regular nightly cadence in the AI Model Health page and audit log. |
| Bulk import data overlaps/conflicts with already-ingested live data for the same time range | Import validation (9.2) flags overlapping timestamps per station/parameter and lets the admin choose skip-duplicates vs. overwrite before the batch write proceeds — never silently double-counts a period in the training set. |

### 9.5 API Additions

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/ai/data/bulk-import` (ADMIN) | Upload historical CSV/Excel/JSON; the .NET Api validates/authenticates, then streams it to the Python AI Service, which stages and runs it through the Section 7.2 cleaning pipeline; returns a `jobId` |
| GET | `/ai/data/bulk-import/{jobId}` | Poll status: `Validating → Cleaning → Staged → Training → Promoted / BelowThreshold / Failed`, with row counts, quarantined-row counts, and any validation warnings |
| GET | `/ai/data/bulk-import/{jobId}/conflicts` | List detected overlapping timestamp ranges per station/parameter, with skip/overwrite choice per range |

---

## 10. Python AI Service Architecture

### 10.1 Repository / Solution Structure

```text
ai-service/
├── app/
│   ├── main.py                 # FastAPI app, mounts routers, startup model-cache warmup
│   ├── api/                    # /forecast, /anomalies, /maintenance, /clusters, /triage,
│   │                           #   /reports/summary, /focus-stations, /fault-probability,
│   │                           #   /risk-score, /models, /data/bulk-import  (mirrors Section 13.2)
│   ├── models/                 # per-model training + inference modules
│   │   ├── forecasting.py      # SSA implementation (6.1)
│   │   ├── anomaly.py          # River streaming pipelines (6.2)
│   │   ├── maintenance.py      # scikit-learn regression (6.3)
│   │   ├── clustering.py       # scikit-learn KMeans (6.4)
│   │   ├── alarm_correlation.py# union-find + KMeans (6.5)
│   │   ├── narrative.py        # Jinja2 template engine (6.6)
│   │   ├── focus_stations.py   # pandas scoring (6.7)
│   │   ├── fault_classifier.py # scikit-learn classifier (6.8)
│   │   └── risk_score.py       # deterministic scoring (6.9)
│   ├── data/                   # cleaning, validation, resampling, gap handling (Section 7.1–7.3)
│   ├── registry/                # Model Registry read/write, Promote gate (Section 8.3)
│   ├── features/                # shared feature-computation modules, offline + online (Section 7.4)
│   ├── quality/                  # data-quality scan job + admin panel data (Section 7.5)
│   ├── jobs/                    # APScheduler/Celery task definitions (Section 8.2)
│   ├── db/                      # SQLAlchemy models/session (same Postgres/TimescaleDB instance)
│   ├── auth/                    # verifies the internal service token/mTLS cert from .NET —
│   │                           #   never validates end-user JWTs directly
│   └── schemas/                 # Pydantic request/response models, mirror the .NET DTOs 1:1
├── tests/
├── pyproject.toml               # Poetry/uv-managed dependencies
└── Dockerfile
```

### 10.2 Key Libraries Used

| Library | Use |
|---|---|
| FastAPI | Typed async HTTP service, auto-generated OpenAPI kept in sync with Section 13.2's contract |
| pandera | Declarative schema & data-quality validation (Section 7.2) |
| pandas / numpy / polars (optional) | Cleaning, resampling, feature transforms, report statistics, focus-station scoring (Section 7, 6.6, 6.7) |
| scikit-learn | Clustering (6.4), predictive maintenance regression (6.3), sensor-fault classifier (6.8) |
| statsmodels | SARIMAX fallback + seasonal decomposition helpers feeding the SSA forecaster (6.1) |
| River | Incremental/streaming anomaly & change-point detection (6.2) |
| scipy | Custom SSA forecasting math (6.1) |
| SQLAlchemy + asyncpg | Async, typed access to the same PostgreSQL/TimescaleDB the .NET backend uses |
| Pydantic | Request/response validation, schemas mirrored from the .NET DTOs |
| APScheduler / Celery + Redis | Local job scheduling for retraining and data-quality scans (Section 8.2, 7.5); Celery is the documented upgrade once volume justifies a durable broker |
| joblib / skl2onnx | Model serialization — `.pkl` by default, optional ONNX export for cross-runtime portability |
| pytest | Model evaluation regression tests (metrics must not regress build-over-build, same discipline as before) |

### 10.3 Communication With the .NET Backend

- The Python service is never exposed directly to the internet or to either client — the .NET Api layer remains the only public surface (Section 1's "structurally guaranteed local/no-external-call" property spans two local runtimes and two clients).
- .NET's `WaterTelemetry.AiClient` (Section 11) calls the Python service over an internal HTTP connection on the private network/loopback (gRPC is a documented option if latency profiling later justifies it), authenticated with a short-lived internal service token — separate from end-user JWTs — so the Python service never has to validate user roles itself; the .NET Api layer still performs all role/permission enforcement before proxying.
- Long-running work (bulk import training, Section 9.2) is exposed as an async job with a `jobId`, polled through the same `/ai/data/bulk-import/{jobId}` contract — the .NET Api layer just forwards the poll to Python rather than tracking job state itself.

### 10.4 Deployment

- Runs as its own containerized process, independent of the .NET Api and .NET Worker processes — can be scaled, redeployed, or restarted without affecting core dashboard availability, mirroring the process isolation the original design already called for.
- Connects to the same PostgreSQL/TimescaleDB instance, using a scoped database role limited to the measurement/feature-store/model-registry/data-quality tables it actually needs (least-privilege, not the full application schema).

---

## 11. .NET 10 Backend Architecture

### 11.1 Solution Structure (Clean Architecture)

```text
WaterTelemetry.sln
│
├── src/
│   ├── WaterTelemetry.Domain/            # Entities, value objects, domain events — no dependencies
│   ├── WaterTelemetry.Application/       # Use cases (CQRS via MediatR), interfaces, DTOs, validators (FluentValidation)
│   ├── WaterTelemetry.Infrastructure/    # EF Core, repositories, SignalR hubs, external file storage
│   ├── WaterTelemetry.AiClient/          # Thin internal HTTP client + DTO mapping for the Python AI/
│   │                                     #   Data Service — no ML or data-engineering code lives here,
│   │                                     #   just the gateway
│   ├── WaterTelemetry.Api/               # ASP.NET Core 10 minimal APIs/controllers, auth, DI composition root
│   └── WaterTelemetry.Worker/            # Quartz.NET host: report generation, threshold recompute
│                                         #   (model retraining and data processing now live in the
│                                         #   Python AI Service, Section 8.2 / 7.5)
│
└── tests/
    ├── WaterTelemetry.UnitTests/
    ├── WaterTelemetry.IntegrationTests/  # Testcontainers-based Postgres integration tests
    └── WaterTelemetry.AiClient.Tests/    # Contract tests against the Python service's OpenAPI schema
```

### 11.2 Key .NET 10 Capabilities Used

| Capability | Use |
|---|---|
| Minimal APIs with typed results | Lean, fast endpoint definitions for the Telemetry/AI API surface |
| Native AOT-friendly hosting | Faster cold start for the API and Worker processes |
| `Microsoft.AspNetCore.SignalR` | Real-time hub (`TelemetryHub`) pushing `measurement.update`, `alarm.triggered`, etc. |
| EF Core 10 | Strongly-typed data access, migrations, compiled queries for hot-path measurement queries |
| `HttpClientFactory` + Polly | Resilient internal HTTP client (retry/circuit breaker/timeout policies) powering `WaterTelemetry.AiClient`'s calls to the Python AI Service |
| Quartz.NET | Durable job scheduling for report generation and threshold recompute (no longer for model training or data processing) |
| `FluentValidation` | Request validation at the Application layer boundary |
| `MediatR` | CQRS command/query separation, keeps controllers/endpoints thin |
| Health Checks (`Microsoft.Extensions.Diagnostics.HealthChecks`) | Backing the `/health` status page (Section 4.9), including a check that pings the Python AI Service's own health endpoint |
| `Serilog` | Structured logging, correlated with `traceId` returned in API error envelopes (the same `traceId` is forwarded to the Python service's logs for end-to-end tracing) |

### 11.3 Module Responsibilities

- **Telemetry API Module** — CRUD/query for Stations, Measurements, Alarms (per the REST contract, unchanged).
- **AI Gateway (`WaterTelemetry.AiClient`)** — owns the internal HTTP client to the Python AI Service and the DTO mapping between .NET's contracts and the service's Pydantic schemas; the rest of the API layer only calls into its public interfaces (`IForecastService`, `IAnomalyService`, etc.), which are now thin proxy implementations rather than in-process ML.NET pipelines — this keeps the AI and data-engineering implementation swappable and the public `/ai/*` contract consumed by both clients completely unchanged.
- **Worker** — headless process running Quartz jobs for report generation and threshold re-evaluation only; model retraining and data-quality scheduling have moved entirely to the Python AI Service (Section 8.2, 7.5), so this process is lighter than before and scales independently of AI/data workload.

---

## 12. Client Applications Architecture

The platform has two independently deployable clients over one backend contract. Shared behavior must be defined through generated or hand-maintained TypeScript/C# API contracts, consistent permission claims, and the same SignalR event names. Neither client connects directly to PostgreSQL or the Python AI service.

### 12.1 Avalonia Desktop Architecture — Operator Client

**Project:** `WaterTelemetry.Desktop` (`.NET 10`, `Avalonia UI`, `CommunityToolkit.Mvvm`)

- Target: Windows first, with cross-platform support kept viable for Linux control-room deployments.
- UX: control-room theme, large status indicators, keyboard shortcuts, multi-monitor layout, alarm sounds/toasts, reconnect banner, and fast station switching.
- Screens: Overview, Map, Stations, Charts, Alarms, Reports, Incident Replay, operator annotations, and handover notes.
- Mutations: alarm acknowledge/resolve, operator annotations, handover notes, and other explicitly permitted operational actions.
- Data access: typed REST client plus a single SignalR connection; local encrypted cache is for continuity and never becomes the system of record.
- Structure: `Views/`, `ViewModels/`, `Services/ApiClient`, `Services/SignalR`, `Services/LocalCache`, `Models/`, `Themes/`, and `Resources/`.
- Authentication: desktop login with secure refresh-token storage using the operating system credential store; automatic sign-out on refresh failure.

### 12.2 React + TypeScript Web Architecture — Admin and Viewer Client

**Project:** `WaterTelemetry.Web` (`React`, `TypeScript`, `Vite`)

- Target: modern desktop and tablet browsers; installation is not required.
- `ADMIN` routes: user/role management, station metadata, thresholds, organizations, imports, audit, data quality, model health, and system settings.
- `VIEWER` routes: read-only Overview, Map, Stations, Charts, Alarms, AI insights, and Reports.
- All routes and mutations are protected by server-issued permission claims; the UI additionally hides unavailable actions for clarity.
- Use TanStack Query for server state, Zustand for UI-only state, and `@microsoft/signalr` for live updates.
- Use responsive layouts, Arabic/English localization, RTL support, WCAG 2.1 AA semantics, and browser reconnection handling.

### 12.3 Shared Client Contract and Behavior

- Both clients consume the same REST endpoint names in Section 13 and the same SignalR hub events.
- Both clients display AI confidence, data-quality flags, interpolated values, and service-unavailable states consistently.
- The backend returns `403 Forbidden` for a valid user without the required permission and records denied privileged actions where audit policy requires it.
- Client-specific layout and state are not shared between desktop and web; user preferences are shared only when explicitly represented in the backend data model.

### 12.4 React Features Deliberately Used

| Feature | Where it's used |
|---|---|
| `useActionState` | Report generation form, threshold editor, alarm acknowledge form — built-in pending/error state without manual `useState` wiring |
| `useOptimistic` | Alarm acknowledge button — UI updates instantly, reconciled when the server confirms via SignalR/REST |
| `use()` hook | Reading Suspense-friendly data (station detail, forecast) directly in components without extra data-fetching boilerplate |
| Actions (form `action` prop) | Threshold editor and settings forms submit via native form Actions, simplifying the mutation flow |
| Improved Suspense/streaming | Route-level code splitting with meaningful per-page skeletons (Overview loads independently of Charts' heavier chart library) |

### 12.5 State & Data Layer

- **TanStack Query** for all server state (stations, measurements, alarms, AI outputs) — same isolation principle as before: no component fetches directly, everything through typed hooks.
- **SignalR client** (`@microsoft/signalr`) wrapped in a single `signalrClient.ts`, feeding live events into the TanStack Query cache exactly as before.
- **Zustand** for UI-only state (selected filters, dashboard builder layout, command palette open state).

### 12.6 Component Architecture

```text
pages/            → route-level (Overview, Map, Stations, Charts, Alarms, Reports, Admin/*)
components/
  ui/              → StatusBadge, DataTable, Card, Skeleton, EmptyState, AiBadge
  features/        → StationTable, AlarmList, LevelChart, StationMap, ForecastOverlay,
                       AnomalyBadge, SmartAlarmView, HealthForecastWidget, RiskScoreBadge,
                       FocusStationsPanel, DashboardBuilder, TimelineScrubber, CommandPalette,
                       DataQualityPanel
hooks/             → useOverview, useStations, useAlarms, useForecast, useAnomalies,
                       useMaintenancePredictions, useAlarmTriage, useRiskScore, useDataQuality
services/
  telemetryService.ts
  aiService.ts     → typed client for all /ai/* endpoints — completely unchanged by the backend
                       swap, since it still talks to the same .NET Api contract, not to Python directly
  signalrClient.ts
store/             → uiStore.ts (Zustand)
```

### 12.7 AI UI Consistency Rules (binding for both clients)

- Every AI-derived value renders through a shared `<AiBadge confidence="..." />` — since these models are locally-trained statistical/ML outputs (not generative text), confidence is always a numeric score (e.g., R² for forecasts, class probability for the fault classifier) shown transparently.
- Every AI widget has a defined loading/"learning in progress"/error state (Section 8.4 cold-start handling is a first-class UI state, not an afterthought). This now also covers the (rare) case where the Python AI Service itself is unreachable — a distinct "AI temporarily unavailable" state, never confused with "still learning."
- Interpolated/gap-filled chart data (Section 7.3) is always visually distinct from real readings — never presented identically.

---

## 13. Full API Contract (Core + AI)

### 13.1 Core Telemetry Endpoints (unchanged)

`GET /overview`, `GET /stations`, `GET /stations/{id}`, `GET /stations/{id}/measurements`, `GET /alarms`, `PATCH /alarms/{id}/acknowledge`, `POST /reports`, `GET /reports/{id}`.

### 13.2 AI & Data Endpoints (public contract unchanged — served by the .NET Api, proxied to the Python AI Service)

| Method | Endpoint | Backed by |
|---|---|---|
| GET | `/ai/forecast/{stationId}?parameter=&horizon=` | Section 6.1 (SSA forecasting, Python) |
| GET | `/ai/anomalies?stationId=` | Section 6.2 (River streaming detection, Python) |
| GET | `/ai/maintenance/predictions` | Section 6.3 (scikit-learn regression, Python) |
| GET | `/ai/stations/clusters` | Section 6.4 (scikit-learn K-Means, Python) |
| POST | `/ai/alarms/triage` | Section 6.5 (correlation clustering, Python) |
| GET | `/ai/reports/{reportId}/summary` | Section 6.6 (template engine, Python) |
| GET | `/ai/focus-stations` | Section 6.7 (scoring, Python) |
| GET | `/ai/alarms/{alarmId}/fault-probability` | Section 6.8 (classifier, Python) |
| GET | `/ai/risk-score?stationId=` or `?region=` | Section 6.9 (composite scoring, Python) |
| GET | `/ai/models` (ADMIN) | Section 8.3 (model registry, Python-owned, .NET-rendered) |
| POST | `/ai/models/{modelId}/retrain` (ADMIN) | Manual retrain trigger, proxied to Python |
| POST | `/ai/data/bulk-import` (ADMIN) | Section 9.2 (bulk import + bootstrap training, Python) |
| GET | `/ai/data/bulk-import/{jobId}` | Section 9.2 (job status polling) |
| GET | `/ai/data/quality` (ADMIN) | Section 7.5 (data-quality panel metrics, Python) |

Neither client sees this internal change — the Avalonia API client and web `aiService.ts` hit the same `/ai/*` paths on the .NET Api; the .NET `WaterTelemetry.AiClient` module (Section 11.3) is the only application-facing piece that knows inference, data cleaning, and feature engineering happen in Python.

**Example — `GET /ai/anomalies?stationId=b3f1...`**
```json
{
  "data": [
    {
      "stationId": "b3f1...",
      "reasonCode": "FLATLINE",
      "score": 0.94,
      "detectedAt": "2026-08-12T14:00:00Z",
      "windowMinutes": 312
    }
  ]
}
```

**Example — `GET /ai/alarms/{alarmId}/fault-probability`**
```json
{
  "alarmId": "a771...",
  "faultProbability": 0.08,
  "label": "LIKELY_REAL_EVENT",
  "contributingFactors": [
    { "factor": "rateOfChange", "value": 0.42, "weight": "HIGH" },
    { "factor": "upstreamCorrelation", "value": 0.81, "weight": "HIGH" },
    { "factor": "batteryHealth", "value": "NORMAL", "weight": "LOW" }
  ]
}
```

**Example — `GET /ai/data/quality?stationId=b3f1...`**
```json
{
  "stationId": "b3f1...",
  "validPct": 98.4,
  "interpolatedPct": 1.1,
  "quarantinedPct": 0.5,
  "schemaDriftEvents": 0,
  "windowDays": 30
}
```

### 13.3 SignalR Hub Events

`TelemetryHub` methods pushed to clients: `MeasurementUpdated`, `StationStatusChanged`, `AlarmTriggered`, `AlarmResolved`, `AnomalyDetected` (now sourced from the Python service via the AI Gateway, published to SignalR by .NET), `ModelPromoted` (admin-only channel, for the AI Model Health page).

---

## 14. Data Model (Application + ML)

```text
Station, Measurement, Alarm            → unchanged core entities (see base spec Section 4/7)

User, Role, Session                    → auth/platform
AuditLogEntry                          → immutable action log
Notification, NotificationPreference   → Section 4.3
Organization                           → multi-tenancy scoping (Section 4.6)
DashboardLayout                        → per-user widget builder config (Section 5.10)
ChartAnnotation                        → Section 5.9
StationCollaborationNote               → Section 4.12

MeasurementRaw      (stationId, parameter, deviceTimestamp, ingestionTimestamp, rawValue,
                     rawUnit)                             ← Section 7.1, append-only, never edited
MeasurementClean    (stationId, parameter, timestamp, value, qualityFlag: Valid|Interpolated|
                     Quarantined, quarantineReason?)       ← Section 7.2/7.3
FeatureStoreEntry   (stationId, parameter, timestamp, featureSetVersion, features json)
                                                            ← Section 7.4, offline+online parity
DataQualityLog      (stationId, windowStart, windowEnd, validPct, interpolatedPct,
                     quarantinedPct, schemaDriftEvents)     ← Section 7.5

MlModel            (modelId, type, stationId?, version, trainedAt, metrics json,
                     filePath [.pkl/.onnx], featureSetVersion, cleaningRulesetVersion,
                     status)                                ← written by the Python AI Service
MlTrainingRun       (runId, modelId, startedAt, finishedAt, datasetRange, metrics json,
                     status, triggerSource)                 ← Scheduled | BulkImport | ManualRetrain
AlarmLabel          (alarmId, label: RealEvent|SensorFault|FalsePositive, labeledBy, labeledAt)
StationCluster      (stationId, clusterId, assignedAt, clusterProfile)
FocusStationScore   (userId, stationId, score, computedAt)
```

All of these tables live in the same PostgreSQL/TimescaleDB instance; both the .NET backend (via EF Core) and the Python AI Service (via SQLAlchemy) read/write them, with each side's database role scoped to only the tables it needs. `MeasurementRaw` is written only by the ingestion path; `MeasurementClean` and everything below it in the list is written only by the Python AI Service's data-processing pipeline (Section 7).

---

## 15. Security & Performance for Local AI

| Concern | Approach |
|---|---|
| Model file storage | `.pkl`/`.onnx` model artifacts stored on local disk within the Python AI Service's own container/volume (or an internal object store), never uploaded externally; access restricted to the AI Service process identity |
| Service-to-service auth | Internal HTTP calls between the .NET Api and the Python AI Service use short-lived internal service tokens (or mTLS) on the private network only — never routable from the public internet, and never carrying end-user credentials directly |
| Inference latency | All models are lightweight (custom SSA, River online models, K-Means, small gradient-boosted trees) — sub-50ms inference is expected in-process within the Python service; no GPU or external compute needed |
| Resource isolation | Training jobs, data-quality scans, and feature-store maintenance all run in the Python AI Service's own background worker (Celery/APScheduler), a separate process/container from both the .NET Api and .NET Worker, so heavy nightly work never impacts live dashboard responsiveness |
| Model regression guard | Section 8.1 "Promote" gate prevents a newly trained model with worse metrics from ever reaching production inference |
| Data privacy | All training data is the platform's own operational telemetry — no third-party data leaves the network boundary at any point; the Python service has no outbound internet access by network policy |
| Raw data integrity | `MeasurementRaw` (Section 7.1) is append-only and never modified, giving an audit-safe source of truth independent of any cleaning-rule change |
| Auditability | Every model promotion, manual retrain trigger, and bulk data import is an audit log entry (Section 4.5), and every AI endpoint response includes enough metadata (`contributingFactors`, `score`) to be independently verified against raw data — data lineage (Section 7.7) extends this all the way back to which cleaning ruleset and feature version a model was trained on |

---

## 16. Project Structure

```text
water-telemetry/
├── backend/                     # .NET 10 solution (Section 11) — core platform, no ML/data code
│   └── (WaterTelemetry.Domain / Application / Infrastructure / AiClient / Api / Worker)
│
├── desktop/                     # Avalonia .NET 10 operator application (Section 12.1)
│   └── WaterTelemetry.Desktop/
│       ├── Views/
│       ├── ViewModels/
│       ├── Services/{ApiClient,SignalR,LocalCache}/
│       ├── Models/
│       ├── Themes/
│       └── Resources/
│
├── web/                         # React + TypeScript admin/viewer application (Section 12.2)
│   └── src/
│       ├── pages/
│       ├── components/{ui,features}/
│       ├── hooks/
│       ├── services/
│       ├── store/
│       ├── types/
│       ├── constants/
│       └── main.tsx
│
├── ai-service/                  # Python FastAPI service (Section 10) — all ML + data-engineering code
│   └── (see Section 10.1 for internal layout, including the data/ and features/ modules from Section 7)
│
└── tests/
    ├── desktop/                 # Avalonia view-model and client integration tests
    ├── web/                     # React component and browser integration tests
    └── end-to-end/              # role-based tests against the .NET API
```

---

## 17. Phased Roadmap

```text
Phase 0 — Foundation
  .NET 10 solution scaffold, EF Core schema, Avalonia desktop shell, React/TypeScript web shell,
  Auth, role policies, and SignalR wiring
  Core clients: operator desktop plus admin/viewer web pages for Overview, Stations, Map, Charts,
  Alarms, and Reports (non-AI, fully functional)

Phase 1 — Platform Completeness
  Notifications, Settings/Personalization, Audit Log, Command Palette, desktop/web offline resilience,
  Multi-tenancy scaffolding, i18n/RTL, Onboarding tour

Phase 2 — Data Engineering Foundation
  Python AI Service (FastAPI) scaffold, wired to .NET via the WaterTelemetry.AiClient gateway
  Raw ingestion layer + cleaning/validation (7.1–7.2), resampling/gap handling (7.3),
  Feature Store with offline/online parity (7.4), data-quality scanning (7.5)
  This phase ships before any model training, since every model in Phase 3+ depends on it

Phase 3 — AI Foundation
  Model Registry + APScheduler retraining jobs (Section 8)
  Forecasting (6.1) + Anomaly Detection (6.2) — the two highest-value, most tractable models first
  Bulk Data Import & Bootstrap Training (9.2) ships alongside these so deployments with existing
  historical exports skip the organic cold-start wait from day one; continuous live-data preparation
  (9.3) is already running by default and needs no separate phase

Phase 4 — AI Depth
  Predictive Maintenance (6.3), Station Clustering (6.4), Alarm Correlation (6.5),
  Narrative Summaries (6.6), Focus Stations (6.7)

Phase 5 — AI Maturity
  Sensor-Fault Classifier (6.8) — requires accumulated labeled data from 8.4 —
  Composite Flood-Risk Score (6.9), AI Model Health admin page, data lineage reporting (7.7)

Phase 6 — Creative/Experience Layer
  Digital Twin Flow View, Control Room theme, Incident Replay, Dashboard Builder,
  Comparative Station Cards, Timeline Scrubber
```

Each phase is independently demoable and shippable; the data-engineering and AI phases (2–5) never block core platform usability, since every AI widget has a defined graceful/"learning in progress" fallback state.

---

## 18. Complete Feature Checklist

**Core Monitoring**
- [ ] Overview with live KPIs, focus stations, attention-soon list
- [ ] Map: pins, clustering, flow view, weather overlay, region draw tool
- [ ] Stations: list, detail, comparative cards, bulk actions, metadata editor
- [ ] Charts: forecast overlay, annotations, multi-parameter overlay, interpolated-gap styling, export
- [ ] Alarms: smart view clustering, fault-probability badge, acknowledge flow with labeling
- [ ] Reports: async generation, narrative summary, scheduling, history library

**Platform**
- [ ] Auth (JWT, roles, MFA), user management
- [ ] Settings, theming (incl. Control Room), dashboard builder
- [ ] Notification center + preferences + push
- [ ] Command palette, global search, keyboard shortcuts
- [ ] Audit log + viewer
- [ ] Multi-tenancy scoping
- [ ] i18n/RTL + accessibility (WCAG 2.1 AA)
- [ ] Avalonia desktop offline cache and reconnection flow
- [ ] React web read-only cache and reconnection flow
- [ ] Status/health page
- [ ] Data export/import
- [ ] Onboarding tour + changelog panel
- [ ] Snapshot sharing + collaboration notes

**Data Processing & Data Engineering**
- [ ] Raw, append-only ingestion hypertable separate from cleaned data (Section 7.1)
- [ ] Schema/type/range validation via pandera, quarantine (not silent drop) of invalid readings (7.2)
- [ ] Duplicate detection, timezone normalization, unit normalization (7.2)
- [ ] Gap-aware resampling with interpolation flagging, distinct chart styling for filled gaps (7.3)
- [ ] TimescaleDB continuous aggregates for shared downsampling (7.3)
- [ ] Feature Store with shared offline/online feature-computation modules (7.4)
- [ ] Data-quality monitoring job + admin "Data Quality" panel (7.5)
- [ ] TimescaleDB compression + configurable retention policy (7.6)
- [ ] Data/model lineage — featureSetVersion + cleaningRulesetVersion on every trained model (7.7)

**Local Custom AI (Python)**
- [ ] Forecasting (custom SSA in numpy/scipy, statsmodels SARIMAX fallback) per station/parameter
- [ ] Anomaly/spike/change-point detection (River streaming models + ruptures) + flatline monitor
- [ ] Predictive maintenance regression (scikit-learn)
- [ ] Station behavior clustering (scikit-learn K-Means)
- [ ] Alarm correlation clustering + root-cause template rationale
- [ ] Deterministic narrative report summaries (Jinja2 templates)
- [ ] Focus-station scoring (pandas)
- [ ] Sensor-fault vs real-event classifier + alarm labeling UX
- [ ] Composite flood-risk scoring engine
- [ ] Model Registry, promotion gate, AI Model Health admin page
- [ ] APScheduler/Celery retraining schedule for every model
- [ ] Bulk historical data import with on-demand bootstrap training (Section 9.2)
- [ ] Continuous incremental feature-window updates from live ingestion (Section 9.3)
- [ ] Per-model Postgres advisory lock so bootstrap and scheduled retrains never collide (Section 9.4)
- [ ] Python AI Service deployed independently (FastAPI, containerized, internal-network-only access)
- [ ] `WaterTelemetry.AiClient` gateway in .NET — resilient HTTP client, zero ML/data code

---
#telemetry #dashboard #dotnet10 #react19 #python #fastapi #scikit-learn #data-engineering #local-ai #custom-models #production-ready
