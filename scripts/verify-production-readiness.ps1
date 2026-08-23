$ErrorActionPreference = "Stop"

$trackedConfig = git ls-files -- "*.json" "*.yml" "*.yaml"
$violations = $trackedConfig |
    ForEach-Object { git grep -n -I -E 'Password=[^$"[:space:]]+|"SigningKey"[[:space:]]*:[[:space:]]*"[^"]+|"ApiKey"[[:space:]]*:[[:space:]]*"[^"]+' -- $_ 2>$null } |
    Where-Object { $_ -notmatch 'development-only-signing-key-change-me-please' }

if ($violations) {
    $violations | Write-Error
    throw "Tracked configuration contains a non-placeholder secret."
}

git diff --check
Write-Output "Production-readiness static checks passed."
