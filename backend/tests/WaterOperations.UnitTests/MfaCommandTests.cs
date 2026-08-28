using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Features.Mfa.Commands;
using WaterOperations.Application.Features.Mfa.DTOs;
using WaterOperations.Application.Features.Mfa.Interfaces;

namespace WaterOperations.UnitTests;

public sealed class MfaCommandTests
{
    private readonly FakeMfaRepository repository = new();
    private readonly FakeCurrentUser user = new(Guid.NewGuid());

    [Fact]
    public async Task EnrollMfaCommandHandler_ReturnsEnrollment()
    {
        var handler = new EnrollMfaCommandHandler(repository, user);

        var result = await handler.Handle(new EnrollMfaCommand(), CancellationToken.None);

        Assert.True(result.IsAuthorized);
        Assert.NotNull(result.Value);
        Assert.Equal("JBSWY3DPEHPK3PXP", result.Value.Secret);
    }

    [Fact]
    public async Task VerifyMfaCommandHandler_ValidCode_ReturnsAuthorizedTrue()
    {
        var handler = new VerifyMfaCommandHandler(repository, user);

        var result = await handler.Handle(new VerifyMfaCommand("123456"), CancellationToken.None);

        Assert.True(result.IsAuthorized);
        Assert.True(result.Value);
    }

    [Fact]
    public async Task VerifyMfaCommandHandler_InvalidCode_ReturnsAuthorizedFalse()
    {
        var handler = new VerifyMfaCommandHandler(repository, user);

        var result = await handler.Handle(new VerifyMfaCommand("000000"), CancellationToken.None);

        Assert.True(result.IsAuthorized);
        Assert.False(result.Value);
    }

    [Fact]
    public async Task RecoverMfaCommandHandler_ValidCode_ReturnsAuthorizedTrue()
    {
        var handler = new RecoverMfaCommandHandler(repository, user);

        var result = await handler.Handle(new RecoverMfaCommand("REC-1234"), CancellationToken.None);

        Assert.True(result.IsAuthorized);
        Assert.True(result.Value);
    }

    private sealed class FakeMfaRepository : IMfaRepository
    {
        public Task<MfaEnrollment?> EnrollAsync(Guid userId, CancellationToken cancellationToken) =>
            Task.FromResult<MfaEnrollment?>(new MfaEnrollment("JBSWY3DPEHPK3PXP", ["REC-1234"], "ENROLLED"));

        public Task<bool> VerifyAsync(Guid userId, MfaVerification verification, CancellationToken cancellationToken) =>
            Task.FromResult(verification.Code == "123456");

        public Task<bool> RecoverAsync(Guid userId, MfaVerification verification, CancellationToken cancellationToken) =>
            Task.FromResult(verification.Code == "REC-1234");
    }

    private sealed class FakeCurrentUser(Guid userId) : ICurrentUser
    {
        public bool IsAuthenticated => true;
        public Guid? UserId => userId;
        public string? Email => "mfa@water.local";
        public Guid? OrganizationId => Guid.NewGuid();
        public string? Organization => "Org1";
        public Guid? RegionId => null;
        public string? Region => "1";
        public IReadOnlyCollection<string> Roles => ["VIEWER"];
    }
}
