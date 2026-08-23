using FluentValidation;
using FluentValidation.Results;
using MediatR;
using WaterOperations.Application.Common.Behaviors;

namespace WaterOperations.UnitTests;

public sealed class ValidationBehaviorTests
{
    private sealed record TestRequest(string Name) : IRequest<string>;

    [Fact]
    public async Task Handle_WhenNoValidators_CallsNext()
    {
        var behavior = new ValidationBehavior<TestRequest, string>([]);
        var request = new TestRequest("Test");

        var result = await behavior.Handle(request, _ => Task.FromResult("Success"), CancellationToken.None);

        Assert.Equal("Success", result);
    }

    [Fact]
    public async Task Handle_WhenValidationFails_ThrowsValidationException()
    {
        var validator = new TestRequestValidator();
        var behavior = new ValidationBehavior<TestRequest, string>([validator]);
        var request = new TestRequest(string.Empty);

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            behavior.Handle(request, _ => Task.FromResult("Success"), CancellationToken.None));

        Assert.Single(exception.Errors);
        Assert.Equal("Name is required.", exception.Errors.First().ErrorMessage);
    }

    [Fact]
    public async Task Handle_WhenValidationPasses_CallsNext()
    {
        var validator = new TestRequestValidator();
        var behavior = new ValidationBehavior<TestRequest, string>([validator]);
        var request = new TestRequest("ValidName");

        var result = await behavior.Handle(request, _ => Task.FromResult("Success"), CancellationToken.None);

        Assert.Equal("Success", result);
    }

    private sealed class TestRequestValidator : AbstractValidator<TestRequest>
    {
        public TestRequestValidator()
        {
            RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required.");
        }
    }
}
