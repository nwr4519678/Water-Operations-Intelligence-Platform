namespace WaterOperations.Domain.Common.Primitives;

/// <summary>
/// Base class for all domain value objects.
/// Two value objects are equal if all their equality components are equal,
/// regardless of the order in which those components are enumerated.
/// </summary>
public abstract class ValueObject : IEquatable<ValueObject>
{
    /// <summary>Returns the values that define equality for this value object.</summary>
    protected abstract IEnumerable<object?> GetEqualityComponents();

    public bool Equals(ValueObject? other)
    {
        if (other is null || other.GetType() != GetType())
        {
            return false;
        }

        // Sort both component sequences to ensure order-independent comparison.
        var left = GetEqualityComponents()
            .OrderBy(c => c?.GetHashCode())
            .ToArray();
        var right = other.GetEqualityComponents()
            .OrderBy(c => c?.GetHashCode())
            .ToArray();

        return left.SequenceEqual(right, EqualityComparer<object?>.Default);
    }

    public override bool Equals(object? obj) =>
        obj is ValueObject other && Equals(other);

    public override int GetHashCode() =>
        GetEqualityComponents()
            .OrderBy(c => c?.GetHashCode())
            .Aggregate(17, (hash, value) => hash * 31 + (value?.GetHashCode() ?? 0));

    public static bool operator ==(ValueObject? left, ValueObject? right) =>
        left is null ? right is null : left.Equals(right);

    public static bool operator !=(ValueObject? left, ValueObject? right) =>
        !(left == right);
}
