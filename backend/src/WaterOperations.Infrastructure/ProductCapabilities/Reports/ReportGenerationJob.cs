using System.Text;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.ProductCapabilities.Reports;

public sealed class ReportGenerationJob(WaterOperationsDbContext db, IFileStorage fileStorage)
{
    [AutomaticRetry(Attempts = 3)]
    public async Task GenerateAsync(Guid reportId, CancellationToken cancellationToken)
    {
        var report = await db.Reports.SingleOrDefaultAsync(x => x.ReportId == reportId, cancellationToken);
        if (report is null || report.Status is "COMPLETED" or "CANCELLED") return;

        report.Status = "RUNNING";
        await db.SaveChangesAsync(cancellationToken);
        try
        {
            var key = $"reports/{report.ReportId:N}.{report.Format.ToLowerInvariant()}";
            var content = Encoding.UTF8.GetBytes($"reportId,status,periodStartUtc,periodEndUtc\n{report.ReportId},COMPLETED,{report.PeriodStartUtc:O},{report.PeriodEndUtc:O}\n");
            await using var stream = new MemoryStream(content, writable: false);
            await fileStorage.SaveAsync(key, stream, cancellationToken);
            report.FilePath = key;
            report.Status = "COMPLETED";
            report.CompletedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            report.Status = "FAILED";
            report.ErrorMessage = exception.Message[..Math.Min(exception.Message.Length, 4000)];
            await db.SaveChangesAsync(cancellationToken);
            throw;
        }
    }
}
