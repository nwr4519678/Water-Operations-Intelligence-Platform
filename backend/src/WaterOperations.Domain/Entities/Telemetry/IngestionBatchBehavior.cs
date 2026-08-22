using WaterOperations.Domain.Common.Results;

namespace WaterOperations.Domain.Entities;

public partial class IngestionBatch
{
    public Result Complete(
        int totalRows,
        int acceptedRows,
        DateTime startedAtUtc,
        DateTime completedAtUtc)
    {
        if (totalRows < 0 || acceptedRows < 0 || acceptedRows > totalRows)
        {
            return Result.Failure("invalid_batch_totals");
        }

        TotalRows = totalRows;
        AcceptedRows = acceptedRows;
        RejectedRows = totalRows - acceptedRows;
        StartedAtUtc = startedAtUtc;
        CompletedAtUtc = completedAtUtc;
        Status = acceptedRows == totalRows
            ? "ACCEPTED"
            : acceptedRows == 0
                ? "REJECTED"
                : "PARTIAL";

        return Result.Success();
    }
}
