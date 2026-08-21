using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Abstractions;

namespace WaterOperations.Infrastructure.Persistence;

public sealed class EfRepository<TEntity>(WaterOperationsDbContext db) : IRepository<TEntity>
    where TEntity : class
{
    private readonly DbSet<TEntity> set = db.Set<TEntity>();

    public async Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await set.FindAsync([id], cancellationToken);

    public IQueryable<TEntity> Query() => set.AsQueryable();

    public Task AddAsync(TEntity entity, CancellationToken cancellationToken = default) =>
        set.AddAsync(entity, cancellationToken).AsTask();

    public void Update(TEntity entity) => set.Update(entity);

    public void Remove(TEntity entity) => set.Remove(entity);
}
