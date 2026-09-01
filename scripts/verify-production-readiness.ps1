$ErrorActionPreference = "Stop"

$trackedConfig = git ls-files -- "*.json" "*.yml" "*.yaml"
$patterns = @(
    'Password=(?!\$|postgres)[^\s;"]+',
    '"SigningKey"\s*:\s*"(?!development-only-signing-key-change-me-please)[^"]+"',
    '"ApiKey"\s*:\s*"[^"]+"'
)

$violations = @()
foreach ($file in $trackedConfig) {
    if (Test-Path $file) {
        foreach ($pattern in $patterns) {
            $matches = Select-String -Path $file -Pattern $pattern
            if ($matches) {
                $violations += $matches
            }
        }
    }
}

if ($violations.Count -gt 0) {
    $violations | ForEach-Object { Write-Error $_.ToString() }
    throw "Tracked configuration contains a non-placeholder secret."
}

git diff --check
Write-Output "Production-readiness static checks passed."