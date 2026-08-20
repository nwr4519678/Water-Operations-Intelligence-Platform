# Frontend quality gates

Run these commands from `frontend` before delivery:

```text
npm ci
npm run tokens:build
npm run test
npm run build
git diff --check
```

The application must remain usable at 375px, 768px, 1024px, and desktop
widths. Arabic must set `dir="rtl"`, and reduced-motion users must not receive
long-running decorative animations. Offline mode must present a non-blocking
status banner while retaining the last available fixture/query data.

Production network and realtime integrations must remain behind typed service
ports. Viewer routes must not expose mutation controls.
