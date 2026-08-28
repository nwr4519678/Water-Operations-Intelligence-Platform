using FluentValidation;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Common.Security;
using WaterOperations.Application.Features.Charts.DTOs;
using WaterOperations.Application.Features.Charts.Interfaces;

namespace WaterOperations.Application.Features.Charts.Commands;

public sealed record CreateChartAnnotationCommand(Guid StationId, CreateChartAnnotationRequest Request)
    : ICommand<ScopeResult<ChartAnnotationDto>>, IRequireOrganization, IRequireUser;

public sealed record DeleteChartAnnotationCommand(long AnnotationId)
    : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;

public sealed class CreateChartAnnotationCommandValidator : AbstractValidator<CreateChartAnnotationCommand>
{
    public CreateChartAnnotationCommandValidator()
    {
        RuleFor(x => x.StationId).NotEmpty();
        RuleFor(x => x.Request).NotNull();
        RuleFor(x => x.Request.Text).NotEmpty().MaximumLength(1000);
        RuleFor(x => x.Request.TimestampUtc).LessThanOrEqualTo(DateTime.UtcNow.AddMinutes(5));
    }
}

public sealed class CreateChartAnnotationCommandHandler(
    IChartAnnotationRepository repository,
    IStationAuthorizationService authorizationService,
    ICurrentUser user) : ICommandHandler<CreateChartAnnotationCommand, ScopeResult<ChartAnnotationDto>>
{
    public async Task<ScopeResult<ChartAnnotationDto>> Handle(CreateChartAnnotationCommand request, CancellationToken cancellationToken)
    {
        await authorizationService.DirectGuardStationAsync(request.StationId, cancellationToken);

        var result = await repository.CreateAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.StationId,
            request.Request,
            cancellationToken);

        return ScopeResult.Authorized(result);
    }
}

public sealed class DeleteChartAnnotationCommandHandler(
    IChartAnnotationRepository repository,
    ICurrentUser user) : ICommandHandler<DeleteChartAnnotationCommand, ScopeResult<bool>>
{
    public async Task<ScopeResult<bool>> Handle(DeleteChartAnnotationCommand request, CancellationToken cancellationToken)
    {
        var succeeded = await repository.DeleteAsync(
            user.OrganizationId!.Value,
            user.UserId!.Value,
            request.AnnotationId,
            cancellationToken);

        return ScopeResult.Authorized(succeeded);
    }
}
