using Microsoft.EntityFrameworkCore;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Infrastructure.Persistence;

/// <summary>
/// PostgreSQL-specific mappings kept separate from the generated EF model.
/// </summary>
public partial class WaterOperationsDbContext
{
    public DbSet<OutboxMessage> OutboxMessages { get; set; } = null!;
    public DbSet<ImportJob> ImportJobs { get; set; } = null!;

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OutboxMessage>(entity =>
        {
            entity.ToTable("OutboxMessage", "Integration");
            entity.HasKey(message => message.OutboxMessageId);
            entity.HasIndex(message => new { message.Status, message.AvailableAtUtc });
            entity.Property(message => message.OutboxMessageId).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(message => message.EventType).HasMaxLength(200).IsRequired();
            entity.Property(message => message.PayloadJson).HasColumnType("jsonb").IsRequired();
            entity.Property(message => message.Status).HasMaxLength(20).IsRequired();
        });
        modelBuilder.Entity<ImportJob>(entity =>
        {
            entity.ToTable("ImportJob", "Integration");
            entity.HasKey(job => job.ImportJobId);
            entity.HasIndex(job => new { job.Status, job.CreatedAtUtc });
            entity.Property(job => job.RequestJson).HasColumnType("jsonb").IsRequired();
            entity.Property(job => job.Status).HasMaxLength(20).IsRequired();
            entity.Property(job => job.LastError).HasMaxLength(4000);
        });
        modelBuilder.Entity<JobExecution>(entity =>
        {
            entity.ToTable("JobExecution", "Integration");
            entity.HasKey(job => job.JobExecutionId);
            entity.HasIndex(job => job.JobKey).IsUnique();
            entity.HasIndex(job => new { job.Status, job.AvailableAtUtc });
            entity.Property(job => job.JobExecutionId).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(job => job.JobKey).HasMaxLength(300).IsRequired();
            entity.Property(job => job.JobType).HasMaxLength(200).IsRequired();
            entity.Property(job => job.Status).HasMaxLength(20).IsRequired();
            entity.Property(job => job.LastError).HasMaxLength(4000);
        });
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.Property(e => e.BeforeJson).HasColumnType("jsonb");
            entity.Property(e => e.AfterJson).HasColumnType("jsonb");
            entity.Property(e => e.MetadataJson).HasColumnType("jsonb");
        });

        modelBuilder.Entity<DashboardLayout>(entity => entity.Property(e => e.WidgetsJson).HasColumnType("jsonb"));
        modelBuilder.Entity<FeatureSet>(entity => entity.Property(e => e.DefinitionJson).HasColumnType("jsonb"));
        modelBuilder.Entity<FeatureStoreEntry>(entity =>
            entity.Property(e => e.FeaturesJson).HasColumnType("jsonb"));
        modelBuilder.Entity<MeasurementRaw>(entity => entity.Property(e => e.PayloadJson).HasColumnType("jsonb"));
        modelBuilder.Entity<MlModel>(entity => entity.Property(e => e.MetricsJson).HasColumnType("jsonb"));
        modelBuilder.Entity<MlTrainingRun>(entity => entity.Property(e => e.MetricsJson).HasColumnType("jsonb"));
        modelBuilder.Entity<ReportSchedule>(entity => entity.Property(e => e.RecipientJson).HasColumnType("jsonb"));
        modelBuilder.Entity<ShareSnapshot>(entity => entity.Property(e => e.SnapshotJson).HasColumnType("jsonb"));
        modelBuilder.Entity<Station>(entity => entity.Property(e => e.MetadataJson).HasColumnType("jsonb"));

        // Explicit bytea concurrency is provider-neutral and avoids SQL Server rowversion semantics.
        // The application assigns a fresh token when a User is inserted or changed.
        modelBuilder.Entity<User>(entity => entity.Property(e => e.RowVersion)
            .HasColumnType("bytea")
            .IsConcurrencyToken()
            .ValueGeneratedNever());
    }
}
