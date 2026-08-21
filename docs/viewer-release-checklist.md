# Viewer release checklist

This checklist is the V-10 sign-off for the read-only Viewer implementation.

## Route coverage

- [x] Overview with KPI cards, live status, alarms, measurements, trend, and risk summary
- [x] Map and station visualization with schematic fallback and offline station list
- [x] Station directory with search, detail, health, and metadata
- [x] Telemetry analytics with typed metric and range controls
- [x] Alarm history with severity and text filters
- [x] Read-only reports with freshness metadata and immutable detail view
- [x] AI risk, forecast, confidence, and model health display
- [x] Global search across stations and alarms
- [x] Local preferences, contextual help, and immutable snapshot viewing

## Quality gates

- [x] TypeScript build
- [x] ESLint
- [x] Prettier check
- [x] Vitest unit tests
- [x] Playwright Chromium smoke test
- [x] Responsive layout rules and RTL-compatible logical properties
- [x] Viewer navigation contains no mutation or administration actions

## Known limitations

The map uses a deterministic schematic fallback until a production map tile provider is approved. All data is fixture-backed by design; service adapters remain replaceable for the next integration phase.
