namespace WaterOperations.Infrastructure.Authentication;

/// <summary>
/// Shared constants for authentication configuration.
/// The development signing key is intentionally weak and is only used when
/// <c>Authentication:SigningKey</c> is not supplied (local development only).
/// In production this must be overridden via environment variable or user secrets.
/// </summary>
internal static class AuthenticationConstants
{
    internal const string DevSigningKey = "development-only-signing-key-change-me-please";
}
