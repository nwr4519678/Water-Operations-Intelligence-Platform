using Microsoft.AspNetCore.Mvc;
using WaterOperations.Application.Common.Contracts;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.Auth.DTOs;
using WaterOperations.Application.Features.Ingestion.Commands;
using WaterOperations.Application.Features.Pipeline.Commands;

namespace WaterOperations.Api.Extensions;

public static class ActionResultExtensions
{
    public static IActionResult ToAuthenticationResult(
        this AuthResponse? result,
        ControllerBase controller,
        string error) =>
        result is null ? controller.Unauthorized(new ErrorResponse(error)) : controller.Ok(result);

    public static IActionResult ToActionResult(
        this ScopeResult<bool> result,
        ControllerBase controller,
        string error) =>
        result.IsAuthorized
            ? (result.Value ? controller.NoContent() : controller.BadRequest(new ErrorResponse(error)))
            : result.IsNotFound
                ? controller.NotFound()
                : controller.Forbid();

    public static IActionResult ToActionResult<T>(
        this ScopeResult<T> result,
        ControllerBase controller) =>
        result.IsAuthorized
            ? (result.Value is null ? controller.NotFound() : controller.Ok(result.Value))
            : result.IsNotFound
                ? controller.NotFound()
                : controller.Forbid();

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
