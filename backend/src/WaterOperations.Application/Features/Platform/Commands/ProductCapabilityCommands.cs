using FluentValidation;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Application.Common.Results;
using WaterOperations.Application.Features.ProductCapabilities.DTOs;
using WaterOperations.Application.Features.ProductCapabilities.Interfaces;

#pragma warning disable CA1725

namespace WaterOperations.Application.Features.ProductCapabilities.Commands;

public sealed record MarkNotificationReadCommand(long NotificationId) : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;
public sealed record SaveDashboardLayoutCommand(string Name, string WidgetsJson, bool IsDefault) : ICommand<ScopeResult<bool>>, IRequireUser;
public sealed record AddCollaborationNoteCommand(Guid StationId, long? ParentNoteId, string NoteText) : ICommand<ScopeResult<CollaborationNoteDto>>, IRequireOrganization, IRequireUser;
public sealed record UpdateCollaborationNoteCommand(long NoteId, string NoteText, bool IsResolved) : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;
public sealed record CreateShareSnapshotCommand(Guid? StationId, string SnapshotJson, int ExpiresInHours = 24) : ICommand<ScopeResult<SharedSnapshotDto>>, IRequireOrganization, IRequireUser;
public sealed record RevokeShareSnapshotCommand(Guid SnapshotId) : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;
public sealed record CreateReportScheduleCommand(string Frequency, string Format, string RecipientJson, DateTime NextRunAtUtc) : ICommand<ScopeResult<ReportScheduleDto>>, IRequireOrganization, IRequireUser;
public sealed record UpdateOrganizationCommand(string Name, string? LogoUrl, string Locale, string TimeZone) : ICommand<ScopeResult<bool>>, IRequireOrganization;
public sealed record SetUserActiveCommand(Guid UserId, bool IsActive) : ICommand<ScopeResult<bool>>, IRequireOrganization;
public sealed record UpdateUserPreferencesCommand(string Theme, string Locale, string TimeZone, byte DecimalPrecision) : ICommand<ScopeResult<bool>>, IRequireOrganization, IRequireUser;
public sealed record SaveNotificationPreferenceCommand(NotificationPreferenceDto Preference) : ICommand<ScopeResult<bool>>, IRequireUser;

