using WaterOperations.Application.Features.Thresholds.Commands;
using WaterOperations.Application.Features.Thresholds.DTOs;
using Xunit;

namespace WaterOperations.UnitTests;

public sealed class ThresholdValidationAndReevaluationTests
{
    [Fact]
    public void ThresholdNumericHierarchy_Valid_ShouldPassValidation()
    {
        var validator = new CreateThresholdCommandValidator();
        var request = new CreateThresholdRequest(
            StationId: Guid.NewGuid(),
            ParameterId: 1,
            WarningLow: 10m,
            WarningHigh: 90m,
            CriticalLow: 5m,
            CriticalHigh: 95m,
            EffectiveFromUtc: DateTime.UtcNow,
            EffectiveToUtc: null);

        var result = validator.Validate(new CreateThresholdCommand(request));
        Assert.True(result.IsValid);
    }

    [Fact]
    public void ThresholdNumericHierarchy_InvalidLow_ShouldFailValidation()
    {
        var validator = new CreateThresholdCommandValidator();
        var request = new CreateThresholdRequest(
            StationId: Guid.NewGuid(),
            ParameterId: 1,
            WarningLow: 5m,
            WarningHigh: 90m,
            CriticalLow: 10m, // CriticalLow > WarningLow (Invalid!)
            CriticalHigh: 95m,
            EffectiveFromUtc: DateTime.UtcNow,
            EffectiveToUtc: null);

        var result = validator.Validate(new CreateThresholdCommand(request));
        Assert.False(result.IsValid);
    }
}
