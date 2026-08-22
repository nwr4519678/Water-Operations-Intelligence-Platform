using System.Text.Json;
using FluentValidation;
using Serilog;
using WaterOperations.Api.Contracts;
using WaterOperations.Application.Common.Exceptions;

namespace WaterOperations.Api.Middleware;

public sealed class ExceptionHandlingMiddleware(RequestDelegate next, IHostEnvironment environment)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ValidationException exception)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(
                new
                {
                    error = "validation_failed",
                    errors = exception.Errors.GroupBy(x => x.PropertyName)
                        .ToDictionary(x => x.Key, x => x.Select(y => y.ErrorMessage).ToArray())
                }, JsonOptions));
        }
        catch (ForbiddenAccessException)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
        }
        catch (Exception exception)
        {
            Log.Error(exception, "Unhandled exception for trace {TraceId}", context.TraceIdentifier);
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            var message = environment.IsDevelopment()
                ? "An unexpected error occurred."
                : "An unexpected server error occurred.";
            await context.Response.WriteAsync(JsonSerializer.Serialize(
                ApiEnvelope.Fail<object>("INTERNAL_ERROR", message, context.TraceIdentifier), JsonOptions));
        }
    }
}
