namespace WaterOperations.Application.Common.Abstractions;

public interface ITenantContext
{
    Guid? OrganizationId { get; }
    string? Region { get; }
}
