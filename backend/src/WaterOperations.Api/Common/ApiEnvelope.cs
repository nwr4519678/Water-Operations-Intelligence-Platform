namespace WaterOperations.Api.Common;

public sealed record ApiEnvelope<T>(bool Success, T? Data, ApiError? Error, string TraceId)
{
    public static ApiEnvelope<T> Ok(T data, string traceId) => new(true, data, null, traceId);
    public static ApiEnvelope<T> Fail(string code, string message, string traceId) => new(false, default, new ApiError(code, message), traceId);
}
public sealed record ApiError(string Code, string Message);
