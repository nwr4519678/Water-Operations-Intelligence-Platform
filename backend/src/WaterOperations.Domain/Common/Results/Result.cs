namespace WaterOperations.Domain.Common.Results;

/// <summary>A non-generic result indicating success or failure with an optional error code.</summary>
public readonly record struct Result(bool IsSuccess, string? Error = null)
{
    /// <summary>True when the operation failed.</summary>
    public bool IsFailure => !IsSuccess;

    public static Result Success() => new(true);
    public static Result Failure(string error) => new(false, error);

    public static Result<T> Success<T>(T value) => new(true, value);
    public static Result<T> Failure<T>(string error) => new(false, default, error);
}

/// <summary>A typed result carrying a value on success or an error code on failure.</summary>
public readonly record struct Result<T>(bool IsSuccess, T? Value = default, string? Error = null)
{
    /// <summary>True when the operation failed.</summary>
    public bool IsFailure => !IsSuccess;
}
