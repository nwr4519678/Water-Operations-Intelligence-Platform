param(
    [Parameter(Mandatory = $true)]
    [string] $OutputFile
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($env:ConnectionStrings__Default)) {
    throw "ConnectionStrings__Default must be supplied by the deployment secret store."
}

& pg_dump $env:ConnectionStrings__Default --format=custom --file=$OutputFile
if ($LASTEXITCODE -ne 0) {
    throw "pg_dump failed."
}

Write-Output "Encrypted-storage handoff required for $OutputFile."
