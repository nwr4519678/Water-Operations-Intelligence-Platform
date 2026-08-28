# DAHITI + Supabase integration

The official DAHITI Egypt catalog currently contains 19 virtual stations. The
water-level API returns `date`, `wse`, `wse_u`, and the satellite record label.
The API requires a DAHITI API key, so the browser must never call DAHITI
directly.

## One-time setup

1. In Supabase SQL Editor, run [`supabase-dahiti.sql`](../../infrastructure/database/supabase-dahiti.sql).
2. Set these variables in the server/data-engineering environment (not in Vite):

   ```text
   DAHITI_API_KEY=...
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

3. Run from the repository root:

   ```powershell
   python data-engineering/pipelines/sync_dahiti_supabase.py
   ```

The sync is safe to repeat: stations are upserted by `dahiti_id` and readings
by `(dahiti_id, observed_at)`. It creates 19 station profiles and imports every
reading returned by DAHITI. If a station is temporarily unavailable, its
existing rows are retained.

## Runtime flow

`DAHITI API -> sync job -> Supabase -> .NET API -> React frontend -> AI service`

The .NET API remains the only browser-facing API. Configure the frontend with
`VITE_API_BASE_URL=http://localhost:5102` for local development. Configure the
backend AI client with `AiModelClient__BaseUrl=http://localhost:8000` locally,
or `http://ai-service:8000` in Docker.

The service-role key is intentionally used only by the sync job. The two
Supabase tables have read-only RLS policies for `anon`/`authenticated`; do not
put the service-role key in frontend code.
