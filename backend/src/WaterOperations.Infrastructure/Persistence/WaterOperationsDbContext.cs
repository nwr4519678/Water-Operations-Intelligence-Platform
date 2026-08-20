using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Domain.Entities;

namespace WaterOperations.Infrastructure.Persistence;

public sealed class WaterOperationsDbContext(DbContextOptions<WaterOperationsDbContext> options) : DbContext(options), IUnitOfWork
{
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Region> Regions => Set<Region>();
    public DbSet<Station> Stations => Set<Station>();
    public DbSet<Measurement> Measurements => Set<Measurement>();
    public DbSet<Alarm> Alarms => Set<Alarm>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(WaterOperationsDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
