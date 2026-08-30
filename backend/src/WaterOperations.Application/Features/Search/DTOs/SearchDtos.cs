namespace WaterOperations.Application.Features.Search.DTOs;

/// <summary>
/// Universal search result item.
/// </summary>
public sealed record SearchResultDto(
    string EntityType,
    string EntityId,
    string Title,
    string Subtitle);
