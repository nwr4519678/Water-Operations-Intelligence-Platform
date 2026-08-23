using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Administration.Commands;
using WaterOperations.Application.Features.Administration.DTOs;
using WaterOperations.Application.Features.Administration.Interfaces;

namespace WaterOperations.UnitTests;

public sealed class AdministrationCommandTests
{
    private readonly FakeAdminRepository repository = new();
    private readonly FakeCurrentUser user = new(Guid.NewGuid());

    [Fact]
    public async Task CreateRegionCommandHandler_Success_ReturnsAuthorized()
    {
        var handler = new CreateRegionCommandHandler(repository, user);
        var request = new CreateRegionRequest("REG-01", "Region North", "Description", "{}");

        var result = await handler.Handle(new CreateRegionCommand(request), CancellationToken.None);

        Assert.True(result.IsAuthorized);
        Assert.NotNull(result.Value);
        Assert.Equal("REG-01", result.Value.Code);
    }

    [Fact]
    public async Task UpdateRegionCommandHandler_NonExistentRegion_ReturnsNotFound()
    {
        var handler = new UpdateRegionCommandHandler(repository, user);
        var request = new UpdateRegionRequest("REG-01", "Region North", "Description", "{}", true);

        var result = await handler.Handle(new UpdateRegionCommand(Guid.NewGuid(), request), CancellationToken.None);

        Assert.False(result.IsAuthorized);
        Assert.True(result.IsNotFound);
        Assert.Null(result.Value);
    }

    [Fact]
    public async Task SetRegionActiveCommandHandler_ReturnsAuthorizedBool()
    {
        var handler = new SetRegionActiveCommandHandler(repository, user);

        var result = await handler.Handle(new SetRegionActiveCommand(Guid.NewGuid(), true), CancellationToken.None);

        Assert.True(result.IsAuthorized);
        Assert.True(result.Value);
    }

    [Fact]
    public async Task AssignUserRoleCommandHandler_ReturnsAuthorizedBool()
    {
        var handler = new AssignUserRoleCommandHandler(repository, user);

        var result = await handler.Handle(new AssignUserRoleCommand(Guid.NewGuid(), 2), CancellationToken.None);

        Assert.True(result.IsAuthorized);
        Assert.True(result.Value);
    }

    [Fact]
    public async Task RevokeUserSessionsCommandHandler_ReturnsAuthorizedCount()
    {
        var handler = new RevokeUserSessionsCommandHandler(repository, user);

        var result = await handler.Handle(new RevokeUserSessionsCommand(Guid.NewGuid()), CancellationToken.None);

        Assert.True(result.IsAuthorized);
        Assert.Equal(3, result.Value);
    }

    [Fact]
    public void CreateRegionCommandValidator_EmptyCode_FailsValidation()
    {
        var validator = new CreateRegionCommandValidator();
        var command = new CreateRegionCommand(new CreateRegionRequest("", "Name", "Desc", "{}"));

        var result = validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Request.Code");
    }

    private sealed class FakeAdminRepository : IAdministrationRepository
    {
        public Task<PagedResult<UserAdminDto>> GetUsersAsync(Guid organizationId, PaginationRequest pagination, CancellationToken cancellationToken) =>
            Task.FromResult(new PagedResult<UserAdminDto>([], 0, 1, 50));

        public Task<OrganizationDto?> GetOrganizationAsync(Guid organizationId, CancellationToken cancellationToken) =>
            Task.FromResult<OrganizationDto?>(null);

        public Task<IReadOnlyList<DashboardLayoutDto>> GetLayoutsAsync(Guid userId, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<DashboardLayoutDto>>([]);

        public Task<bool> SaveLayoutAsync(Guid userId, string name, string widgetsJson, bool isDefault, CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task<bool> UpdateOrganizationAsync(Guid organizationId, string name, string? logoUrl, string locale, string timeZone, CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task<bool> SetUserActiveAsync(Guid organizationId, Guid userId, bool isActive, CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task<UserPreferencesDto?> GetUserPreferencesAsync(Guid organizationId, Guid userId, CancellationToken cancellationToken) =>
            Task.FromResult<UserPreferencesDto?>(null);

        public Task<bool> UpdateUserPreferencesAsync(Guid organizationId, Guid userId, string theme, string locale, string timeZone, byte decimalPrecision, CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task<IReadOnlyList<RegionAdminDto>> GetRegionsAsync(Guid organizationId, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<RegionAdminDto>>([]);

        public Task<RegionAdminDto?> CreateRegionAsync(Guid organizationId, CreateRegionRequest request, CancellationToken cancellationToken) =>
            Task.FromResult<RegionAdminDto?>(new RegionAdminDto(Guid.NewGuid(), organizationId, request.Code, request.Name, request.Description, true, DateTime.UtcNow));

        public Task<RegionAdminDto?> UpdateRegionAsync(Guid organizationId, Guid regionId, UpdateRegionRequest request, CancellationToken cancellationToken) =>
            Task.FromResult<RegionAdminDto?>(null);

        public Task<bool> SetRegionActiveAsync(Guid organizationId, Guid regionId, bool isActive, CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task<IReadOnlyList<UserRoleDto>> GetUserRolesAsync(Guid organizationId, Guid userId, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<UserRoleDto>>([]);

        public Task<bool> AssignUserRoleAsync(Guid organizationId, Guid actorUserId, Guid userId, int roleId, CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task<int> RevokeUserSessionsAsync(Guid organizationId, Guid targetUserId, CancellationToken cancellationToken) =>
            Task.FromResult(3);
    }

    private sealed class FakeCurrentUser(Guid orgId) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid? UserId => Guid.NewGuid();
        public string? Email => "admin@water.local";
        public Guid? OrganizationId => orgId;
        public string? Organization => orgId.ToString();
        public Guid? RegionId => null;
        public string? Region => "1";
        public IReadOnlyCollection<string> Roles => ["ADMIN"];
    }
}
