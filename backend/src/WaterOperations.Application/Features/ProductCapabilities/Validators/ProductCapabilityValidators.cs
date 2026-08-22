using FluentValidation;
using WaterOperations.Application.Common.Pagination;
using WaterOperations.Application.Features.ProductCapabilities.Queries;
using WaterOperations.Application.Features.ProductCapabilities.AI;

namespace WaterOperations.Application.Features.ProductCapabilities.Validators;

public sealed class ProductPaginationValidator<T> : AbstractValidator<T>
    where T : notnull
{ public ProductPaginationValidator() { } }
public sealed class SearchProductQueryValidator : AbstractValidator<SearchProductQuery>
{ public SearchProductQueryValidator() { RuleFor(x => x.Query).MinimumLength(2).MaximumLength(100); RuleFor(x => x.Pagination.Page).GreaterThan(0); RuleFor(x => x.Pagination.PageSize).InclusiveBetween(1, 100); } }
public sealed class GetAiInsightQueryValidator : AbstractValidator<GetAiInsightQuery>
{ public GetAiInsightQueryValidator() { RuleFor(x => x.StationId).NotEmpty(); RuleFor(x => x.InsightType).NotEmpty().MaximumLength(50); } }
