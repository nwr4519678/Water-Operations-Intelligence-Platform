using System.IO.Compression;
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
        var claimed = await db.Reports
            .Where(x => x.ReportId == reportId && x.Status == "QUEUED")
            .ExecuteUpdateAsync(x => x.SetProperty(r => r.Status, "RUNNING"), cancellationToken);
        if (claimed == 0) return;
        var report = await db.Reports.SingleOrDefaultAsync(x => x.ReportId == reportId, cancellationToken);
        if (report is null) return;
        try
        {
            var key = $"reports/{report.ReportId:N}.{report.Format.ToLowerInvariant()}";
            var rows = $"reportId,status,periodStartUtc,periodEndUtc,stationId,parameterId\n{report.ReportId},COMPLETED,{report.PeriodStartUtc:O},{report.PeriodEndUtc:O},{report.StationId},{report.ParameterId}\n";
            var content = report.Format.ToUpperInvariant() switch
            {
                "PDF" => BuildPdf(rows),
                "XLSX" => BuildXlsx(rows),
                _ => Encoding.UTF8.GetBytes(rows)
            };
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

    private static byte[] BuildPdf(string text)
    {
        var escaped = text.Replace("\\", "\\\\", StringComparison.Ordinal).Replace("(", "\\(", StringComparison.Ordinal).Replace(")", "\\)", StringComparison.Ordinal).Replace("\r\n", " ", StringComparison.Ordinal).Replace("\n", " ", StringComparison.Ordinal);
        var body = $"BT /F1 8 Tf 36 760 Td ({escaped}) Tj ET";
        var objects = new[]
        {
            "<< /Type /Catalog /Pages 2 0 R >>",
            "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
            $"<< /Length {Encoding.ASCII.GetByteCount(body)} >>\nstream\n{body}\nendstream"
        };
        using var stream = new MemoryStream();
        using var writer = new StreamWriter(stream, Encoding.ASCII, leaveOpen: true);
        writer.Write("%PDF-1.4\n"); writer.Flush();
        var offsets = new List<long> { 0 };
        foreach (var (objectText, index) in objects.Select((value, index) => (value, index)))
        {
            writer.Flush(); offsets.Add(stream.Position); writer.Write($"{index + 1} 0 obj\n{objectText}\nendobj\n");
        }
        writer.Flush(); var xref = stream.Position; writer.Write($"xref\n0 {objects.Length + 1}\n0000000000 65535 f \n");
        foreach (var offset in offsets.Skip(1)) writer.Write($"{offset:0000000000} 00000 n \n");
        writer.Write($"trailer\n<< /Size {objects.Length + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF"); writer.Flush();
        return stream.ToArray();
    }

    private static byte[] BuildXlsx(string csv)
    {
        using var stream = new MemoryStream();
        using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            AddEntry(archive, "[Content_Types].xml", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/><Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/></Types>");
            AddEntry(archive, "_rels/.rels", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>");
            AddEntry(archive, "xl/workbook.xml", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><sheets><sheet name=\"Report\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>");
            AddEntry(archive, "xl/_rels/workbook.xml.rels", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/></Relationships>");
            var rows = string.Join("", csv.Split('\n', StringSplitOptions.RemoveEmptyEntries).Select((row, i) => $"<row r=\"{i + 1}\">{string.Join("", row.Split(',').Select((cell, j) => $"<c r=\"{(char)('A' + j)}{i + 1}\" t=\"inlineStr\"><is><t>{System.Security.SecurityElement.Escape(cell)}</t></is></c>"))}</row>"));
            AddEntry(archive, "xl/worksheets/sheet1.xml", $"<?xml version=\"1.0\" encoding=\"UTF-8\"?><worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData>{rows}</sheetData></worksheet>");
        }
        return stream.ToArray();
    }

    private static void AddEntry(ZipArchive archive, string name, string content)
    {
        using var writer = new StreamWriter(archive.CreateEntry(name).Open(), Encoding.UTF8);
        writer.Write(content);
    }
}
