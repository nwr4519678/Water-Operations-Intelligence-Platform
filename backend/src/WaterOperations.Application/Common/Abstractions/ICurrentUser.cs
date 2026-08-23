namespace WaterOperations.Application.Common.Abstractions;

public interface ICurrentUser
{
    public bool IsAuthenticated { get; }
    public Guid? OrganizationId { get; }
    public Guid? RegionId { get; }
    public string? Organization { get; }
    public string? Region { get; }
    public Guid? UserId { get; }
    public IReadOnlyCollection<string> Roles { get; }
}
