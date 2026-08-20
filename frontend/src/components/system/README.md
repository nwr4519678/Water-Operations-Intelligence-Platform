# Viewer design system

The `components/system` package contains typed, read-only UI primitives for viewer pages. Import from `components/system` rather than copying styles into a page.

## Usage rules

- Use `StatusBadge`, `SeverityBadge`, or `DataQualityBadge` whenever a state is represented by color; every badge includes text and a non-color marker.
- Use `FeedbackState` for loading, empty, error, stale, and permission-denied states. Retry actions must be explicit callbacks.
- Keep viewer components read-only. Mutations and admin/operator controls belong to a separate capability boundary.
- Use `DataTable` with a stable row `id`, a visible label, and explicit column headers.
- Use `ViewerShell` for navigation, breadcrumbs, connection status, and locale direction. Arabic sets `dir="rtl"` and `lang="ar"`.

## Accessibility checklist

- All interactive elements are native buttons, links, inputs, or selects and are keyboard reachable.
- Focus indicators are visible with `:focus-visible`.
- Dialogs expose `role="dialog"`, `aria-modal`, a labelled title, and a keyboard-closeable button.
- Tables use a caption and scoped column headers.
- Status, severity, quality, and confidence labels remain readable without relying on color.
- Automated coverage lives in `system.test.tsx`; add an accessible role/name assertion for each new component state.
