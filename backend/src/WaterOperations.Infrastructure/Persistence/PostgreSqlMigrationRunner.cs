using Microsoft.EntityFrameworkCore;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Persistence;

public interface IPostgreSqlMigrationRunner
{
    Task ApplyAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Serializes startup migrations across API replicas with a PostgreSQL session advisory lock.
/// </summary>
public sealed class PostgreSqlMigrationRunner(WaterOperationsDbContext db) : IPostgreSqlMigrationRunner
{
    private const long MigrationLockKey = 901517411628L;

    public async Task ApplyAsync(CancellationToken cancellationToken = default)
    {
        var connection = db.Database.GetDbConnection();
        await connection.OpenAsync(cancellationToken);
        try
        {
            await ExecuteAsync(connection, $"SELECT pg_advisory_lock({MigrationLockKey});", cancellationToken);
            await db.Database.MigrateAsync(cancellationToken);
        }
        finally
        {
            await ExecuteAsync(connection, $"SELECT pg_advisory_unlock({MigrationLockKey});", CancellationToken.None);
            await connection.CloseAsync();
        }
    }

    private static async Task ExecuteAsync(System.Data.Common.DbConnection connection, string sql, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}
