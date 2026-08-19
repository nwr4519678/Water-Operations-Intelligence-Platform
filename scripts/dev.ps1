param([switch]$WithAi)
$ErrorActionPreference = 'Stop'

if (Test-Path .env) {
    Get-Content .env | Where-Object { $_ -match '^\s*([^#][^=]*)=(.*)$' } | ForEach-Object {
        [Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), 'Process')
    }
}

docker compose up -d postgres redis
if ($WithAi) { docker compose --profile ai up -d --build ai-service }
Write-Host 'Run in separate terminals:'
Write-Host '  dotnet run --project backend/src/WaterOperations.Api --launch-profile http'
Write-Host '  npm --prefix frontend run dev'
