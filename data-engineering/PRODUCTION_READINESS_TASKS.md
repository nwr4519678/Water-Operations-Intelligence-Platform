# Data Engineering - Production Readiness Hierarchical Backlog

**Scope:** Data-engineering work for forecasting (Section 6.1) and anomaly/spike detection (Section 6.2).  
**Audit date:** 2026-08-26  
**Planning rule:** exactly **12 parent tasks**; all details below are subtasks and are not separate top-level tasks.

**Detailed execution register:** The owner/input/output/dependency/risk, artifact, acceptance, and verification detail for every subtask ID is included in this file below.

## Status legend

- `[ ]` Not complete.
- `[~]` Partial; a foundation or demo exists but production evidence is missing.
- `[x]` Complete; implementation and applicable verification are evidenced.

## Current audit summary

| Parent | Status | Current evidence |
|---|---|---|
| P01 Architecture and package organization | `[~]` | Package, pipelines, configs, and tests exist, but responsibilities are still flat. |
| P02 Raw ingestion and replayable source layer | `[~]` | USGS extraction and raw JSON outputs exist; contracts, reliability, manifests, and replay are missing. |
| P03 Cleaning, validation, normalization, quarantine | `[~]` | Sentinel handling, UTC parsing, and some conversions exist; canonical rules/tests are missing. |
| P04 Resampling and gap policy | `[~]` | Hourly pandas resampling exists; configurable safe gap handling is missing. |
| P05 Feature store and offline/online parity | `[ ]` | No feature store, online builder, versioning, or parity test exists. |
| P06 Quality monitoring and lineage | `[~]` | Batch reports exist; scheduled scans, drift, logs, manifests, and lineage are missing. |
| P07 Storage, retention, security, and performance | `[ ]` | No production persistence, Timescale policies, role proof, or latency evidence exists. |
| P08 Jobs, scheduling, and concurrency | `[ ]` | No durable scheduler, worker jobs, advisory locks, or collision tests exist. |
| P09 Historical import / Track A | `[~]` | A pump RUL CSV demo exists; telemetry import and bootstrap workflow are missing. |
| P10 Live preparation / Track B and cold start | `[ ]` | No incremental features, learner handoff, retrain guard, or cold-start contract exists. |
| P11 Data-owned API and ML registry handoff | `[ ]` | No quality/import API, OpenAPI contract, registry adapter, or lineage query exists. |
| P12 Verification, observability, and production gate | `[ ]` | Only a placeholder test exists; production evidence is missing. |

---

## P01 - Architecture and specialized package organization `[~]`

**Outcome:** Every responsibility has one owner, orchestration is thin, and a
new engineer can find code without inspecting implementation details.

- [ ] Create the canonical `data-engineering/` layout:
  `src/water_operations_data/`, `pipelines/`, `data/`, `configs/`, `tests/`,
  `docs/`, and `scripts/`.
- [ ] Divide `src/water_operations_data/` into specialized packages:
  `contracts`, `config`, `ingestion`, `validation`, `normalization`,
  `resampling`, `features`, `quality`, `imports`, `storage`, `lineage`,
  `application`, and `common`.
- [ ] Divide each package further by responsibility: `ingestion` into
  `adapters/readers/request/reliability/manifests`; `validation` into
  `schema/rules/duplicates/quarantine/ordering/reports`; `normalization` into
  `timestamps/units/identifiers/policies`; and `resampling` into
  `intervals/windows/gaps/interpolation/aggregation`.
- [ ] Divide `features` into `common/rolling/seasonal/offline/online/windows/
  schemas/versioning/parity`.
- [ ] Divide `quality` into `scanners/checks/drift/metrics/thresholds/reports/
  alerts` and `imports` into `contracts/readers/preflight/staging/conflicts/
  chunking/execution/status`.
- [ ] Divide `storage` into `interfaces/postgres/raw/clean/features/quality/
  files/locks` and `lineage` into `manifests/rulesets/datasets/features/runs/
  registry`.
- [ ] Divide `application` into `commands/queries/workflows/policies/ports`
  and keep `common` limited to `errors/logging/time/serialization/typing`.
- [ ] Divide `pipelines` into `commands/extract/prepare/monitor/import/export/
  replay`; pipelines may compose workflows but may not contain domain rules.
- [ ] Divide tests into `unit/integration/regression/security/performance/
  fixtures`, with subfolders matching the production boundaries.
- [ ] Move architecture, contracts, runbooks, provenance, and ADRs under
  `docs/`; keep one canonical document per topic.
- [ ] Map every existing file to exactly one owner and remove duplicate source
  of truth only after imports, commands, CI, Docker, and tests are updated.
- [ ] Enforce dependency direction: `pipelines -> application -> domain/
  contracts`; adapters are injected at the edges; no production import from
  `tests/` or `data/`.
- [ ] Add ownership README files, module docstrings, type annotations, explicit
  imports, architecture checks, and a clean-checkout import smoke test.

## P02 - Raw ingestion and replayable source layer `[~]`

**Outcome:** Raw telemetry is immutable, auditable, and replayable; live raw
writes remain owned by .NET.

- [ ] Define `MeasurementRaw` with station, parameter, device timestamp,
  ingestion timestamp, raw value, and raw unit.
- [ ] Document the boundary: .NET writes live raw data; data engineering reads
  it and owns downstream preparation; bulk imports use a separate path.
- [ ] Isolate USGS, CSV, JSON, and Excel adapters under `ingestion/adapters/`;
  readers only parse and return typed records.
- [ ] Validate station IDs, time windows, parameters, pagination, and source
  limits before network/file access.
- [ ] Add timeout, retry/backoff, rate-limit handling, user-agent, and clear
  failure logging; declare all runtime dependencies in `pyproject.toml`.
- [ ] Create immutable manifests containing source query, retrieval time,
  checksum, schema fingerprint, row count, time range, and run ID.
- [ ] Store raw payloads under source/station/date/run paths and never silently
  overwrite a raw payload.
