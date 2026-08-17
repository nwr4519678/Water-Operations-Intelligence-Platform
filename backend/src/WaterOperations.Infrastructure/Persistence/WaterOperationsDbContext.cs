using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Abstractions;

namespace WaterOperations.Infrastructure.Persistence;

public sealed class WaterOperationsDbContext(DbContextOptions<WaterOperationsDbContext> options) : DbContext(options), IUnitOfWork
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(WaterOperationsDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
