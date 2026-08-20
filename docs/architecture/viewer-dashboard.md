# Viewer dashboard architecture

The Viewer dashboard is a read-only React application inside the existing frontend. It adapts TailAdmin-style shell, card, table, sidebar, and responsive patterns without importing TailAdmin's Alpine.js or Webpack implementation.

## Boundaries

- `app/` owns application composition and browser routing.
- `components/` contains reusable shell and visual primitives.
- `pages/` composes route-level viewer experiences.
- `mocks/` provides typed local fixtures and is the only data source for this prototype.
- `stores/` owns local theme, locale, and navigation preferences.
- `shared/` contains English and Arabic UI copy.
- `types/` defines station, alarm, report, measurement, and AI insight contracts.

The navigation contains only Overview, Map & Stations, Alarms, Reports, and AI Insights. There are no mutation controls, administration features, backend calls, production authentication, or production live-data connections.

## Visual system

`src/styles.css` defines dark and light theme variables, compact operational cards, status semantics, responsive breakpoints, and direction-aware logical properties. Arabic switches the document to RTL. Status remains understandable through text as well as color.

## Integration seam

Route pages currently import `mocks/viewerFixtures.ts`. A future API integration should expose the same typed view models through `services/` and TanStack Query, leaving page and component contracts unchanged. AI queries must remain independent so an AI outage never blocks core station, telemetry, alarm, or report data.