- [ ] Capture device-vs-ingestion lag for clock-drift and buffered-upload use.
- [ ] Review Timescale hypertable chunking/partitioning with backend owners.
- [ ] Enforce append-only permissions; AI/data-engineering access to
  `MeasurementRaw` must be read-only.
- [ ] Prove ruleset changes can replay from raw without data loss.

## P03 - Cleaning, validation, normalization, and quarantine `[~]`

**Outcome:** Downstream consumers receive canonical data and every rejection is
reviewable with a stable reason code.

- [ ] Define a declarative schema for columns, types, nullability, parameters,
  and station/parameter physical ranges.
- [ ] Enforce the exact order: schema/type -> duplicates -> physical quarantine
  -> timezone normalization -> unit normalization.
- [ ] Detect duplicates on `(stationId, parameter, deviceTimestamp)` with
  configurable keep-first/keep-last and conflict metrics.
- [ ] Add stable reasons for invalid timestamp/value, sentinel, duplicate,
  out-of-range, unsupported unit, and schema drift.
- [ ] Keep deterministic quarantine separate from statistical anomaly output;
  anomaly models receive only eligible clean records.
- [ ] Normalize device-local timestamps/DST to UTC while retaining source-time
  metadata for audit.
- [ ] Build a versioned canonical unit registry and convert all supported units.
- [ ] Produce `MeasurementClean` with `Valid|Interpolated|Quarantined`, value,
  canonical unit, nullable `quarantineReason`, and source/run lineage.
- [ ] Persist quarantined rows separately; never silently drop or chart them as
  clean data.
- [ ] Add rule-level and end-to-end tests for duplicates, sentinels, ranges,
  nulls, bad schemas, mixed timezones, and mixed units.

## P04 - Fixed-interval resampling and safe gap policy `[~]`

**Outcome:** Forecasting receives evenly spaced data without fabricated long
outages, and interpolation remains visible to consumers.

- [ ] Make interval configurable per deployment with a validated default such
  as 15 minutes and explicit supported values.
- [ ] Define parameter-aware aggregation: mean, sum, last, or no aggregation.
- [ ] Classify short internal gaps versus genuine long outages using a
  configurable missed-interval threshold.
- [ ] Interpolate only bounded short gaps and emit `is_interpolated=true` and
  `qualityFlag=Interpolated`.
- [ ] Preserve long gaps as missing; never fill with zeros; exclude them from
  training windows and confidence calculations.
- [ ] Expose gap/interpolation metadata to downstream consumers separately from
  statistical anomaly flags.
- [ ] Build Timescale continuous aggregates, refresh rules, and indexes for
  supported resolutions.
- [ ] Make feature builders reuse the same aggregate definitions to prevent
  train/serve downsampling skew.
- [ ] Test sparse history, long outages, duplicates, DST boundaries, and clock
  drift/ingestion lag.

## P05 - Versioned feature store and offline/online parity `[ ]`

**Outcome:** Historical and incremental paths use one shared feature definition.

- [ ] Define `FeatureStoreEntry` keyed by station, parameter, timestamp, and
  `featureSetVersion`, with typed JSON, null policy, and indexes.
- [ ] Implement shared rolling mean, variance, volatility, missingness, change,
  and flatline duration/window features.
- [ ] Implement diurnal/seasonal shape and seasonality-strength diagnostics for
  downstream SSA/SARIMAX routing.
- [ ] Implement offline historical builds for nightly forecasting and anomaly
  recalibration.
- [ ] Implement online updates for every new clean reading without retraining.
- [ ] Define lookback windows, leakage boundaries, warm-up behavior, and how
  interpolated/long-gap values affect features.
- [ ] Define feature version bump rules and persist versions in every feature
  and run record.
- [ ] Keep feature calculations free of database logic; use a repository edge.
- [ ] Add automated offline/online parity tests for identical inputs,
  outputs, nulls, timestamps, and metadata.
- [ ] Add feature lookup performance tests against the serving latency budget.

## P06 - Quality monitoring and complete lineage `[~]`

**Outcome:** Data issues are diagnosed as data issues and every output is
traceable to source, ruleset, feature version, and run.

- [ ] Build per-station/window scans for valid, interpolated, quarantined,
  missing, freshness, continuity, and schema-drift rates.
- [ ] Detect unexpected fields, removed fields, type changes, parameter drift,
  and unit drift with stable event details.
- [ ] Persist `DataQualityLog` with station/window/rates/drift/run fields.
- [ ] Separate machine-readable metrics from deterministic JSON/Markdown/CSV
  report renderers.
- [ ] Add configurable thresholds and degradation events; do not feed quality
  metrics into out-of-scope predictive maintenance features.
- [ ] Create immutable input/output manifests for extraction, cleaning,
  resampling, feature builds, and imports.
- [ ] Stamp `cleaningRulesetVersion` and `featureSetVersion` on every relevant
  processing/training run, not only bootstrap runs.
- [ ] Define version-bump triggers and query affected datasets/models by version.
- [ ] Persist source scope, date range, row counts, quarantine counts, warnings,
  and checksums for every run.

## P07 - Storage, retention, security, and performance `[ ]`

**Outcome:** Persistence is explicit, least-privilege, auditable, and safe at
production volume.

- [ ] Add repository interfaces and PostgreSQL/Timescale adapters for
  `MeasurementClean`, `FeatureStoreEntry`, and `DataQualityLog`.
- [ ] Keep `MeasurementRaw` read-only and prohibit update/delete from all
  downstream repositories.
- [ ] Add migrations, indexes, transaction boundaries, and ownership docs for
  station/parameter/timestamp/version/run queries.
- [ ] Provision and test a least-privilege role; prove denial of unrelated
  schema access.
- [ ] Configure compression for aged high-frequency raw data and retention for
  full-resolution versus aggregate-only data.
- [ ] Apply identical policy to live and imported data; test reads across
  compression and retention boundaries.
- [ ] Keep runtime data/artifacts under a configured volume/root, never beside
  source code by implicit relative paths.
- [ ] Ignore runtime data by default and keep only approved small fixtures in
  Git; classify current generated outputs before release.
