namespace WaterOperations.Application.Features.Dahiti.Exceptions;

/// <summary>
/// Thrown by <see cref="Interfaces.IDahitiQueryRepository"/> when the Dahiti database tables
/// have not been initialised yet (PostgreSQL error 42P01 — undefined_table).
/// Maps to HTTP 503 Service Unavailable in the API layer.
/// </summary>
public sealed class DahitiDataNotInitializedException()
    : Exception("DaHITI data is not initialized.");
