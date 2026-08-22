[CmdletBinding()]
param(
    [string]$RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'
$marketplaceRoot = (Resolve-Path $RepositoryRoot).Path

if (-not (Get-Command codex -ErrorAction SilentlyContinue)) {
    throw 'Codex CLI was not found on PATH. Install Codex and retry.'
}

codex plugin marketplace add $marketplaceRoot
codex plugin add 'clickup-community@clickup-community'
Write-Host 'Installed clickup-community. Start a new Codex task to load it.'