- [ ] Add path-boundary, secret-scan, raw-read-only, network-egress, and safe
  serialization checks.
- [ ] Benchmark ingestion, imports, feature fetch, reports, and DB queries
  against documented limits.

## P08 - Durable jobs, scheduling, and concurrency `[ ]`

**Outcome:** Scheduled and on-demand work is restart-safe, observable,
idempotent, and safe across replicas.

- [ ] Configure APScheduler with SQLAlchemyJobStore for nightly forecast
  retraining, nightly anomaly recalibration, and daily quality scans.
- [ ] Define job IDs, schedules/timezones, retries, backoff, timeouts,
  cancellation, idempotency, progress, and failure states.
- [ ] Run long jobs outside the live API process and persist counters/logs/errors.
- [ ] Add a PostgreSQL advisory lock keyed by station, parameter, and model type.
- [ ] Add `triggerSource`: `Scheduled`, `BulkImport`, `ManualRetrain`.
- [ ] Test locks across worker replicas and load-test bulk versus scheduled
  collisions for both model types.
- [ ] Document the Celery/Redis scale-out path and single-job ownership.
- [ ] Prove jobs can resume/replay from immutable manifests without raw mutation.

## P09 - Historical import and Track A bootstrap `[~]`

**Outcome:** Historical measurement imports are staged, safe, conflict-aware,
bounded in memory, and handed to ML without blocking live work.

- [ ] Support historical measurement CSV/JSON/Excel; keep pump RUL demo input
  separate from telemetry imports.
- [ ] Add preflight for type, encoding, size, columns, row limits, station,
  parameter, timezones, units, and duplicate keys.
- [ ] Stage every import under a unique job/run ID before writing anything.
- [ ] Route imports through the exact live cleaning/normalization/quarantine/
  resampling contract.
- [ ] Add bounded-memory chunking and transactional batch writes.
- [ ] Detect overlaps with live data and require explicit skip/overwrite choice.
- [ ] Persist conflicts, decisions, warnings, counts, checksums, and manifest.
- [ ] Trigger feature build and scoped bootstrap handoff for affected pairs only.
- [ ] Run bootstrap outside the live API and return a pollable job ID with
  `Validating -> Cleaning -> Staged -> Training -> Promoted/BelowThreshold/Failed`.
- [ ] Apply the same promotion threshold as scheduled retraining.
- [ ] Prove Track B consumes the promoted bootstrap artifact on its next cycle.

## P10 - Continuous live preparation and cold start `[ ]`

**Outcome:** New clean readings keep features/anomaly preparation current,
without uncontrolled retraining, and insufficient history is explicit.

- [ ] Prove live ingestion remains available during imports.
- [ ] Update rolling, volatility, missingness, and diurnal windows per clean
  batch; provide an ML handoff for River `learn_one` without implementing its
  algorithm here.
- [ ] Define eligibility of valid/interpolated/quarantined/long-gap records.
- [ ] Prevent live data from triggering ad-hoc retraining outside deliberate
  Track A/manual commands.
- [ ] Define minimum forecast samples per station/parameter and minimum anomaly
  calibration observations.
- [ ] Define and contract-test `INSUFFICIENT_HISTORY`, valid-result, degraded,
  and unavailable states; null/empty must not masquerade as failure.
- [ ] Test empty and sparse station histories.

## P11 - Data-owned API and ML registry handoff `[ ]`

**Outcome:** Data engineering exposes only owned contracts and supplies
versioned datasets/lineage to .NET and ML.

- [ ] Define `POST /ai/data/bulk-import` for authenticated staging and job ID.
- [ ] Define `GET /ai/data/bulk-import/{jobId}` for states, counts, warnings,
  and failure details.
- [ ] Define `GET /ai/data/bulk-import/{jobId}/conflicts` for ranges and choices.
- [ ] Define `GET /ai/data/quality` with station, rates, drift, freshness, and
  window fields.
- [ ] Keep endpoints stateless/poll-friendly and OpenAPI/schema-tested against
  the .NET `AiClient` contract.
- [ ] Document internal service-token/mTLS; do not validate end-user JWTs here.
- [ ] Populate ML-owned `MlModel`/`MlTrainingRun` fields for type, station,
  version, metrics, path, status, dataset range, feature version, ruleset
  version, and trigger source.
- [ ] Supply a versioned evaluation dataset from the feature store; leave
  model fitting and promotion gate logic to ML engineering.
- [ ] Provide registry-to-manifest/quality-report lineage queries.
- [ ] Keep other AI models, inference endpoints, .NET gateway/auth/SignalR, and
  frontend rendering out of this data-owned scope.

## P12 - Verification, observability, and production gate `[ ]`

**Outcome:** Readiness is proven by repeatable evidence rather than folder
presence or a passing placeholder test.

- [ ] Replace `test_foundation.py::test_placeholder` with layered unit,
  integration, regression, security, and performance suites.
- [ ] Cover every cleaning rule, quarantine reason, timezone/unit rule,
  resampling/gap rule, quality metric, and lineage field.
- [ ] Add deterministic raw -> clean -> quarantine -> resample -> feature -> report
  replay using fixtures and manifests.
- [ ] Add offline/online feature parity and API contract snapshot tests.
- [ ] Test drift, cold start, unavailable state, import conflicts, idempotent
  retries, advisory-lock collisions, and multi-worker behavior.
- [ ] Ensure unit/regression tests never call live external services.
- [ ] Add trace-aware structured logs, DB latency, queue depth, data freshness,
  quality freshness, and model/data freshness health signals.
- [ ] Distinguish unavailable, degraded, cold-start, and healthy states.
- [ ] Build the container from a clean checkout with no secrets, runtime data,
  or unclassified generated outputs.
- [ ] Run at least one full seasonal historical cycle and record quality,
  replay, and latency results.
- [ ] Run nightly forecast retraining, anomaly recalibration, and daily quality
  scans unattended for several consecutive nights.
- [ ] Complete release evidence for security, data classification, DB roles,
  retention/compression, load/collision, performance, lineage, and rollback.

### Final Definition of Done

