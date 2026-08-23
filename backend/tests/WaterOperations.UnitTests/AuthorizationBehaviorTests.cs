using MediatR;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Behaviors;
using WaterOperations.Application.Common.Exceptions;

namespace WaterOperations.UnitTests;

public sealed class AuthorizationBehaviorTests
{
    private sealed record PlainRequest : IRequest<string>;
    private sealed record OrgRequiredRequest : IRequest<string>, IRequireOrganization;
    private sealed record UserRequiredRequest : IRequest<string>, IRequireUser;
    private sealed record OrgAndUserRequiredRequest : IRequest<string>, IRequireOrganization, IRequireUser;

    [Fact]
    public async Task Handle_PlainRequest_PassesWithoutClaims()
    {
        var currentUser = new TestCurrentUser(null, null);
        var behavior = new AuthorizationBehavior<PlainRequest, string>(currentUser);

        var result = await behavior.Handle(new PlainRequest(), _ => Task.FromResult("OK"), CancellationToken.None);

        Assert.Equal("OK", result);
    }

    [Fact]
    public async Task Handle_OrgRequiredRequest_ThrowsWhenOrgMissing()
    {
        var currentUser = new TestCurrentUser(null, Guid.NewGuid());
        var behavior = new AuthorizationBehavior<OrgRequiredRequest, string>(currentUser);

        await Assert.ThrowsAsync<ForbiddenAccessException>(() =>
            behavior.Handle(new OrgRequiredRequest(), _ => Task.FromResult("OK"), CancellationToken.None));
    }

    [Fact]
    public async Task Handle_UserRequiredRequest_ThrowsWhenUserMissing()
    {
        var currentUser = new TestCurrentUser(Guid.NewGuid(), null);
        var behavior = new AuthorizationBehavior<UserRequiredRequest, string>(currentUser);

        await Assert.ThrowsAsync<ForbiddenAccessException>(() =>
            behavior.Handle(new UserRequiredRequest(), _ => Task.FromResult("OK"), CancellationToken.None));
    }

    [Fact]
    public async Task Handle_OrgAndUserRequiredRequest_PassesWhenBothClaimsPresent()
    {
        var currentUser = new TestCurrentUser(Guid.NewGuid(), Guid.NewGuid());
        var behavior = new AuthorizationBehavior<OrgAndUserRequiredRequest, string>(currentUser);

        var result = await behavior.Handle(new OrgAndUserRequiredRequest(), _ => Task.FromResult("OK"), CancellationToken.None);

        Assert.Equal("OK", result);
    }

    private sealed class TestCurrentUser(Guid? orgId, Guid? userId) : ICurrentUser
    {
        public bool IsAuthenticated => userId.HasValue;
        public Guid? UserId => userId;
        public string? Email => "test@example.local";
        public Guid? OrganizationId => orgId;
        public string? Organization => orgId?.ToString();
        public Guid? RegionId => null;
        public string? Region => "1";
        public IReadOnlyCollection<string> Roles => ["VIEWER"];
    }
}
