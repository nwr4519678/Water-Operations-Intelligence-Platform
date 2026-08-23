using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Api.Extensions;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.Administration.Commands;
using WaterOperations.Application.Features.Administration.Queries;
using WaterOperations.Application.Features.ProductCapabilities.Commands;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.ProductCapabilities.Queries;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1/admin"), Authorize(Roles = "ADMIN")]
public sealed class AdministrationController(ISender sender) : ControllerBase
{
    [HttpGet("audit")]
    public async Task<IActionResult> Audit([FromQuery] AuditFilter filter, [FromQuery] PaginationRequest pagination, CancellationToken ct) => (await sender.Send(new GetAuditQuery(filter, pagination), ct)).ToActionResult(this);

    [HttpGet("audit/export")]
    public async Task<IActionResult> ExportAudit([FromQuery] AuditFilter filter, CancellationToken ct)
    {
        var result = await sender.Send(new ExportAuditQuery(filter), ct);
        return result.IsAuthorized ? File(System.Text.Encoding.UTF8.GetBytes(result.Value!), "text/csv", "audit-log.csv") : Forbid();
    }

    [HttpGet("users")]
    public async Task<IActionResult> Users([FromQuery] PaginationRequest pagination, CancellationToken ct) => (await sender.Send(new GetUsersQuery(pagination), ct)).ToActionResult(this);

    [HttpGet("users/{userId:guid}/roles")]
    public async Task<IActionResult> UserRoles(Guid userId, CancellationToken ct) => (await sender.Send(new GetUserRolesQuery(userId), ct)).ToActionResult(this);

    [HttpPut("users/{userId:guid}/roles")]
    public async Task<IActionResult> AssignRole(Guid userId, [FromBody] AssignUserRoleRequest request, CancellationToken ct) => (await sender.Send(new AssignUserRoleCommand(userId, request.RoleId), ct)).ToActionResult(this);

    [HttpPatch("users/{userId:guid}/active")]
    public async Task<IActionResult> SetUserActive(Guid userId, [FromBody] SetUserActiveRequest request, CancellationToken ct) => (await sender.Send(new SetUserActiveCommand(userId, request.IsActive), ct)).ToActionResult(this);

    [HttpPost("users/{userId:guid}/sessions/revoke")]
    public async Task<IActionResult> RevokeSessions(Guid userId, CancellationToken ct) => (await sender.Send(new RevokeUserSessionsCommand(userId), ct)).ToActionResult(this);

    [HttpGet("organization")]
    public async Task<IActionResult> Organization(CancellationToken ct) => (await sender.Send(new GetOrganizationQuery(), ct)).ToActionResult(this);

    [HttpPut("organization")]
    public async Task<IActionResult> UpdateOrganization([FromBody] UpdateOrganizationCommand command, CancellationToken ct) => (await sender.Send(command, ct)).ToActionResult(this);

    [HttpGet("regions")]
    public async Task<IActionResult> Regions(CancellationToken ct) => (await sender.Send(new GetAdminRegionsQuery(), ct)).ToActionResult(this);

    [HttpPost("regions")]
    public async Task<IActionResult> CreateRegion([FromBody] CreateRegionCommand command, CancellationToken ct) => (await sender.Send(command, ct)).ToActionResult(this);

    [HttpPut("regions/{regionId:guid}")]
    public async Task<IActionResult> UpdateRegion(Guid regionId, [FromBody] UpdateRegionCommand command, CancellationToken ct) => (await sender.Send(command with { RegionId = regionId }, ct)).ToActionResult(this);

    [HttpPatch("regions/{regionId:guid}/active")]
    public async Task<IActionResult> SetRegionActive(Guid regionId, [FromBody] bool isActive, CancellationToken ct) => (await sender.Send(new SetRegionActiveCommand(regionId, isActive), ct)).ToActionResult(this);
}