The workstream is **Production Grade** only when all 12 parents are `[x]` and
evidence proves: immutable replayable raw data; canonical clean/quarantine
outputs; safe long-gap behavior; offline/online feature parity; persisted
quality and lineage; idempotent imports/jobs; concurrency safety; tested API,
cold-start, registry, security, retention, seasonal replay, unattended-run,
multi-worker, and performance behavior.

## Explicitly out of scope

Predictive maintenance, station clustering, alarm correlation, narrative
summaries, focus-station scoring, fault classification, composite flood-risk
scoring, SSA/SARIMAX/River algorithm implementation, .NET gateway/
authentication/SignalR implementation, and frontend rendering.

---

## Detailed execution register

هذا الملف هو سجل التنفيذ التفصيلي للـ12 Parent Tasks في
PRODUCTION_READINESS_TASKS.md. لا يُعتبر أي Subtask مكتملًا بمجرد إنشاء مجلد أو
دالة placeholder؛ يجب توفير الـartifact والاختبار أو دليل التشغيل المذكور.

## قاعدة إغلاق موحدة لكل Subtask

لكل Subtask يجب تسجيل: المالك، المدخلات، المخرجات، dependency، المخاطر، PR أو
commit، اختبار آلي، ومثال تشغيل أو release evidence. أي نتيجة غير قابلة لإعادة
الإنتاج من clean checkout تعتبر غير مكتملة.

---

## P01 - Architecture and specialized package organization

**Goal:** فصل domain rules عن adapters وعن orchestration وعن storage، بحيث يكون
لكل مسؤولية owner واحد واتجاه dependencies واضح.

### P01.S01 - File inventory and ownership matrix

- **Scope:** فهرسة كل ملفات Python وYAML وtests وdocs وruntime outputs وCLI.
- **Inputs:** الشجرة الحالية، CI، Docker، README، وentry points.
- **Deliverable:** ownership matrix يحدد current path، target path، owner،
  action move/split/wrap/retire، imports، side effects، وreplacement date.
- **Acceptance:** كل ملف حالي له target واحد ولا توجد implementation مكررة.
- **Verification:** script يفشل إذا ظهر ملف production غير موجود في الـmatrix.

### P01.S02 - Canonical package boundaries

- **Scope:** إنشاء boundaries متخصصة لـ contracts، config، ingestion،
  validation، normalization، resampling، features، quality، imports، storage،
  lineage، application، common.
- **Rules:** contracts بلا I/O؛ domain transformations بلا network/DB؛ storage
  هو edge الوحيد للـpersistence؛ pipelines لا تحتوي business rules.
- **Deliverable:** architecture document وdependency graph وimport rules.
- **Acceptance:** لا يوجد import ممنوع بين layers.
- **Verification:** architecture/import test من clean environment.

### P01.S03 - Granular folder layout

- **Scope:** تقسيم كل package إلى subfolders متخصصة:
  ingestion adapters/readers/request/reliability/manifests؛ validation
  schema/rules/duplicates/quarantine/ordering/reports؛ normalization
  timestamps/units/identifiers/policies؛ resampling
  intervals/windows/gaps/interpolation/aggregation؛ features
  common/rolling/seasonal/offline/online/windows/schemas/versioning/parity؛
  quality scanners/checks/drift/metrics/thresholds/reports/alerts؛ imports
  contracts/readers/preflight/staging/conflicts/chunking/execution/status؛
  storage interfaces/postgres/raw/clean/features/quality/files/locks؛ lineage
  manifests/rulesets/datasets/features/runs/registry.
- **Deliverable:** final tree diagram وREADME لكل boundary.
- **Acceptance:** كل folder له input/output/side-effect policy.
- **Verification:** tree check وownership review.

### P01.S04 - Pipeline and command migration

- **Scope:** تقسيم pipelines إلى commands/extract/prepare/monitor/import/export/
  replay، ونقل قواعد العمل إلى src.
- **Deliverable:** CLI reference، compatibility table، وdeprecation dates.
- **Acceptance:** commands القديمة المدعومة تنتج نفس fixture outputs.
- **Verification:** replay comparison test.

### P01.S05 - Configuration and runtime boundary

- **Scope:** فصل development/test/production-example، وجعل runtime root
  explicit، ومنع secrets في YAML.
- **Deliverable:** config schema، settings validation، path policy، .gitignore
  و.dockerignore.
- **Acceptance:** كل write داخل WATER_DATA_ROOT أو equivalent.
- **Verification:** path-boundary وsecret-scan tests.

### P01.S06 - Documentation and migration closeout

- **Scope:** تحديث CI وDocker وREADME وrunbooks وADRs وحذف duplicates بعد
  إغلاق references.
- **Deliverable:** migration checklist وADR index وclean-checkout runbook.
- **Acceptance:** engineer جديد يستطيع install ثم fixture replay ثم tests باتباع
  README فقط.
- **Verification:** documented clean-checkout walkthrough.

---

## P02 - Raw ingestion and replayable source layer

**Goal:** Raw data immutable/auditable/replayable مع بقاء live raw writes ملك
للـ.NET.

### P02.S01 - MeasurementRaw canonical contract

- **Scope:** stationId، parameter، deviceTimestamp، ingestionTimestamp،
  rawValue، rawUnit، source، runId، schemaVersion.
- **Deliverable:** versioned schema، nullability/precision rules، contract fixtures.
- **Acceptance:** contract يفرق device time عن ingestion time ويحافظ على source
  metadata.
- **Verification:** valid/malformed/missing/timezone tests.

### P02.S02 - Source adapter protocol

- **Scope:** adapters لـUSGS وCSV وJSON وExcel؛ parser source-specific فقط.
- **Deliverable:** adapter protocol، typed reader result، source error model.
- **Acceptance:** تغيير مصدر لا يغير validation أو domain logic.
- **Verification:** mocked adapter contract suite.

### P02.S03 - Request reliability

- **Scope:** connect/read timeout، bounded retries، exponential backoff،
  retryable status policy، rate limit، user-agent، request duration/logging.
