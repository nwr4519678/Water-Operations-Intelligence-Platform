namespace WaterOperations.Infrastructure.Authentication;

public sealed class JwtAuthenticationOptions
{
    public const string SectionName = "Authentication";

    /// <summary>
    /// Fallback signing key used when <c>Authentication:SigningKey</c> is not configured.
    /// Only used in local development. Must be overridden in production.
    /// </summary>
    public const string DevSigningKey = AuthenticationConstants.DevSigningKey;

    public string Issuer { get; set; } = "water-operations";

    public string Audience { get; set; } = "water-operations-web";

    public string SigningKey { get; set; } = string.Empty;

    public int ClockSkewSeconds { get; set; } = 30;
}
