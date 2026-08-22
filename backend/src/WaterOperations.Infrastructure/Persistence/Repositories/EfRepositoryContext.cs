using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Repositories;

namespace WaterOperations.Infrastructure.Persistence.Repositories;

public sealed class EfRepositoryContext(WaterOperationsDbContext db) : IRepositoryContext
{
    public IQueryable<TEntity> Query<TEntity>() where TEntity : class => db.Set<TEntity>();

    public void Add<TEntity>(TEntity entity) where TEntity : class => db.Set<TEntity>().Add(entity);

    public void AddRange<TEntity>(IEnumerable<TEntity> entities) where TEntity : class =>
        db.Set<TEntity>().AddRange(entities);

    public void RemoveRange<TEntity>(IEnumerable<TEntity> entities) where TEntity : class =>
        db.Set<TEntity>().RemoveRange(entities);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}