- **Deliverable:** reliability policy وconfiguration.
- **Acceptance:** timeout لا يعلق job؛ retry لا يكرر raw write؛ logs لا تحتوي
  secrets أو payload غير لازم.
- **Verification:** mocked timeout/429/5xx/malformed JSON tests.

### P02.S04 - Immutable raw storage and manifest

- **Scope:** raw path partitioned by source/station/date/run؛ no overwrite؛
  checksum، schema fingerprint، query، retrieval time، row count.
- **Deliverable:** raw payload، manifest، overwrite policy.
- **Acceptance:** manifest يعيد تحديد ما تمت معالجته بالضبط.
- **Verification:** checksum، duplicate run، overwrite-prevention tests.

### P02.S05 - MeasurementRaw role and lag

- **Scope:** hypertable/chunk review، append-only grants، AI role read-only،
  device-to-ingestion lag metric.
- **Deliverable:** SQL grant/revoke، ownership note، lag contract.
- **Acceptance:** insert/update/delete ممنوع على AI role.
- **Verification:** disposable PostgreSQL permission integration test.

### P02.S06 - Raw replay

- **Scope:** replay command يأخذ manifest/run/ruleset ويكتب run namespace جديد
  بدون تعديل raw الأصلي.
- **Deliverable:** replay command، output manifest، row/checksum reconciliation.
- **Acceptance:** تشغيلان على نفس raw ينتجان outputs equivalent.
- **Verification:** end-to-end replay regression test.

---

## P03 - Cleaning, validation, normalization, quarantine

**Goal:** canonical clean records مع quarantine قابل للمراجعة وعدم وجود silent drops.

### P03.S01 - Declarative schema

- **Scope:** fields/types/nullability/enums/parameter-unit combinations/precision.
- **Deliverable:** pandera أو equivalent schema، schemaVersion، row errors.
- **Acceptance:** malformed row له field وreason ولا يختفي.
- **Verification:** field-by-field tests وknown-bad payload integration test.

### P03.S02 - Required validation order

- **Scope:** schema/type ثم duplicates ثم physical quarantine ثم timezone ثم
  units، وعدم السماح بتغيير الترتيب بدون version bump.
- **Deliverable:** pipeline orchestrator وorder test.
- **Acceptance:** كل stage يستهلك output stage السابقة فقط.
- **Verification:** spy/trace test يثبت order.

### P03.S03 - Duplicate policy

- **Scope:** natural key station/parameter/deviceTimestamp؛ keep-first/keep-last؛
  exact duplicate مقابل conflicting value.
- **Deliverable:** duplicate policy config، conflict record، counters.
- **Acceptance:** السلوك deterministic ومفهوم للمشغل.
- **Verification:** burst/order/conflict tests.

### P03.S04 - Physical range and sentinel rules

- **Scope:** sentinel values، station/parameter ranges، boundary values،
  unsupported measurement values.
- **Deliverable:** range registry، reason-code catalog، quarantine schema.
- **Acceptance:** لا invalid value تصل clean؛ كل rejected row لها original value
  وreason.
- **Verification:** sentinel/negative/overflow/NaN/boundary tests.

### P03.S05 - Timestamp normalization

- **Scope:** UTC، DST، naive timestamps، mixed offsets، impossible time policy،
  source timestamp retention.
- **Deliverable:** timestamp policy وnormalized contract.
- **Acceptance:** downstream timestamps UTC فقط.
- **Verification:** DST/mixed-offset/invalid timestamp golden tests.

### P03.S06 - Unit normalization

- **Scope:** canonical unit registry، source-to-target conversion، precision،
  unsupported/ambiguous unit rejection، registry version.
- **Deliverable:** conversion registry وconversion report.
- **Acceptance:** no consumer needs to know sensor wire unit.
- **Verification:** mixed-unit golden tests and conversion boundary tests.

### P03.S07 - MeasurementClean output

- **Scope:** qualityFlag Valid/Interpolated/Quarantined، quarantineReason،
  source/run/ruleset lineage، uniqueness.
- **Deliverable:** table/schema/repository contract.
- **Acceptance:** clean + quarantine reconcile input under documented duplicate
  selection policy.
- **Verification:** end-to-end known-bad batch test.

---

## P04 - Fixed interval resampling and gap policy

**Goal:** evenly spaced model-ready series without fabricating long outages.

### P04.S01 - Interval configuration

- **Scope:** allowed intervals، default، UTC bucket alignment، incomplete bucket
  behavior.
- **Deliverable:** interval schema/config and command option.
- **Acceptance:** same input/config gives same bucket boundaries.
- **Verification:** boundary/DST/sparse tests.

### P04.S02 - Aggregation rules

- **Scope:** mean/sum/last/no aggregation per parameter؛ missing values policy.
- **Deliverable:** parameter aggregation registry.
- **Acceptance:** aggregation choice versioned and reused by all paths.
- **Verification:** reference dataframe comparison.

### P04.S03 - Gap classification

- **Scope:** expected interval count؛ short internal، leading/trailing، long
  outage؛ gap start/end/duration/reason.
- **Deliverable:** gap-event contract.
- **Acceptance:** every missing range classified؛ long gaps remain missing.
- **Verification:** one-step/multi-step/leading/trailing/long outage tests.

### P04.S04 - Bounded interpolation

- **Scope:** internal short gaps only؛ interpolation flag/method/endpoints؛
  eligibility impact.
- **Deliverable:** resampled output schema and interpolation policy.
- **Acceptance:** long outage never becomes zero or fabricated value.
- **Verification:** golden series and training-window eligibility tests.

### P04.S05 - Continuous aggregates

- **Scope:** Timescale aggregate definitions، refresh windows، indexes، freshness.
- **Deliverable:** migration/config/query plan.
- **Acceptance:** feature builders use same aggregate definition.
- **Verification:** aggregate-vs-pandas/reference comparison and freshness test.

---

## P05 - Versioned feature store and offline/online parity

**Goal:** one feature definition for historical and incremental paths with no
train/serve skew.

### P05.S01 - Feature catalog

