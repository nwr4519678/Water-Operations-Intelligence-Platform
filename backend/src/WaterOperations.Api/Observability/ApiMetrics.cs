using System.Globalization;
using System.Text;

namespace WaterOperations.Api.Observability;

public sealed class ApiMetrics
{
    private long requestCount;
    private long failedRequestCount;
    private long totalDurationMilliseconds;

    public void Record(int statusCode, long durationMilliseconds)
    {
        Interlocked.Increment(ref requestCount);
        Interlocked.Add(ref totalDurationMilliseconds, durationMilliseconds);
        if (statusCode >= 500)
        {
            Interlocked.Increment(ref failedRequestCount);
        }
    }

    public string RenderPrometheus()
    {
        var requests = Interlocked.Read(ref requestCount);
        var failures = Interlocked.Read(ref failedRequestCount);
        var duration = Interlocked.Read(ref totalDurationMilliseconds);
        var average = requests == 0 ? 0d : (double)duration / requests;
        var output = new StringBuilder();
        output.AppendLine("# TYPE water_operations_http_requests_total counter");
        output.Append("water_operations_http_requests_total ").Append(requests).AppendLine();
        output.AppendLine("# TYPE water_operations_http_failures_total counter");
        output.Append("water_operations_http_failures_total ").Append(failures).AppendLine();
        output.AppendLine("# TYPE water_operations_http_average_duration_milliseconds gauge");
        output.Append("water_operations_http_average_duration_milliseconds ")
            .AppendLine(average.ToString("F2", CultureInfo.InvariantCulture));
        return output.ToString();
    }
}
