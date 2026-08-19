namespace WaterOperations.Domain.Entities;

public sealed class Organization
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public ICollection<Region> Regions { get; } = [];
}

public sealed class Region
{
    public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    public required string Name { get; set; }
    public Organization? Organization { get; set; }
    public ICollection<Station> Stations { get; } = [];
}

public sealed class Station
{
    public Guid Id { get; set; }
    public Guid RegionId { get; set; }
    public required string Name { get; set; }
    public Region? Region { get; set; }
    public ICollection<Measurement> Measurements { get; } = [];
    public ICollection<Alarm> Alarms { get; } = [];
}

public sealed class Measurement
{
    public Guid Id { get; set; }
    public Guid StationId { get; set; }
    public DateTimeOffset RecordedAt { get; set; }
    public decimal Value { get; set; }
    public required string Unit { get; set; }
    public Station? Station { get; set; }
}

public sealed class Alarm
{
    public Guid Id { get; set; }
    public Guid StationId { get; set; }
    public DateTimeOffset RaisedAt { get; set; }
    public required string Severity { get; set; }
    public required string Message { get; set; }
    public Station? Station { get; set; }
}
