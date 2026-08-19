using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace WaterOperations.Infrastructure.Persistence;

public sealed class WaterOperationsDbContextFactory : IDesignTimeDbContextFactory<WaterOperationsDbContext>
{
    public WaterOperationsDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<WaterOperationsDbContext>()
            .UseNpgsql(Environment.GetEnvironmentVariable("ConnectionStrings__Default") ?? "Host=localhost;Database=water_operations")
            .Options;
        return new WaterOperationsDbContext(options);
    }
}
