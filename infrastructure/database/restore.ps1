param(
    [Parameter(Mandatory = $true)]
    [string] $BackupFile
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($env:ConnectionStrings__Restore)) {
    throw "ConnectionStrings__Restore must target an isolated restore environment."
}

& pg_restore $env:ConnectionStrings__Restore --clean --if-exists --exit-on-error $BackupFile
if ($LASTEXITCODE -ne 0) {
    throw "pg_restore failed."
}

Write-Output "Restore completed. Run migration and smoke verification before sign-off."
