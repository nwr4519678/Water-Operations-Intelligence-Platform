namespace WaterOperations.Application.Common.Abstractions;

public interface ICorrelationContext
{
    string CorrelationId { get; }
}
