using System.Text;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Common.Abstractions;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Reports;

public sealed class ReportGenerationJob(WaterOperationsDbContext db, IFileStorage fileStorage)
{
    public async Task GenerateAsync(Guid reportId, CancellationToken cancellationToken)
    {
        var report = await db.Reports
            .FirstOrDefaultAsync(x => x.ReportId == reportId, cancellationToken);

        if (report is null || report.Status != "PENDING")
        {
            return;
        }

        report.Status = "PROCESSING";
        await db.SaveChangesAsync(cancellationToken);

        try
        {
            var readings = await db.MeasurementCleans
                .AsNoTracking()
                .Where(x => x.OrganizationId == report.OrganizationId
                            && (!report.StationId.HasValue || x.StationId == report.StationId.Value)
                            && (!report.ParameterId.HasValue || x.ParameterId == report.ParameterId.Value)
                            && x.TimestampUtc >= report.PeriodStartUtc
                            && x.TimestampUtc <= report.PeriodEndUtc)
                .OrderBy(x => x.TimestampUtc)
                .Take(10_000)
                .ToListAsync(cancellationToken);

            var sb = new StringBuilder("measurementCleanId,stationId,parameterId,timestampUtc,value,qualityFlag\n");
            foreach (var r in readings)
            {
                sb.Append(System.Globalization.CultureInfo.InvariantCulture, $"{r.MeasurementCleanId},{r.StationId},{r.ParameterId},{r.TimestampUtc:O},{r.Value},{r.QualityFlag}\n");
            }

            var key = $"reports/{report.OrganizationId}/{report.ReportId}.csv";
            using var stream = new MemoryStream(Encoding.UTF8.GetBytes(sb.ToString()));
            await fileStorage.SaveAsync(key, stream, cancellationToken);

            report.Status = "COMPLETED";
            report.FilePath = key;
            report.CompletedAtUtc = DateTime.UtcNow;
        }
        catch
        {
            report.Status = "FAILED";
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
