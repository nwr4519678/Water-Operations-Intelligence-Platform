namespace WaterOperations.Application.Common.Exceptions;

public sealed class ForbiddenAccessException : Exception
{
    public ForbiddenAccessException(string message = "The current user is not authorized for this operation.")
        : base(message)
    {
    }
}
