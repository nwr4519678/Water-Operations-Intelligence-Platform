namespace WaterOperations.Application.Common.Results;

public enum ScopeStatus
{
    Authorized,
    Forbidden,
    NotFound
}

public sealed record ScopeResult<T>(ScopeStatus Status, T? Value)
{
    public bool IsAuthorized => Status == ScopeStatus.Authorized;

    public bool IsNotFound => Status == ScopeStatus.NotFound;
}

public static class ScopeResult
{
    public static ScopeResult<T> Forbidden<T>() =>
        new(ScopeStatus.Forbidden, default);

    public static ScopeResult<T> Authorized<T>(T value) =>
        new(ScopeStatus.Authorized, value);

    public static ScopeResult<T> NotFound<T>() =>
        new(ScopeStatus.NotFound, default);
}
