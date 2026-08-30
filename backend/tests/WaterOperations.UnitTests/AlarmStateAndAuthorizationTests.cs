using WaterOperations.Domain.Entities;
using Xunit;

namespace WaterOperations.UnitTests;

public sealed class AlarmStateAndAuthorizationTests
{
    [Fact]
    public void Alarm_InitialState_ShouldBeActive()
    {
        var alarm = new Alarm
        {
            AlarmId = Guid.NewGuid(),
            Status = "ACTIVE"
        };

        Assert.Equal("ACTIVE", alarm.Status);
    }

    [Theory]
    [InlineData("ACTIVE", "ACKNOWLEDGED", true)]
    [InlineData("ACKNOWLEDGED", "RESOLVED", true)]
    [InlineData("RESOLVED", "ACTIVE", true)]
    [InlineData("RESOLVED", "ACKNOWLEDGED", false)]
    [InlineData("ACTIVE", "RESOLVED", false)]
    public void AlarmStateTransition_RuleCheck(string currentStatus, string targetStatus, bool isLegal)
    {
        var legal = (currentStatus, targetStatus) switch
        {
            ("ACTIVE", "ACKNOWLEDGED") => true,
            ("ACKNOWLEDGED", "RESOLVED") => true,
            ("RESOLVED", "ACTIVE") => true,
            _ => false
        };

        Assert.Equal(isLegal, legal);
    }
}