- **Scope:** name/type/unit/null policy/timestamp semantics/key/version/lookback.
- **Deliverable:** feature catalog and schema.
- **Acceptance:** every feature reproducible from catalog plus feature version.
- **Verification:** schema/version tests.

### P05.S02 - Shared rolling features

- **Scope:** mean/variance/volatility/delta/missingness/flatline duration/window،
  warm-up، interpolated/gap behavior.
- **Deliverable:** one shared rolling module.
- **Acceptance:** offline and online import the same formulas.
- **Verification:** reference dataframe and edge-window tests.

### P05.S03 - Seasonal features

- **Scope:** diurnal buckets، seasonal shape، strength diagnostic، timezone
  policy، insufficient history.
- **Deliverable:** seasonal contract and baseline report.
- **Acceptance:** stable across full seasonal fixture and explicit warm-up state.
- **Verification:** seasonal-cycle regression.

### P05.S04 - Offline builder

- **Scope:** historical windows، leakage boundary، aggregate reuse، feature
  version، run manifest.
- **Deliverable:** batch command and output manifest.
- **Acceptance:** no future data leaks into any feature.
- **Verification:** time-split leakage test.

### P05.S05 - Online builder

- **Scope:** every eligible clean reading، out-of-order/late data، restart،
  state initialization/eviction، duplicate event handling.
- **Deliverable:** state store and recovery design.
- **Acceptance:** restart and duplicate replay do not change state incorrectly.
- **Verification:** ordered/out-of-order/restart tests.

### P05.S06 - FeatureStoreEntry repository

- **Scope:** key/index/query behavior، stale feature policy، transaction boundary.
- **Deliverable:** repository and migrations.
- **Acceptance:** query returns correct version/window within latency budget.
- **Verification:** integration and performance tests.

### P05.S07 - Offline/online parity

- **Scope:** compare values/nulls/timestamps/flags/window metadata/version for
  identical inputs.
- **Deliverable:** regression test and parity report.
- **Acceptance:** parity is mandatory CI gate.
- **Verification:** ordered, out-of-order, gap, warm-up, and restart fixtures.

---

## P06 - Quality monitoring and lineage

**Goal:** quality problems are diagnosable and every output is traceable.

### P06.S01 - Quality metric definitions

- **Scope:** valid/interpolated/quarantined/missing/duplicate/freshness/
  continuity/drift denominators and empty-window behavior.
- **Deliverable:** metric contract and formula catalog.
- **Acceptance:** formulas are stable, documented, and versioned.
- **Verification:** golden metric tests.

### P06.S02 - Scheduled quality scan

- **Scope:** per station/window scan، thresholds، run ID، source range، duration.
- **Deliverable:** scan job input/output contract.
- **Acceptance:** scan is idempotent and rerunnable from a manifest.
- **Verification:** repeated-run equality test.

### P06.S03 - Schema drift

- **Scope:** field additions/removals/type/unit/parameter changes؛ warning versus
  blocking drift.
- **Deliverable:** schema fingerprint and drift-event schema.
- **Acceptance:** blocking drift cannot silently enter clean data.
- **Verification:** drift fixture suite.

### P06.S04 - DataQualityLog

- **Scope:** station/window/rates/drift/run/ruleset/feature/freshness metadata.
- **Deliverable:** table/repository/API-ready contract.
- **Acceptance:** report links to source manifest and quality run.
- **Verification:** repository/report lineage test.

### P06.S05 - Ruleset lineage

- **Scope:** cleaningRulesetVersion، featureSetVersion، dataset range، affected
  outputs/models، rollback mapping.
- **Deliverable:** immutable ruleset records and lookup queries.
- **Acceptance:** operator can identify every affected dataset/model after rule
  change.
- **Verification:** version-change replay test.

### P06.S06 - Report separation

- **Scope:** machine metrics separate from JSON/Markdown/CSV renderers؛ no
  renderer recalculates facts.
- **Deliverable:** report templates and snapshot examples.
- **Acceptance:** same facts generate deterministic reports in all formats.
- **Verification:** report snapshot test.

---

## P07 - Storage, retention, security, performance

**Goal:** explicit persistence and operational safety at production volume.

### P07.S01 - Repository interfaces

- **Scope:** protocols for raw read, clean write, feature write/read, quality
  write/read, manifests, jobs, lineage.
- **Deliverable:** interfaces and fake adapters.
- **Acceptance:** domain code does not import database clients.
- **Verification:** architecture test and fake-adapter unit tests.

### P07.S02 - PostgreSQL/Timescale schema

- **Scope:** migrations، keys/indexes، transactions، hypertables/aggregates،
  query plans.
- **Deliverable:** migrations and schema ownership document.
- **Acceptance:** required query paths use indexes and transactional boundaries.
- **Verification:** disposable-Postgres integration and EXPLAIN baseline.

### P07.S03 - Least privilege and raw immutability

- **Scope:** role grants/revokes، raw read-only، downstream write scopes،
  unrelated schema denial.
- **Deliverable:** SQL permissions and automated role test.
- **Acceptance:** AI role cannot insert/update/delete raw.
- **Verification:** positive/negative DB permission tests.
- **Production hardening:** enforce TLS in transit, encryption-at-rest ownership,
  credential rotation without downtime, quarterly access review, audit logging
  for privileged access, and explicit break-glass approval/expiry.
- **Exit evidence:** grant snapshot, denied-operation test output, rotation drill,
  and access-review record linked to the release.

### P07.S04 - Retention/compression/recovery

- **Scope:** compression age، raw retention، aggregate-only horizon، same live/
  import policy، backup/restore/replay.
- **Deliverable:** migration/policy/runbook and restore evidence.
- **Acceptance:** required training windows survive policy boundaries.
- **Verification:** compression/retention boundary integration test.
- **Production hardening:** define RPO/RTO per data class, backup encryption and
  key ownership, cross-environment restore restrictions, restore integrity
  reconciliation, and an annual disaster-recovery exercise.
- **Exit evidence:** dated restore drill proving row counts, checksums, lineage,
  access controls, and recovery time against the approved target.

### P07.S05 - Runtime data and secret boundary

