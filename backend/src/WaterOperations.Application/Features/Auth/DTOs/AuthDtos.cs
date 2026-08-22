namespace WaterOperations.Application.Features.Auth.DTOs;

public sealed record LoginRequest(string Email, string Password);

public sealed record RefreshRequest(string RefreshToken);

public sealed record AuthResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn);
