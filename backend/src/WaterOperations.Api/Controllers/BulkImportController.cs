using System.Globalization;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Application.Features.Telemetry.DTOs;
using WaterOperations.Application.Features.Telemetry.Interfaces;
using WaterOperations.Infrastructure.Security;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1/ingestion"), Authorize(Policy = AuthorizationPolicies.AdminOnly)]
public sealed class BulkImportController(IMeasurementIngestionService ingestion) : ControllerBase
{
    private const long MaxFileBytes = 5 * 1024 * 1024;
    private const int MaxRows = 1000;

    [HttpPost("files"), RequestSizeLimit(MaxFileBytes)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Import(IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0) return BadRequest(new { error = "file_required" });
        if (file.Length > MaxFileBytes) return BadRequest(new { error = "file_too_large", maxBytes = MaxFileBytes });

        try
        {
            await using var stream = file.OpenReadStream();
            var request = IsJson(file) ? await ParseJsonAsync(stream, file.FileName, cancellationToken) : await ParseCsvAsync(stream, file.FileName, cancellationToken);
            return Ok(await ingestion.IngestAsync(request, cancellationToken));
        }
        catch (BulkImportFormatException exception)
        {
            return BadRequest(new { error = "invalid_import_file", reason = exception.Message });
        }
    }

    [HttpPost("files/preview"), RequestSizeLimit(MaxFileBytes)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Preview(IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0) return BadRequest(new { error = "file_required" });
        if (file.Length > MaxFileBytes) return BadRequest(new { error = "file_too_large", maxBytes = MaxFileBytes });
        try
        {
            await using var stream = file.OpenReadStream();
            var request = IsJson(file) ? await ParseJsonAsync(stream, file.FileName, cancellationToken) : await ParseCsvAsync(stream, file.FileName, cancellationToken);
            return Ok(await ingestion.PreviewAsync(request, cancellationToken));
        }
        catch (BulkImportFormatException exception)
        {
            return BadRequest(new { error = "invalid_import_file", reason = exception.Message });
        }
    }

    private static bool IsJson(IFormFile file) =>
        file.ContentType?.Contains("json", StringComparison.OrdinalIgnoreCase) == true ||
        file.FileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase);

    private static async Task<IngestionBatchRequest> ParseJsonAsync(Stream stream, string fileName, CancellationToken cancellationToken)
    {
        try
        {
            var request = await JsonSerializer.DeserializeAsync<IngestionBatchRequest>(stream, cancellationToken: cancellationToken);
            if (request is null || request.Rows.Count is 0 or > MaxRows) throw new BulkImportFormatException("rows_must_be_between_1_and_1000");
            return request with { SourceType = "FILE_JSON", SourceName = fileName };
        }
        catch (JsonException exception)
        {
            throw new BulkImportFormatException($"invalid_json:{exception.LineNumber}");
        }
    }

    private static async Task<IngestionBatchRequest> ParseCsvAsync(Stream stream, string fileName, CancellationToken cancellationToken)
    {
        using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
        var header = await reader.ReadLineAsync(cancellationToken);
        if (header is null) throw new BulkImportFormatException("header_required");
        var columns = SplitCsv(header).Select(x => x.Trim().ToLowerInvariant()).ToArray();
        var required = new[] { "stationid", "parameterid", "timestamputc", "value", "unit" };
        if (!required.All(columns.Contains)) throw new BulkImportFormatException("required_columns:stationId,parameterId,timestampUtc,value,unit");

        var rows = new List<IngestionRowRequest>();
        var lineNumber = 1;
        while (await reader.ReadLineAsync(cancellationToken) is { } line)
        {
            lineNumber++;
            if (string.IsNullOrWhiteSpace(line)) continue;
            if (rows.Count >= MaxRows) throw new BulkImportFormatException("row_limit_exceeded");
            var values = SplitCsv(line);
            if (values.Count != columns.Length) throw new BulkImportFormatException($"column_count_mismatch_line_{lineNumber}");
            try
            {
                var value = Get(values, columns, "value");
                rows.Add(new IngestionRowRequest(
                    Guid.Parse(Get(values, columns, "stationid")),
                    int.Parse(Get(values, columns, "parameterid"), CultureInfo.InvariantCulture),
                    DateTime.Parse(Get(values, columns, "timestamputc"), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind),
                    string.IsNullOrWhiteSpace(value) ? null : decimal.Parse(value, CultureInfo.InvariantCulture),
                    Get(values, columns, "unit"),
                    ParseOptionalLong(Get(values, columns, "devicesequence")),
                    GetOptional(values, columns, "payloadjson")));
            }
            catch (FormatException exception)
            {
                throw new BulkImportFormatException($"malformed_line_{lineNumber}:{exception.GetType().Name}");
            }
        }

        if (rows.Count == 0) throw new BulkImportFormatException("at_least_one_data_row_required");
        return new IngestionBatchRequest(Guid.NewGuid(), "FILE_CSV", fileName, "1", rows);
    }

    private static string Get(IReadOnlyList<string> values, IReadOnlyList<string> columns, string column) =>
        GetOptional(values, columns, column) ?? throw new FormatException($"missing_{column}");

    private static string? GetOptional(IReadOnlyList<string> values, IReadOnlyList<string> columns, string column)
    {
        for (var index = 0; index < columns.Count; index++)
            if (columns[index] == column) return index < values.Count ? values[index].Trim() : null;
        return null;
    }

    private static long? ParseOptionalLong(string? value) => string.IsNullOrWhiteSpace(value) ? null : long.Parse(value, CultureInfo.InvariantCulture);

    private static IReadOnlyList<string> SplitCsv(string line)
    {
        var result = new List<string>();
        var current = new StringBuilder();
        var quoted = false;
        for (var index = 0; index < line.Length; index++)
        {
            var character = line[index];
            if (character == '"' && quoted && index + 1 < line.Length && line[index + 1] == '"') { current.Append('"'); index++; continue; }
            if (character == '"') { quoted = !quoted; continue; }
            if (character == ',' && !quoted) { result.Add(current.ToString()); current.Clear(); continue; }
            current.Append(character);
        }
        if (quoted) throw new BulkImportFormatException("unterminated_quoted_field");
        result.Add(current.ToString());
        return result;
    }

    private sealed class BulkImportFormatException(string message) : Exception(message);
}