- **Scope:** explicit data root، path traversal prevention، ignored runtime
  data، fixture allowlist، no external upload، approved egress.
- **Deliverable:** .gitignore/.dockerignore/policy/security report.
- **Acceptance:** clean image contains no secrets/runtime data; writes stay inside
  root.
- **Verification:** path, secret-scan, image, and network tests.
- **Production hardening:** use a managed secret provider, define rotation and
  revocation procedures, generate an SBOM, scan dependencies and container
  images for vulnerabilities, and document remediation SLA by severity.
- **Exit evidence:** clean secret scan, SBOM, vulnerability report with no
  unapproved critical/high findings, and successful secret-rotation drill.

### P07.S06 - Performance baseline

- **Scope:** ingestion throughput، import memory، DB latency، feature fetch،
  report time، serving budget.
- **Deliverable:** representative benchmark and thresholds.
- **Acceptance:** budgets pass repeatedly, not once manually.
- **Verification:** performance command in CI/release gate.

---

## P08 - Durable jobs, scheduling, concurrency

**Goal:** scheduled/on-demand work survives restart and never races.

### P08.S01 - Scheduler registration

- **Scope:** APScheduler + SQLAlchemyJobStore، timezone، nightly forecast،
  nightly anomaly، daily quality.
- **Deliverable:** scheduler config/runbook.
- **Acceptance:** restart preserves schedule; misfire policy is explicit.
- **Verification:** restart/misfire integration test.

### P08.S02 - Job state contract

- **Scope:** IDs، states، timestamps، counters، warnings، errors، attempts،
  trigger source، input/output run IDs.
- **Deliverable:** job schema and worker contract.
- **Acceptance:** client can poll and distinguish retry/failure/success.
- **Verification:** state transition tests.

### P08.S03 - Idempotent execution

- **Scope:** manifest-based idempotency، checkpointing، transaction boundary،
  retry behavior.
- **Deliverable:** idempotency key/checkpoint strategy.
- **Acceptance:** retry never duplicates outputs or corrupts lineage.
- **Verification:** interrupted/retried job test.

### P08.S04 - Advisory locks

- **Scope:** stable lock key station/parameter/type، wait/reject policy، release,
  cancellation، lock metrics.
- **Deliverable:** lock adapter and collision runbook.
- **Acceptance:** one conflicting job owns scope at a time.
- **Verification:** multi-worker collision/load test.

### P08.S05 - Scale-out path

- **Scope:** Celery/Redis upgrade decision، one-worker ownership، queue depth،
  failure recovery.
- **Deliverable:** scale-out ADR and operational notes.
- **Acceptance:** moving from one to multiple replicas does not duplicate jobs.
- **Verification:** multi-replica simulation or deployment test.
- **Production hardening:** define capacity thresholds, queue-lag SLO, worker
  autoscaling guardrails, poison-message/dead-letter handling, overload
  shedding, and a rollback path to a single-worker safe mode.
- **Exit evidence:** controlled overload test showing bounded queue growth,
  alerting, safe rejection/defer behavior, and recovery without duplicate work.

---

## P09 - Historical import / Track A

**Goal:** safe staged historical telemetry import and scoped ML bootstrap.

### P09.S01 - Preflight

- **Scope:** file type/encoding/size/columns/row limit/station/parameter/time/
  unit/checksum/duplicate checks.
- **Deliverable:** preflight report and rejection reasons.
- **Acceptance:** invalid file never reaches write stage.
- **Verification:** malformed, oversize, duplicate-submission tests.

### P09.S02 - Staging

- **Scope:** job/run ID، isolated staging root، manifest، cleanup/retention،
  no writes before validation.
- **Deliverable:** staged import record.
- **Acceptance:** staged input is recoverable and not confused with live raw.
- **Verification:** restart and cleanup tests.

### P09.S03 - Chunked processing

- **Scope:** bounded-memory iteration، shared clean pipeline، checkpoints،
  transactional batch commits.
- **Deliverable:** chunk writer and progress counters.
- **Acceptance:** multi-year file stays within memory budget and resumes safely.
- **Verification:** large synthetic/import interruption test.

### P09.S04 - Conflict decisions

- **Scope:** overlap with live data، exact duplicate/partial overlap/conflict
  values، skip/overwrite decision، operator audit.
- **Deliverable:** conflict records and decision API contract.
- **Acceptance:** unresolved conflict blocks commit.
- **Verification:** overlap matrix tests.

### P09.S05 - Feature/bootstrap handoff

- **Scope:** affected pairs only، feature build، versioned evaluation dataset،
  async ML handoff، threshold guard، Track B continuity.
- **Deliverable:** handoff payload/state history.
- **Acceptance:** import never blocks live API and below-threshold model cannot
  silently promote.
- **Verification:** end-to-end import-to-handoff test.

---

## P10 - Live Track B and cold start

**Goal:** every clean reading keeps preparation current without retrain storms.

### P10.S01 - Event identity and exactly-once state

- **Scope:** event/run identity، duplicate event handling، ordered/out-of-order/
  late readings، state checkpoint.
- **Deliverable:** update event contract/state log.
- **Acceptance:** replaying an event does not advance state twice.
- **Verification:** retry/order/replay tests.

### P10.S02 - Incremental features

- **Scope:** rolling/volatility/missingness/diurnal state update per clean batch،
  interpolation/gap eligibility.
- **Deliverable:** online update workflow.
- **Acceptance:** update is cheap and does not train models.
- **Verification:** batch/burst/late-data tests.

### P10.S03 - ML anomaly handoff

- **Scope:** River learn_one handoff payload، feature/ruleset/run versions،
  failure/retry/DLQ behavior.
- **Deliverable:** handoff schema and failure policy.
- **Acceptance:** every eligible reading is accepted/rejected/retried visibly.
- **Verification:** mocked ML success/failure/retry tests.

### P10.S04 - Retrain guard

- **Scope:** allowed trigger sources، authorization، burst protection، audit.
- **Deliverable:** trigger policy and counter.
- **Acceptance:** telemetry burst cannot create uncontrolled retrains.
- **Verification:** high-volume event load test.

