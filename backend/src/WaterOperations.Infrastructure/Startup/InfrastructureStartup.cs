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
        if (app.Configuration["Testing"] != "true"
            && !(app.Environment.IsDevelopment()
                && app.Configuration.GetValue<bool>("Seed:Enabled")))
        {
            return;
        }

        await using var scope = app.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<WaterOperationsDbContext>();
        if (app.Configuration["Testing"] == "true")
        {
            await db.Database.EnsureCreatedAsync(cancellationToken);
        }
        else
        {
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

        var recurringJobs = app.Services.GetRequiredService<IRecurringJobManager>();
        recurringJobs.AddOrUpdate<SignalROutboxPublisherJob>(
            "outbox-publisher",
            job => job.PublishAsync(CancellationToken.None),
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
