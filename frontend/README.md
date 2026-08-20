# Frontend quality gates

The frontend uses Node 22, npm, TypeScript strict mode, Vite, ESLint, Prettier, Vitest, and Playwright. `frontend/package-lock.json` is the reproducible dependency source used by CI.

## Local checks

From `frontend/`:

```bash
npm ci
npm run lint
npm run format:check
npm run test:unit -- --run
npm run build
npx playwright install chromium
npm run test:browser
```

The browser test starts the Vite development server automatically. It uses no private API, credentials, or external services.

## Environment

Copy `.env.example` to `.env.local` for local development. Vite exposes only variables prefixed with `VITE_`:

- `VITE_API_BASE_URL` — REST API base URL.
- `VITE_SIGNALR_URL` — telemetry SignalR hub URL.

Safe local defaults are used when the variables are not set. Staging and production must provide their own values at build time; secrets must never be placed in frontend environment variables because they are bundled into browser code.

## CI gates

Pull requests and viewer-sprint branches run lint, formatting, unit tests, browser smoke tests, and a production build. CI uploads the production bundle, Playwright report, and test results for diagnosis. No private secrets are required for these baseline checks.
