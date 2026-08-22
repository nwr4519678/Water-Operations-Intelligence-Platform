using System.Globalization;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using System.Xml.Linq;
using System.Xml;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using WaterOperations.Application.Features.Telemetry.DTOs;
using WaterOperations.Application.Features.Telemetry.Interfaces;
using WaterOperations.Infrastructure.Security;
using WaterOperations.Infrastructure.Persistence;
using WaterOperations.Application.Common.Abstractions;

namespace WaterOperations.Api.Controllers;

[ApiController, Route("api/v1/ingestion"), Authorize(Policy = AuthorizationPolicies.AdminOnly)]
public sealed class BulkImportController(IMeasurementIngestionService ingestion, WaterOperationsDbContext db, ITenantContext tenant) : ControllerBase
{
    private const long MaxFileBytes = 5 * 1024 * 1024;
    private const int MaxRows = 1000;

    [HttpPost("files"), RequestSizeLimit(MaxFileBytes)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Import(IFormFile file, [FromQuery] string conflictMode = "SKIP", CancellationToken cancellationToken = default)
    {
        if (file is null || file.Length == 0) return BadRequest(new { error = "file_required" });
        if (file.Length > MaxFileBytes) return BadRequest(new { error = "file_too_large", maxBytes = MaxFileBytes });

        try
        {
            await using var stream = file.OpenReadStream();
            var request = IsJson(file) ? await ParseJsonAsync(stream, file.FileName, cancellationToken) : IsExcel(file) ? await ParseExcelAsync(stream, file.FileName, cancellationToken) : await ParseCsvAsync(stream, file.FileName, cancellationToken);
            return Ok(await ingestion.IngestAsync(request with { ConflictMode = conflictMode }, cancellationToken));
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
            var request = IsJson(file) ? await ParseJsonAsync(stream, file.FileName, cancellationToken) : IsExcel(file) ? await ParseExcelAsync(stream, file.FileName, cancellationToken) : await ParseCsvAsync(stream, file.FileName, cancellationToken);
            return Ok(await ingestion.PreviewAsync(request, cancellationToken));
        }
        catch (BulkImportFormatException exception)
        {
            return BadRequest(new { error = "invalid_import_file", reason = exception.Message });
        }
    }

    [HttpPost("files/async"), RequestSizeLimit(MaxFileBytes)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ImportAsync(IFormFile file, [FromQuery] string conflictMode = "SKIP", CancellationToken cancellationToken = default)
    {
        if (file is null || file.Length == 0) return BadRequest(new { error = "file_required" });
        if (file.Length > MaxFileBytes) return BadRequest(new { error = "file_too_large", maxBytes = MaxFileBytes });
        try
        {
            await using var stream = file.OpenReadStream();
            var request = IsJson(file) ? await ParseJsonAsync(stream, file.FileName, cancellationToken) : IsExcel(file) ? await ParseExcelAsync(stream, file.FileName, cancellationToken) : await ParseCsvAsync(stream, file.FileName, cancellationToken);
            var queued = request with { ConflictMode = conflictMode };
            if (tenant.OrganizationId is not Guid organizationId) return Unauthorized(new { error = "organization_scope_required" });
            var job = new WaterOperations.Domain.Entities.ImportJob { ImportJobId = Guid.NewGuid(), OrganizationId = organizationId, RequestJson = JsonSerializer.Serialize(queued), CreatedAtUtc = DateTime.UtcNow, ProgressPercent = 0 };
            db.ImportJobs.Add(job);
            await db.SaveChangesAsync(cancellationToken);
            var jobKey = $"import:{job.ImportJobId:N}";
            return Accepted($"/api/v1/admin/jobs/{jobKey}", new { jobKey, batchId = queued.BatchId, status = "QUEUED" });
        }
        catch (BulkImportFormatException exception)
        {
            return BadRequest(new { error = "invalid_import_file", reason = exception.Message });
        }
    }

    private static bool IsJson(IFormFile file) =>
        file.ContentType?.Contains("json", StringComparison.OrdinalIgnoreCase) == true ||
        file.FileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase);

    private static bool IsExcel(IFormFile file) =>
        file.ContentType?.Contains("spreadsheet", StringComparison.OrdinalIgnoreCase) == true ||
        file.FileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase);

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

