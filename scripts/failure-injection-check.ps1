param(
    [string]$UnavailableUrl = 'http://127.0.0.1:1'
)

$ErrorActionPreference = 'Stop'

try {
    Invoke-WebRequest -Uri "$($UnavailableUrl.TrimEnd('/'))/health/ready" -UseBasicParsing -TimeoutSec 3 | Out-Null
    throw "Failure-injection check expected $UnavailableUrl to be unavailable."
}
catch [System.Net.WebException] {
    Write-Output 'Failure-injection check passed: an unavailable dependency is surfaced as an unavailable endpoint.'
}
catch [System.Net.Http.HttpRequestException] {
    Write-Output 'Failure-injection check passed: an unavailable dependency is surfaced as an unavailable endpoint.'
}