public sealed class MarkNotificationReadCommandValidator : AbstractValidator<MarkNotificationReadCommand>
{ public MarkNotificationReadCommandValidator() => RuleFor(x => x.NotificationId).GreaterThan(0); }
public sealed class SaveDashboardLayoutCommandValidator : AbstractValidator<SaveDashboardLayoutCommand>
{ public SaveDashboardLayoutCommandValidator() { RuleFor(x => x.Name).NotEmpty().MaximumLength(100); RuleFor(x => x.WidgetsJson).NotEmpty().MaximumLength(100_000); } }
public sealed class AddCollaborationNoteCommandValidator : AbstractValidator<AddCollaborationNoteCommand>
{ public AddCollaborationNoteCommandValidator() { RuleFor(x => x.StationId).NotEmpty(); RuleFor(x => x.NoteText).NotEmpty().MaximumLength(2000); RuleFor(x => x.ParentNoteId).GreaterThan(0).When(x => x.ParentNoteId.HasValue); } }
public sealed class UpdateCollaborationNoteCommandValidator : AbstractValidator<UpdateCollaborationNoteCommand>
{ public UpdateCollaborationNoteCommandValidator() { RuleFor(x => x.NoteId).GreaterThan(0); RuleFor(x => x.NoteText).NotEmpty().MaximumLength(2000); } }
public sealed class CreateShareSnapshotCommandValidator : AbstractValidator<CreateShareSnapshotCommand>
{ public CreateShareSnapshotCommandValidator() { RuleFor(x => x.SnapshotJson).NotEmpty().MaximumLength(1_000_000); RuleFor(x => x.ExpiresInHours).InclusiveBetween(1, 168); } }
public sealed class RevokeShareSnapshotCommandValidator : AbstractValidator<RevokeShareSnapshotCommand>
{ public RevokeShareSnapshotCommandValidator() => RuleFor(x => x.SnapshotId).NotEmpty(); }
public sealed class CreateReportScheduleCommandValidator : AbstractValidator<CreateReportScheduleCommand>
{ public CreateReportScheduleCommandValidator() { RuleFor(x => x.Frequency).Must(x => new[] { "DAILY", "WEEKLY", "MONTHLY" }.Contains(x.ToUpperInvariant())).WithMessage("Frequency must be DAILY, WEEKLY, or MONTHLY."); RuleFor(x => x.Format).Must(x => new[] { "CSV", "PDF" }.Contains(x.ToUpperInvariant())); RuleFor(x => x.RecipientJson).NotEmpty().MaximumLength(10_000); } }
public sealed class UpdateOrganizationCommandValidator : AbstractValidator<UpdateOrganizationCommand>
{ public UpdateOrganizationCommandValidator() { RuleFor(x => x.Name).NotEmpty().MaximumLength(200); RuleFor(x => x.Locale).NotEmpty().MaximumLength(10); RuleFor(x => x.TimeZone).NotEmpty().MaximumLength(100); RuleFor(x => x.LogoUrl).MaximumLength(2000); } }
public sealed class SetUserActiveCommandValidator : AbstractValidator<SetUserActiveCommand>
{ public SetUserActiveCommandValidator() => RuleFor(x => x.UserId).NotEmpty(); }
public sealed class UpdateUserPreferencesCommandValidator : AbstractValidator<UpdateUserPreferencesCommand>
{ public UpdateUserPreferencesCommandValidator() { RuleFor(x => x.Theme).Must(x => new[] { "LIGHT", "DARK", "SYSTEM" }.Contains(x.ToUpperInvariant())); RuleFor(x => x.Locale).NotEmpty().MaximumLength(10); RuleFor(x => x.TimeZone).NotEmpty().MaximumLength(100); RuleFor(x => x.DecimalPrecision).InclusiveBetween((byte)0, (byte)8); } }
public sealed class SaveNotificationPreferenceCommandValidator : AbstractValidator<SaveNotificationPreferenceCommand>
{ public SaveNotificationPreferenceCommandValidator() { RuleFor(x => x.Preference.Severity).NotEmpty().MaximumLength(20); } }
public sealed class MarkNotificationReadCommandHandler(INotificationRepository repository, WaterOperations.Application.Common.Abstractions.ICurrentUser user) : ICommandHandler<MarkNotificationReadCommand, ScopeResult<bool>>
{ public async Task<ScopeResult<bool>> Handle(MarkNotificationReadCommand r, CancellationToken ct) => ScopeResult.Authorized(await repository.MarkNotificationReadAsync(user.OrganizationId!.Value, user.UserId!.Value, r.NotificationId, ct)); }
public sealed class SaveDashboardLayoutCommandHandler(IAdministrationRepository repository, WaterOperations.Application.Common.Abstractions.ICurrentUser user) : ICommandHandler<SaveDashboardLayoutCommand, ScopeResult<bool>>
{ public async Task<ScopeResult<bool>> Handle(SaveDashboardLayoutCommand r, CancellationToken ct) => ScopeResult.Authorized(await repository.SaveLayoutAsync(user.UserId!.Value, r.Name, r.WidgetsJson, r.IsDefault, ct)); }
public sealed class AddCollaborationNoteCommandHandler(ICollaborationRepository repository, WaterOperations.Application.Common.Abstractions.ICurrentUser user) : ICommandHandler<AddCollaborationNoteCommand, ScopeResult<CollaborationNoteDto>>
{ public async Task<ScopeResult<CollaborationNoteDto>> Handle(AddCollaborationNoteCommand r, CancellationToken ct) => ScopeResult.Authorized(await repository.AddNoteAsync(user.OrganizationId!.Value, user.UserId!.Value, r.StationId, r.ParentNoteId, r.NoteText, ct)); }
public sealed class UpdateCollaborationNoteCommandHandler(ICollaborationRepository repository, WaterOperations.Application.Common.Abstractions.ICurrentUser user) : ICommandHandler<UpdateCollaborationNoteCommand, ScopeResult<bool>>
{ public async Task<ScopeResult<bool>> Handle(UpdateCollaborationNoteCommand r, CancellationToken ct) => ScopeResult.Authorized(await repository.UpdateNoteAsync(user.OrganizationId!.Value, user.UserId!.Value, r.NoteId, r.NoteText, r.IsResolved, ct)); }
public sealed class CreateShareSnapshotCommandHandler(ICollaborationRepository repository, WaterOperations.Application.Common.Abstractions.ICurrentUser user) : ICommandHandler<CreateShareSnapshotCommand, ScopeResult<SharedSnapshotDto>>
{ public async Task<ScopeResult<SharedSnapshotDto>> Handle(CreateShareSnapshotCommand r, CancellationToken ct) => ScopeResult.Authorized(await repository.CreateSnapshotAsync(user.OrganizationId!.Value, user.UserId!.Value, r.StationId, r.SnapshotJson, r.ExpiresInHours, ct)); }
public sealed class RevokeShareSnapshotCommandHandler(ICollaborationRepository repository, WaterOperations.Application.Common.Abstractions.ICurrentUser user) : ICommandHandler<RevokeShareSnapshotCommand, ScopeResult<bool>>
{ public async Task<ScopeResult<bool>> Handle(RevokeShareSnapshotCommand r, CancellationToken ct) => ScopeResult.Authorized(await repository.RevokeSnapshotAsync(user.OrganizationId!.Value, user.UserId!.Value, r.SnapshotId, ct)); }
public sealed class CreateReportScheduleCommandHandler(IReportRepository repository, WaterOperations.Application.Common.Abstractions.ICurrentUser user, Reports.IReportJobScheduler scheduler) : ICommandHandler<CreateReportScheduleCommand, ScopeResult<ReportScheduleDto>>
{ public async Task<ScopeResult<ReportScheduleDto>> Handle(CreateReportScheduleCommand r, CancellationToken ct) { var schedule = await repository.CreateReportScheduleAsync(user.OrganizationId!.Value, user.UserId!.Value, r.Frequency.ToUpperInvariant(), r.Format.ToUpperInvariant(), r.RecipientJson, r.NextRunAtUtc, ct); scheduler.ScheduleRecurring(schedule.Id, schedule.Frequency); return ScopeResult.Authorized(schedule); } }
public sealed class UpdateOrganizationCommandHandler(IAdministrationRepository repository, WaterOperations.Application.Common.Abstractions.ICurrentUser user) : ICommandHandler<UpdateOrganizationCommand, ScopeResult<bool>>
{ public async Task<ScopeResult<bool>> Handle(UpdateOrganizationCommand r, CancellationToken ct) => ScopeResult.Authorized(await repository.UpdateOrganizationAsync(user.OrganizationId!.Value, r.Name, r.LogoUrl, r.Locale, r.TimeZone, ct)); }
public sealed class SetUserActiveCommandHandler(IAdministrationRepository repository, WaterOperations.Application.Common.Abstractions.ICurrentUser user) : ICommandHandler<SetUserActiveCommand, ScopeResult<bool>>
{ public async Task<ScopeResult<bool>> Handle(SetUserActiveCommand r, CancellationToken ct) => ScopeResult.Authorized(await repository.SetUserActiveAsync(user.OrganizationId!.Value, r.UserId, r.IsActive, ct)); }
public sealed class UpdateUserPreferencesCommandHandler(IAdministrationRepository repository, WaterOperations.Application.Common.Abstractions.ICurrentUser user) : ICommandHandler<UpdateUserPreferencesCommand, ScopeResult<bool>>
{ public async Task<ScopeResult<bool>> Handle(UpdateUserPreferencesCommand r, CancellationToken ct) => ScopeResult.Authorized(await repository.UpdateUserPreferencesAsync(user.OrganizationId!.Value, user.UserId!.Value, r.Theme.ToUpperInvariant(), r.Locale, r.TimeZone, r.DecimalPrecision, ct)); }
public sealed class SaveNotificationPreferenceCommandHandler(INotificationRepository repository, WaterOperations.Application.Common.Abstractions.ICurrentUser user) : ICommandHandler<SaveNotificationPreferenceCommand, ScopeResult<bool>>
{ public async Task<ScopeResult<bool>> Handle(SaveNotificationPreferenceCommand r, CancellationToken ct) => ScopeResult.Authorized(await repository.SaveNotificationPreferenceAsync(user.OrganizationId!.Value, user.UserId!.Value, r.Preference, ct)); }

#pragma warning restore CA1725
