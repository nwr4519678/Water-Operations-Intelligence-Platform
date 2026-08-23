namespace WaterOperations.Application.Common.Exceptions;

/// <summary>
/// Exception thrown when a requested resource cannot be found.
/// Maps to HTTP 404 Not Found in the API layer.
/// </summary>
public sealed class NotFoundException(string message) : Exception(message);
