namespace WaterOperations.Application.Common.Exceptions;

public class DomainConflictException : Exception
{
    public string ErrorCode { get; }

    public DomainConflictException(string errorCode, string message) : base(message)
    {
        ErrorCode = errorCode;
    }
}
