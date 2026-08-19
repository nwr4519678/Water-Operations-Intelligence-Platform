using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Infrastructure.Persistence;

internal sealed class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
{
    public void Configure(EntityTypeBuilder<Organization> b) { b.HasKey(x => x.Id); b.Property(x => x.Name).HasMaxLength(200).IsRequired(); b.HasIndex(x => x.Name).IsUnique(); }
}
internal sealed class RegionConfiguration : IEntityTypeConfiguration<Region>
{
    public void Configure(EntityTypeBuilder<Region> b) { b.HasKey(x => x.Id); b.Property(x => x.Name).HasMaxLength(200).IsRequired(); b.HasOne(x => x.Organization).WithMany(x => x.Regions).HasForeignKey(x => x.OrganizationId).OnDelete(DeleteBehavior.Cascade); b.HasIndex(x => new { x.OrganizationId, x.Name }).IsUnique(); }
}
internal sealed class StationConfiguration : IEntityTypeConfiguration<Station>
{
    public void Configure(EntityTypeBuilder<Station> b) { b.HasKey(x => x.Id); b.Property(x => x.Name).HasMaxLength(200).IsRequired(); b.HasOne(x => x.Region).WithMany(x => x.Stations).HasForeignKey(x => x.RegionId).OnDelete(DeleteBehavior.Cascade); b.HasIndex(x => new { x.RegionId, x.Name }).IsUnique(); }
}
internal sealed class MeasurementConfiguration : IEntityTypeConfiguration<Measurement>
{
    public void Configure(EntityTypeBuilder<Measurement> b) { b.HasKey(x => x.Id); b.Property(x => x.Unit).HasMaxLength(32).IsRequired(); b.Property(x => x.Value).HasPrecision(18, 4); b.HasOne(x => x.Station).WithMany(x => x.Measurements).HasForeignKey(x => x.StationId).OnDelete(DeleteBehavior.Cascade); b.HasIndex(x => new { x.StationId, x.RecordedAt }); }
}
internal sealed class AlarmConfiguration : IEntityTypeConfiguration<Alarm>
{
    public void Configure(EntityTypeBuilder<Alarm> b) { b.HasKey(x => x.Id); b.Property(x => x.Severity).HasMaxLength(32).IsRequired(); b.Property(x => x.Message).HasMaxLength(500).IsRequired(); b.HasOne(x => x.Station).WithMany(x => x.Alarms).HasForeignKey(x => x.StationId).OnDelete(DeleteBehavior.Cascade); b.HasIndex(x => new { x.StationId, x.RaisedAt }); }
}
