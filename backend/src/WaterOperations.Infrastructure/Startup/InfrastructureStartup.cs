using Hangfire;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Infrastructure.Jobs;
using WaterOperations.Infrastructure.Messaging;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Infrastructure.Seeding;

namespace WaterOperations.Infrastructure.Startup;

public static class InfrastructureStartup
{
    public static async Task InitializeAsync(
        this WebApplication app,
        CancellationToken cancellationToken = default)
    {
        await using var scope = app.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<WaterOperationsDbContext>();

        if (app.Configuration["Testing"] == "true")
        {
            // Integration tests: schema-only, no migration history table needed.
            await db.Database.EnsureCreatedAsync(cancellationToken);
        }
        else
        {
            // All non-test environments (including production) apply pending migrations.
            await db.Database.MigrateAsync(cancellationToken);
        }

        if (app.Configuration.GetValue<bool>("Seed:Enabled"))
        {
            await ViewerSeed.SeedAsync(db, cancellationToken);
        }
    }

    public static void ScheduleRecurringJobs(this WebApplication app)
    {
        if (app.Configuration["Testing"] == "true")
        {
            return;
        }

        var recurringJobs = app.Services.GetService<IRecurringJobManager>();
        if (recurringJobs is null)
        {
            return;
        }
        recurringJobs.AddOrUpdate<SignalROutboxPublisherJob>(
            "outbox-publisher",
            job => job.PublishAsync(CancellationToken.None),
            "*/1 * * * *");
        recurringJobs.AddOrUpdate<ThresholdReevaluationJob>(
            "threshold-reevaluation",
            job => job.EvaluateAsync(CancellationToken.None),
            "*/1 * * * *");
        recurringJobs.AddOrUpdate<NotificationDeliveryJob>(
            "notification-delivery",
            job => job.PublishPendingAsync(CancellationToken.None),
            "*/1 * * * *");
        recurringJobs.AddOrUpdate<NotificationDigestJob>(
            "notification-digest",
            job => job.PublishDailyDigestsAsync(CancellationToken.None),
            "0 8 * * *");
    }
}
