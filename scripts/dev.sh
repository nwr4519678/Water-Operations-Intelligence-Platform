#!/usr/bin/env bash
set -euo pipefail

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

docker compose up -d postgres redis
if [[ "${1:-}" == "--with-ai" ]]; then docker compose --profile ai up -d --build ai-service; fi
printf '%s\n' 'Run in separate terminals:' '  dotnet run --project backend/src/WaterOperations.Api --launch-profile http' '  npm --prefix frontend run dev'
