namespace WaterOperations.Application.Common.Abstractions;

/// <summary>
/// Represents the identity and organizational context of the currently authenticated user.
/// </summary>
public interface ICurrentUser
{
    /// <summary>Whether the current request is authenticated.</summary>
    bool IsAuthenticated { get; }

    /// <summary>The authenticated user's unique identifier.</summary>
    Guid? UserId { get; }

    /// <summary>The authenticated user's email address.</summary>
    string? Email { get; }

    /// <summary>The organization ID the user belongs to.</summary>
    Guid? OrganizationId { get; }

    /// <summary>The organization name claim (string form).</summary>
    string? Organization { get; }

    /// <summary>The region ID the user is scoped to, if any.</summary>
    Guid? RegionId { get; }

    /// <summary>The region name claim (string form).</summary>
    string? Region { get; }

    /// <summary>All roles assigned to the current user.</summary>
    IReadOnlyCollection<string> Roles { get; }
}