### P10.S05 - Cold-start policy

- **Scope:** minimum forecast/anomaly observations، required counts، recovery
  transition، unavailable/degraded distinction.
- **Deliverable:** cold-start schema and examples.
- **Acceptance:** null/zero/empty is never ambiguous.
- **Verification:** empty/sparse/recovering/healthy tests.

---

## P11 - Data-owned API and ML registry handoff

**Goal:** stable contracts for .NET/ML while keeping inference ownership elsewhere.

### P11.S01 - Bulk import API

- **Scope:** POST staging/job ID، request limits، internal auth، idempotency.
- **Deliverable:** route/schema/OpenAPI examples.
- **Acceptance:** immediate job ID and safe client retry.
- **Verification:** API contract/idempotency tests.

### P11.S02 - Job status and conflicts API

- **Scope:** status states/counters/errors/warnings and conflict ranges/choices.
- **Deliverable:** polling responses and error model.
- **Acceptance:** client can recover after disconnect without server-side client state.
- **Verification:** snapshot and state-transition contract tests.

### P11.S03 - Quality API

- **Scope:** station/window rates/drift/freshness/windowDays/stale behavior.
- **Deliverable:** quality response schema and authorization contract.
- **Acceptance:** no-data/stale/degraded/healthy are distinguishable.
- **Verification:** OpenAPI/auth/snapshot tests.

### P11.S04 - Registry fields

- **Scope:** model ID/type/station/version/trainedAt/metrics/path/status plus
  feature/ruleset/dataset/trigger/source manifest.
- **Deliverable:** registry adapter and migration/lineage query.
- **Acceptance:** Model Health can reconstruct full provenance.
- **Verification:** complete fixture lineage integration test.

### P11.S05 - Ownership and contract versioning

- **Scope:** data-owned versus ML-owned endpoints، internal token/mTLS، backward
  compatibility/deprecation.
- **Deliverable:** ownership matrix and compatibility policy.
- **Acceptance:** no data endpoint implements model algorithm/inference.
- **Verification:** architecture and contract tests.
- **Production hardening:** require consumer impact assessment, semantic version
  policy, compatibility test fixtures, deprecation notice period, change
  approval, rollback plan, and contract-change audit trail.
- **Exit evidence:** one additive and one breaking-change rehearsal proving
  notification, compatibility handling, migration, and rollback procedures.

---

## P12 - Verification, observability, and release gate

**Goal:** prove readiness with repeatable evidence from a clean checkout.

### P12.S01 - Layered testing

- **Scope:** unit rules، integration DB/files/import/replay/jobs، regression
  parity/quality/contracts/seasonal، security، performance.
- **Deliverable:** test plan, CI matrix, coverage report.
- **Acceptance:** every parent has automated verification.
- **Verification:** complete CI run with no live external calls.
- **Production hardening:** define minimum coverage for critical paths, mutation
  or negative-path testing for validation rules, flaky-test quarantine policy,
  reproducible fixture provenance, and CI gates for schema, dependency,
  security, performance, and migration regressions.
- **Exit evidence:** release CI run includes all required gates and records the
  exact source revision, fixture versions, environment, and test results.

### P12.S02 - Seasonal replay

- **Scope:** one full seasonal cycle raw->clean->quarantine->resample->features->
  report, row reconciliation, gap/interpolation/lineage evidence.
- **Deliverable:** replay report and manifests.
- **Acceptance:** repeated runs equivalent and all decisions explainable.
- **Verification:** signed release evidence.

### P12.S03 - Observability and health

- **Scope:** trace-aware logs، DB latency، queue depth، job failures، data/
  feature/model freshness، quality rates، state distinction.
- **Deliverable:** health contract, dashboard metrics, incident runbooks.
- **Acceptance:** deliberate dependency failures return correct degraded/
  unavailable state and recover visibly.
- **Verification:** failure-injection/recovery tests.
- **Production hardening:** publish SLIs/SLOs and error budgets for source
  freshness, pipeline success, quality scan freshness, queue lag, API latency,
  and restore readiness. Define alert routing, severity, ownership, escalation,
  runbook links, and incident postmortem requirements.
- **Exit evidence:** simulated incidents show alert delivery, acknowledgement,
  diagnosis, mitigation, recovery, and post-incident action tracking within
  the stated response targets.

### P12.S04 - Container/deployment verification

- **Scope:** pinned clean build، no secrets/runtime data، readiness/liveness،
  graceful shutdown، worker restart، volume/network policy.
- **Deliverable:** image scan, build log, deployment smoke report.
- **Acceptance:** restart/redeploy preserves required manifests/jobs/state and
  service is not publicly exposed.
- **Verification:** deployment restart/smoke test.
- **Production hardening:** use immutable image digests, signed build provenance,
  dependency pinning, database migration compatibility checks, canary/rollback
  procedure, resource limits, and graceful-drain verification before rollout.
- **Exit evidence:** clean environment deployment proves upgrade and rollback
  preserve job state, manifests, schema compatibility, and service readiness.

### P12.S05 - Final go/no-go review

- **Scope:** security/data classification/roles/retention/load/performance/
  lineage/replay/rollback/unattended jobs.
- **Deliverable:** production readiness release record with links to evidence.
- **Acceptance:** all 12 parents are [x]; partial is not production-ready.
- **Verification:** sign-off from data engineering, platform/backend, ML
  integration, security, and operations owners.
- **Production hardening:** maintain a release risk register with severity,
  owner, mitigation, expiry, and explicit waiver authority. A conditional go
  requires time-bound accepted risk; any unowned critical risk is a no-go.
- **Exit evidence:** signed evidence index includes SLO baselines, restore drill,
  security/SBOM results, capacity test, incident drill, contract rehearsal,
  deployment rollback, and on-call handover.

## Completion rule

Production Grade means all 12 parents are complete and every subtask has its
artifact, acceptance result, automated verification where applicable, owner,
and linked release evidence. Folder creation, a passing placeholder test, or a
demo output alone never closes a task.



