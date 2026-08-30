using MediatR;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Exceptions;

namespace WaterOperations.Application.Common.Behaviors;

public sealed class AuthorizationBehavior<TRequest, TResponse>(ICurrentUser currentUser)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (request is IRequireOrganization && !currentUser.OrganizationId.HasValue)
        {
            throw new ForbiddenAccessException("An organization scope is required.");
        }

        if (request is IRequireUser && !currentUser.UserId.HasValue)
        {
            throw new ForbiddenAccessException("An authenticated user is required.");
        }

        return await next(cancellationToken);
    }
}
