param(
    [Parameter(Mandatory = $true)]
    [string]$ConnectionString,
    [string]$Configuration = 'Release',
    [string]$StartupProject = 'backend/src/WaterOperations.Api',
    [string]$InfrastructureProject = 'backend/src/WaterOperations.Infrastructure',
    [switch]$SkipBackup
)

$ErrorActionPreference = 'Stop'
$env:ConnectionStrings__Default = $ConnectionString

if (-not $SkipBackup) {
    & "$PSScriptRoot/backup.ps1"
}

dotnet ef database update `
    --project $InfrastructureProject `
    --startup-project $StartupProject `
    --configuration $Configuration

if ($LASTEXITCODE -ne 0) {
    throw 'Database migration failed. Restore the latest backup before retrying or rolling back the release.'
}

Write-Output 'Database migration completed. Run release-smoke.ps1 and verify /health/ready before promotion.'
