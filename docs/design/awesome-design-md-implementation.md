# Viewer frontend design direction

## Reference

The viewer redesign uses `linear.app/DESIGN.md` from the local `awesome-design-md` skill as the primary reference. The implementation adapts Linear's surface hierarchy, hairline borders, compact control sizing, restrained elevation, and typography rhythm to a water-operations control room.

## Product adaptations

- The near-black canvas becomes a deep blue-green operations canvas for telemetry readability.
- Linear lavender is replaced with a water-teal accent for primary actions and live status.
- Semantic critical, warning, offline, and quality colors remain available because the product is operational and data-dense.
- The viewer navigation includes Overview, Map & Stations, Stations, Alarms, Reports, and AI Insights only; admin/operator controls remain out of scope.
- The layout keeps explicit read-only, loading, empty, error, offline, responsive, and RTL states.

## UI rules

- Use semantic surface tokens and 1px borders for hierarchy; avoid heavy shadows and decorative gradients.
- Keep dashboard grids dense on desktop and collapse panels into a readable single-column flow below 820px.
- Maintain visible focus rings, minimum 44px touch targets, tabular numerals, and horizontal overflow for data tables.
- Prefer reusable `.panel`, `.metric-card`, `.status-badge`, `.button`, and form primitives over page-specific visual rules.
