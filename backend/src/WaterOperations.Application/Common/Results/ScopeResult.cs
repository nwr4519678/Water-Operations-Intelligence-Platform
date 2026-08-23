namespace WaterOperations.Application.Common.Results;

/// <summary>
/// Status code representing authorization or resolution state of an application request.
/// </summary>
public enum ScopeStatus
{
    Authorized,
    Forbidden,
    NotFound
}

/// <summary>
/// Enforces tenant/user scoping and authorization state around returned values.
/// </summary>
/// <typeparam name="T">Result payload type.</typeparam>
public sealed record ScopeResult<T>(
    ScopeStatus Status,
    T? Value)
{
    public bool IsAuthorized => Status == ScopeStatus.Authorized;

    public bool IsNotFound => Status == ScopeStatus.NotFound;
}

/// <summary>
/// Factory helpers for constructing <see cref="ScopeResult{T}"/> instances.
/// </summary>
public static class ScopeResult
{
    public static ScopeResult<T> Forbidden<T>() =>
        new(ScopeStatus.Forbidden, default);

    public static ScopeResult<T> Authorized<T>(T value) =>
        new(ScopeStatus.Authorized, value);

    public static ScopeResult<T> NotFound<T>() =>
        new(ScopeStatus.NotFound, default);
}
