using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Domain.Common.Primitives;

namespace WaterOperations.Infrastructure.Persistence;

public class EfRepository<TEntity>(WaterOperationsDbContext dbContext) : IRepository<TEntity>
    where TEntity : Entity
{
    protected DbSet<TEntity> Set => dbContext.Set<TEntity>();

    public Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) => Set.SingleOrDefaultAsync(entity => entity.Id == id, cancellationToken);
    public IQueryable<TEntity> Query() => Set.AsNoTracking();
    public Task AddAsync(TEntity entity, CancellationToken cancellationToken = default) => Set.AddAsync(entity, cancellationToken).AsTask();
    public void Update(TEntity entity) => Set.Update(entity);
    public void Remove(TEntity entity) => Set.Remove(entity);
}
