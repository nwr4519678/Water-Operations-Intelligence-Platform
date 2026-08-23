param(
    [string] $BaseUrl = "http://localhost:8080",
    [int] $Requests = 50
)

$ErrorActionPreference = "Stop"
$durations = [System.Collections.Generic.List[double]]::new()
for ($index = 0; $index -lt $Requests; $index++) {
    $watch = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-WebRequest -Uri "$BaseUrl/health/live" -Method Get
    $watch.Stop()
    if ($response.StatusCode -ne 200) {
        throw "Health request returned $($response.StatusCode)."
    }
    $durations.Add($watch.Elapsed.TotalMilliseconds)
}

$ordered = $durations | Sort-Object
$p95 = $ordered[[Math]::Min($ordered.Count - 1, [Math]::Floor($ordered.Count * 0.95))]
[pscustomobject]@{
    Requests = $Requests
    AverageMilliseconds = [Math]::Round(($durations | Measure-Object -Average).Average, 2)
    P95Milliseconds = [Math]::Round($p95, 2)
    MaximumMilliseconds = [Math]::Round(($durations | Measure-Object -Maximum).Maximum, 2)
}
