namespace WaterOperations.Infrastructure.Authentication;

public sealed class JwtAuthenticationOptions
{
    public const string SectionName = "Authentication";

    public string Issuer { get; set; } = "water-operations";

    public string Audience { get; set; } = "water-operations-web";

    public string SigningKey { get; set; } = string.Empty;

    public int ClockSkewSeconds { get; set; } = 30;
}
