using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Application.Features.Operations.DTOs;
using WaterOperations.Application.Features.Operations.Interfaces;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1/thresholds"), Authorize(Policy = AuthorizationPolicies.OperatorOnly)]
public sealed class ThresholdController(IThresholdService thresholds) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(Guid stationId, int parameterId, CancellationToken cancellationToken) => Ok(await thresholds.ListAsync(stationId, parameterId, cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create(ThresholdRequest request, CancellationToken cancellationToken) => Ok(await thresholds.CreateAsync(request, cancellationToken));
}
