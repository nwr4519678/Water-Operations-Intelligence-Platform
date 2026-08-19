namespace WaterOperations.Domain.Common.Results;

public readonly record struct Result(bool IsSuccess, string? Error = null)
{
    public static Result Success() => new(true);
    public static Result Failure(string error) => new(false, error);
    public static Result<T> Success<T>(T value) => new(true, value);
    public static Result<T> Failure<T>(string error) => new(false, default, error);
}

public readonly record struct Result<T>(bool IsSuccess, T? Value = default, string? Error = null)
{ }
