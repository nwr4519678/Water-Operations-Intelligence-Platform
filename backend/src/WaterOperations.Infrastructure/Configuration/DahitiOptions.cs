namespace WaterOperations.Infrastructure.Configuration;

public sealed class DahitiOptions
{
    public const string SectionName = "Dahiti";

    public bool Enabled { get; set; }
    public string BaseUrl { get; set; } = "https://dahiti.dgfi.tum.de/api/v2/";
    public string ApiKey { get; set; } = string.Empty;
    public string Country { get; set; } = "Egypt";
    public string StationIdsCsv { get; set; } = string.Empty;
    public int SyncIntervalMinutes { get; set; } = 360;
    public int RequestDelayMilliseconds { get; set; } = 250;
}