    private static Task<IngestionBatchRequest> ParseExcelAsync(Stream stream, string fileName, CancellationToken cancellationToken)
    {
        try
        {
            using var archive = new ZipArchive(stream, ZipArchiveMode.Read, leaveOpen: true);
            var sharedStrings = ReadSharedStrings(archive);
            var worksheet = archive.GetEntry("xl/worksheets/sheet1.xml") ?? throw new BulkImportFormatException("worksheet_required");
            using var worksheetStream = worksheet.Open();
            var document = XDocument.Load(worksheetStream, LoadOptions.None);
            var ns = document.Root?.Name.Namespace ?? throw new BulkImportFormatException("worksheet_invalid");
            var rows = document.Root!.Element(ns + "sheetData")?.Elements(ns + "row").ToList() ?? throw new BulkImportFormatException("rows_required");
            if (rows.Count < 2) throw new BulkImportFormatException("at_least_one_data_row_required");

            var headerCells = ReadExcelRow(rows[0], ns, sharedStrings);
            var columns = headerCells.ToDictionary(x => x.Key, x => x.Value.Trim().ToLowerInvariant());
            var required = new[] { "stationid", "parameterid", "timestamputc", "value", "unit" };
            if (!required.All(requiredColumn => columns.Values.Contains(requiredColumn)))
                throw new BulkImportFormatException("required_columns:stationId,parameterId,timestampUtc,value,unit");

            var rowsResult = new List<IngestionRowRequest>();
            for (var rowIndex = 1; rowIndex < rows.Count; rowIndex++)
            {
                cancellationToken.ThrowIfCancellationRequested();
                if (rowsResult.Count >= MaxRows) throw new BulkImportFormatException("row_limit_exceeded");
                var cells = ReadExcelRow(rows[rowIndex], ns, sharedStrings);
                try
                {
                    var value = GetExcelCell(cells, columns, "value");
                    rowsResult.Add(new IngestionRowRequest(
                        Guid.Parse(GetExcelCell(cells, columns, "stationid")),
                        int.Parse(GetExcelCell(cells, columns, "parameterid"), CultureInfo.InvariantCulture),
                        ParseExcelTimestamp(GetExcelCell(cells, columns, "timestamputc")),
                        string.IsNullOrWhiteSpace(value) ? null : decimal.Parse(value, CultureInfo.InvariantCulture),
                        GetExcelCell(cells, columns, "unit"),
                        ParseOptionalLong(GetExcelCell(cells, columns, "devicesequence")),
                        GetExcelOptionalCell(cells, columns, "payloadjson")));
                }
                catch (FormatException exception)
                {
                    throw new BulkImportFormatException($"malformed_row_{rowIndex + 1}:{exception.GetType().Name}");
                }
            }
            return Task.FromResult(new IngestionBatchRequest(Guid.NewGuid(), "FILE_EXCEL", fileName, "1", rowsResult));
        }
        catch (InvalidDataException exception) { throw new BulkImportFormatException($"invalid_excel:{exception.Message}"); }
        catch (XmlException exception) { throw new BulkImportFormatException($"invalid_excel_xml:{exception.LineNumber}"); }
    }

    private static Dictionary<string, string> ReadSharedStrings(ZipArchive archive)
    {
        var entry = archive.GetEntry("xl/sharedStrings.xml");
        if (entry is null) return new Dictionary<string, string>();
        using var stream = entry.Open();
        var document = XDocument.Load(stream);
        var ns = document.Root?.Name.Namespace ?? XNamespace.None;
        var values = document.Root!.Elements(ns + "si").Select(item => string.Concat(item.Descendants(ns + "t").Select(text => text.Value))).ToList();
        return values.Select((value, index) => (value, index)).ToDictionary(item => item.index.ToString(CultureInfo.InvariantCulture), item => item.value);
    }

    private static Dictionary<string, string> ReadExcelRow(XElement row, XNamespace ns, IReadOnlyDictionary<string, string> sharedStrings)
    {
        var cells = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var cell in row.Elements(ns + "c"))
        {
            var reference = cell.Attribute("r")?.Value ?? string.Empty;
            var value = cell.Element(ns + "v")?.Value ?? cell.Element(ns + "is")?.Value ?? string.Empty;
            if (string.Equals(cell.Attribute("t")?.Value, "s", StringComparison.OrdinalIgnoreCase) && sharedStrings.TryGetValue(value, out var shared)) value = shared;
            cells[reference] = value;
        }
        return cells;
    }

    private static string GetExcelCell(IReadOnlyDictionary<string, string> cells, IReadOnlyDictionary<string, string> columns, string column)
    {
        var reference = columns.First(x => x.Value == column).Key;
        return GetExcelOptionalCell(cells, columns, column) ?? throw new FormatException($"missing_{column}");
    }

    private static string? GetExcelOptionalCell(IReadOnlyDictionary<string, string> cells, IReadOnlyDictionary<string, string> columns, string column)
    {
        var columnReference = columns.FirstOrDefault(x => x.Value == column).Key;
        if (string.IsNullOrWhiteSpace(columnReference)) return null;
        var columnLetters = new string(columnReference.TakeWhile(char.IsLetter).ToArray());
        return cells.FirstOrDefault(x => new string(x.Key.TakeWhile(char.IsLetter).ToArray()).Equals(columnLetters, StringComparison.OrdinalIgnoreCase)).Value;
    }

    private static DateTime ParseExcelTimestamp(string value)
    {
        if (double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var serial))
            return DateTime.SpecifyKind(new DateTime(1899, 12, 30).AddDays(serial), DateTimeKind.Utc);
        return DateTime.Parse(value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind);
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
