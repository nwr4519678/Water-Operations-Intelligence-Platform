using Microsoft.AspNetCore.Mvc;
using WaterOperations.Application.Common.Contracts;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Ingestion.Commands;
using WaterOperations.Application.Features.Pipeline.Commands;
using WaterOperations.Application.Features.Auth.DTOs;
using WaterOperations.Application.Features.Mfa.Commands;
using WaterOperations.Application.Features.Telemetry.Queries;
using WaterOperations.Application.Features.Telemetry.DTOs;

namespace WaterOperations.Api.Extensions;

public static class ActionResultExtensions
{
    public static IActionResult ToAuthenticationResult(
        this AuthResponse? result,
        ControllerBase controller,
        string error) =>
        result is null ? controller.Unauthorized(new ErrorResponse(error)) : controller.Ok(result);

    public static IActionResult ToActionResult(
        this ChartQueryResult result,
        ControllerBase controller) =>
        !result.IsAuthorized
            ? controller.Forbid()
            : !result.IsValid
                ? controller.BadRequest(new ErrorResponse("invalid_time_range"))
                : result.Value is null
                    ? controller.NotFound()
                    : controller.Ok(result.Value);

    public static IActionResult ToTelemetryResult(
        this ScopeResult<TelemetryResponse> result,
        ControllerBase controller) =>
        !result.IsAuthorized
            ? controller.Forbid()
            : result.Value!.FixtureData is not null
                ? controller.Ok(result.Value.FixtureData)
                : controller.Ok(result.Value);

    public static IActionResult ToActionResult(
        this MfaCommandResult result,
        ControllerBase controller,
        string error) =>
        !result.IsAuthorized
            ? controller.Forbid()
            : result.Succeeded
                ? controller.NoContent()
                : controller.BadRequest(new ErrorResponse(error));

    public static IActionResult ToActionResult<T>(
        this ScopeResult<T> result,
        ControllerBase controller) =>
        !result.IsAuthorized
            ? controller.Forbid()
            : result.Value is null
                ? controller.NotFound()
                : controller.Ok(result.Value);

    public static IActionResult ToActionResult(
        this IngestionCommandResult result,
        ControllerBase controller) =>
        !result.IsAuthorized
            ? controller.Forbid()
            : !result.IsValid
                ? controller.BadRequest(new ErrorResponse(result.ErrorCode ?? "invalid_file"))
                : result.DuplicateResponse is not null
                    ? controller.Ok(result.DuplicateResponse)
                    : controller.Accepted(result.Value);

    public static IActionResult ToActionResult(
        this PipelineCommandResult result,
        ControllerBase controller) =>
        !result.IsAuthorized
            ? controller.Forbid()
            : !result.IsValid
                ? controller.BadRequest(new ErrorResponse("invalid_pipeline_contract"))
                : controller.Ok(result.Value);
}
