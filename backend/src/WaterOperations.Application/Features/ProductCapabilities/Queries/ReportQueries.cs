using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.ProductCapabilities.Interfaces;

namespace WaterOperations.Application.Features.ProductCapabilities.Queries;

public sealed record GetReportQuery(Guid ReportId) : IQuery<ScopeResult<ReportDto>>, IRequireOrganization, IRequireUser;

public sealed class GetReportQueryHandler(IProductCapabilityRepository repository, ICurrentUser currentUser) : IQueryHandler<GetReportQuery, ScopeResult<ReportDto>>
{
    public async Task<ScopeResult<ReportDto>> Handle(GetReportQuery request, CancellationToken cancellationToken) =>
        (await repository.GetReportAsync(currentUser.OrganizationId!.Value, currentUser.UserId!.Value, request.ReportId, cancellationToken)) is { } report
            ? ScopeResult.Authorized(report)
            : ScopeResult.NotFound<ReportDto>();
}
