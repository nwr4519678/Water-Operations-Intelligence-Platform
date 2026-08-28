using System.Text.Json;
using FluentValidation;
using Serilog;
using WaterOperations.Api.Contracts;
using WaterOperations.Application.Common.Exceptions;

namespace WaterOperations.Api.Middleware;

/// <summary>
/// Global exception handling middleware converting domain and system exceptions into standardized API envelopes.
/// </summary>
public sealed class ExceptionHandlingMiddleware(
    RequestDelegate next,
    IHostEnvironment environment)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ValidationException exception)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";

            var validationErrors = exception.Errors
                .GroupBy(x => x.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(y => y.ErrorMessage).ToArray());

            var envelope = new
            {
                success = false,
                errorCode = "VALIDATION_FAILED",
                message = "One or more validation errors occurred.",
                errors = validationErrors,
                traceId = context.TraceIdentifier
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(envelope, JsonOptions));
        }
        catch (NotFoundException exception)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsync(JsonSerializer.Serialize(
                ApiEnvelope.Fail<object>("NOT_FOUND", exception.Message, context.TraceIdentifier), JsonOptions));
        }
        catch (ForbiddenAccessException)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsync(JsonSerializer.Serialize(
                ApiEnvelope.Fail<object>("FORBIDDEN", "Access to the requested resource is forbidden.", context.TraceIdentifier), JsonOptions));
        }
        catch (DomainConflictException exception)
        {
            context.Response.StatusCode = StatusCodes.Status409Conflict;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsync(JsonSerializer.Serialize(
                ApiEnvelope.Fail<object>(exception.ErrorCode, exception.Message, context.TraceIdentifier), JsonOptions));
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            context.Response.StatusCode = StatusCodes.Status409Conflict;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsync(JsonSerializer.Serialize(
                ApiEnvelope.Fail<object>("alarm_state_conflict", "The resource was modified concurrently by another operation.", context.TraceIdentifier), JsonOptions));
        }
        catch (UnprocessableEntityException exception)
        {
            context.Response.StatusCode = StatusCodes.Status422UnprocessableEntity;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsync(JsonSerializer.Serialize(
                ApiEnvelope.Fail<object>(exception.ErrorCode, exception.Message, context.TraceIdentifier), JsonOptions));
        }
        catch (Exception exception)
        {
            Log.Error(exception, "Unhandled exception for trace {TraceId}", context.TraceIdentifier);

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";

            var message = environment.IsDevelopment()
                ? $"[{exception.GetType().Name}] {exception.Message}"
                : "An unexpected server error occurred. Please contact support if this persists.";

            await context.Response.WriteAsync(JsonSerializer.Serialize(
                ApiEnvelope.Fail<object>("INTERNAL_ERROR", message, context.TraceIdentifier), JsonOptions));
        }
    }
}
