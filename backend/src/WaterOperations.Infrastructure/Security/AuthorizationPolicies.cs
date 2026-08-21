namespace WaterOperations.Infrastructure.Security;

public static class AuthorizationPolicies
{
    public const string ViewerOnly = "ViewerOnly";
    public const string OperatorOnly = "OperatorOnly";
    public const string AdminOnly = "AdminOnly";
    public const string ViewerRole = "VIEWER";
    public const string OperatorRole = "OPERATOR";
    public const string AdminRole = "ADMIN";
}
