using System.Globalization;
using System.Text;
using WaterOperations.Application.Features.Ingestion.DTOs;
using WaterOperations.Application.Features.Ingestion.Interfaces;

namespace WaterOperations.Infrastructure.Ingestion;

public sealed class CsvBatchParser : ICsvBatchParser
{
    public async Task<BatchRequestDto?> ParseAsync(
        Stream content,
        string fileName,
        CancellationToken cancellationToken)
    {
        using var reader = new StreamReader(
            content,
            Encoding.UTF8,
            detectEncodingFromByteOrderMarks: true,
            leaveOpen: true);
        if (string.IsNullOrWhiteSpace(await reader.ReadLineAsync(cancellationToken)))
        {
            return null;
        }

        var rows = new List<ReadingDto>();
        string? line;
        while (rows.Count < 10_000
            && (line = await reader.ReadLineAsync(cancellationToken)) is not null)
        {
            var parts = line.Split(',', StringSplitOptions.TrimEntries);
            if (parts.Length < 5
                || !Guid.TryParse(parts[0], out var stationId)
                || !int.TryParse(parts[1], out var parameterId)
                || !DateTimeOffset.TryParse(parts[2], CultureInfo.InvariantCulture, out var timestamp)
                || !decimal.TryParse(parts[3], NumberStyles.Number, CultureInfo.InvariantCulture, out var value))
            {
                continue;
            }

            rows.Add(new ReadingDto(
                stationId,
                parameterId,
                timestamp,
                value,
                parts[4],
                parts.Length > 5 && long.TryParse(parts[5], out var sequence) ? sequence : null,
                null));
        }

        return new BatchRequestDto(null, "CSV", fileName, "1", rows);
    }
}
