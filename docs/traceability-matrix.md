# Foundation traceability matrix

| Requirement | Implementation | Verification |
| --- | --- | --- |
| Repository and token foundation | `frontend/design-tokens`, `docs/frontend-structure.md` | `npm run tokens:build`, build |
| Viewer routes and read-only permissions | `frontend/src/app`, `frontend/src/lib/permissions.ts` | `src/app/App.test.tsx` |
| Typed telemetry and service boundaries | `frontend/src/types/telemetry.ts`, `frontend/src/services` | TypeScript build |
| Shared data and accessibility primitives | `frontend/src/components/ui`, `vitest.config.ts` | `DataTable.test.tsx` |
| English/Arabic, RTL, responsive, offline | `frontend/src/i18n`, `styles.css`, `OfflineBanner` | build and integration test |
| Foundation integration and sign-off | this matrix and `docs/foundation-sign-off.md` | full quality-gate run |
