# Frontend design contract

The interface uses semantic tokens from `frontend/design-tokens/tokens.json`.
Components must support light/dark themes, English/Arabic labels, RTL layout,
responsive widths, keyboard focus, screen-reader semantics, and reduced motion.

Viewer functionality is read-only and fixture-backed until a production service
contract is approved. Every data surface must account for loading, empty,
populated, error, offline, stale, and degraded states where applicable.

Use status tokens rather than feature-specific colors. Do not add Admin or
Operator actions to Viewer components, and do not introduce backend or
production-authentication behavior in the frontend foundation.
