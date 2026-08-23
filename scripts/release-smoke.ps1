param(
    [string]$BaseUrl = 'http://localhost:8080'
)

$ErrorActionPreference = 'Stop'
$base = $BaseUrl.TrimEnd('/')

function Assert-Status([string]$Path, [int]$ExpectedStatus) {
    try {
        $response = Invoke-WebRequest -Uri "$base$Path" -UseBasicParsing -SkipHttpErrorCheck
    }
    catch {
        throw "Release smoke request failed for $Path`: $($_.Exception.Message)"
    }

    if ($response.StatusCode -ne $ExpectedStatus) {
        throw "Expected $Path to return $ExpectedStatus, received $($response.StatusCode)."
    }
}

Assert-Status '/health/live' 200
Assert-Status '/health/ready' 200
Assert-Status '/swagger/v1/swagger.json' 200
Assert-Status '/metrics' 401
Write-Output "Release smoke checks passed for $base"
