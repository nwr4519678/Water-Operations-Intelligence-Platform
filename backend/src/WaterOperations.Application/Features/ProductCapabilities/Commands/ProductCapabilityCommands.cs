using FluentValidation;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.ProductCapabilities.Interfaces;

#pragma warning disable CA1725

namespace WaterOperations.Application.Features.ProductCapabilities.Commands;

public sealed record MarkNotificationReadCommand(long NotificationId) : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;
public sealed record SaveDashboardLayoutCommand(string Name, string WidgetsJson, bool IsDefault) : ICommand<ScopeResult<bool>>, IRequireUser;
public sealed record AddCollaborationNoteCommand(Guid StationId, string NoteText) : ICommand<ScopeResult<CollaborationNoteDto>>, IRequireOrganization, IRequireUser;
public sealed record CreateShareSnapshotCommand(Guid? StationId, string SnapshotJson, int ExpiresInHours = 24) : ICommand<ScopeResult<SharedSnapshotDto>>, IRequireOrganization, IRequireUser;
public sealed record CreateReportScheduleCommand(string Frequency, string Format, string RecipientJson, DateTime NextRunAtUtc) : ICommand<ScopeResult<ReportScheduleDto>>, IRequireOrganization, IRequireUser;

public sealed class MarkNotificationReadCommandValidator : AbstractValidator<MarkNotificationReadCommand>
{ public MarkNotificationReadCommandValidator() => RuleFor(x => x.NotificationId).GreaterThan(0); }
public sealed class SaveDashboardLayoutCommandValidator : AbstractValidator<SaveDashboardLayoutCommand>
{ public SaveDashboardLayoutCommandValidator() { RuleFor(x => x.Name).NotEmpty().MaximumLength(100); RuleFor(x => x.WidgetsJson).NotEmpty().MaximumLength(100_000); } }
public sealed class AddCollaborationNoteCommandValidator : AbstractValidator<AddCollaborationNoteCommand>
{ public AddCollaborationNoteCommandValidator() { RuleFor(x => x.StationId).NotEmpty(); RuleFor(x => x.NoteText).NotEmpty().MaximumLength(2000); } }
public sealed class CreateShareSnapshotCommandValidator : AbstractValidator<CreateShareSnapshotCommand>
{ public CreateShareSnapshotCommandValidator() { RuleFor(x => x.SnapshotJson).NotEmpty().MaximumLength(1_000_000); RuleFor(x => x.ExpiresInHours).InclusiveBetween(1, 168); } }
public sealed class CreateReportScheduleCommandValidator : AbstractValidator<CreateReportScheduleCommand>
{ public CreateReportScheduleCommandValidator() { RuleFor(x => x.Frequency).Must(x => new[] { "DAILY", "WEEKLY", "MONTHLY" }.Contains(x.ToUpperInvariant())).WithMessage("Frequency must be DAILY, WEEKLY, or MONTHLY."); RuleFor(x => x.Format).Must(x => new[] { "CSV", "PDF" }.Contains(x.ToUpperInvariant())); RuleFor(x => x.RecipientJson).NotEmpty().MaximumLength(10_000); } }
public sealed class MarkNotificationReadCommandHandler(IProductCapabilityRepository repository, WaterOperations.Application.Common.Abstractions.ICurrentUser user) : ICommandHandler<MarkNotificationReadCommand, ScopeResult<bool>>
{ public async Task<ScopeResult<bool>> Handle(MarkNotificationReadCommand r, CancellationToken ct) => ScopeResult.Authorized(await repository.MarkNotificationReadAsync(user.OrganizationId!.Value, user.UserId!.Value, r.NotificationId, ct)); }
public sealed class SaveDashboardLayoutCommandHandler(IProductCapabilityRepository repository, WaterOperations.Application.Common.Abstractions.ICurrentUser user) : ICommandHandler<SaveDashboardLayoutCommand, ScopeResult<bool>>
{ public async Task<ScopeResult<bool>> Handle(SaveDashboardLayoutCommand r, CancellationToken ct) => ScopeResult.Authorized(await repository.SaveLayoutAsync(user.UserId!.Value, r.Name, r.WidgetsJson, r.IsDefault, ct)); }
public sealed class AddCollaborationNoteCommandHandler(IProductCapabilityRepository repository, WaterOperations.Application.Common.Abstractions.ICurrentUser user) : ICommandHandler<AddCollaborationNoteCommand, ScopeResult<CollaborationNoteDto>>
{ public async Task<ScopeResult<CollaborationNoteDto>> Handle(AddCollaborationNoteCommand r, CancellationToken ct) => ScopeResult.Authorized(await repository.AddNoteAsync(user.OrganizationId!.Value, user.UserId!.Value, r.StationId, r.NoteText, ct)); }
public sealed class CreateShareSnapshotCommandHandler(IProductCapabilityRepository repository, WaterOperations.Application.Common.Abstractions.ICurrentUser user) : ICommandHandler<CreateShareSnapshotCommand, ScopeResult<SharedSnapshotDto>>
{ public async Task<ScopeResult<SharedSnapshotDto>> Handle(CreateShareSnapshotCommand r, CancellationToken ct) => ScopeResult.Authorized(await repository.CreateSnapshotAsync(user.OrganizationId!.Value, user.UserId!.Value, r.StationId, r.SnapshotJson, r.ExpiresInHours, ct)); }
public sealed class CreateReportScheduleCommandHandler(IProductCapabilityRepository repository, WaterOperations.Application.Common.Abstractions.ICurrentUser user) : ICommandHandler<CreateReportScheduleCommand, ScopeResult<ReportScheduleDto>>
{ public async Task<ScopeResult<ReportScheduleDto>> Handle(CreateReportScheduleCommand r, CancellationToken ct) => ScopeResult.Authorized(await repository.CreateReportScheduleAsync(user.OrganizationId!.Value, user.UserId!.Value, r.Frequency.ToUpperInvariant(), r.Format.ToUpperInvariant(), r.RecipientJson, r.NextRunAtUtc, ct)); }

#pragma warning restore CA1725
