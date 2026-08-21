using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WaterOperations.Infrastructure.Persistence.Migrations;

public partial class AddTelemetryDataConstraints : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CK_Alarm_Severity') THEN
                    ALTER TABLE "Operations"."Alarm" ADD CONSTRAINT "CK_Alarm_Severity" CHECK ("Severity" IN ('INFO', 'WARNING', 'CRITICAL'));
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CK_Alarm_Status') THEN
                    ALTER TABLE "Operations"."Alarm" ADD CONSTRAINT "CK_Alarm_Status" CHECK ("Status" IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'));
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CK_MeasurementClean_QualityFlag') THEN
                    ALTER TABLE "Telemetry"."MeasurementClean" ADD CONSTRAINT "CK_MeasurementClean_QualityFlag" CHECK ("QualityFlag" IN ('VALID', 'SUSPECT', 'INVALID', 'QUARANTINED'));
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CK_IngestionBatch_RowCounts') THEN
                    ALTER TABLE "Telemetry"."IngestionBatch" ADD CONSTRAINT "CK_IngestionBatch_RowCounts" CHECK ("TotalRows" >= 0 AND "AcceptedRows" >= 0 AND "RejectedRows" >= 0 AND "AcceptedRows" + "RejectedRows" <= "TotalRows");
                END IF;
            END $$;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("ALTER TABLE \"Operations\".\"Alarm\" DROP CONSTRAINT IF EXISTS \"CK_Alarm_Severity\", DROP CONSTRAINT IF EXISTS \"CK_Alarm_Status\";");
        migrationBuilder.Sql("ALTER TABLE \"Telemetry\".\"MeasurementClean\" DROP CONSTRAINT IF EXISTS \"CK_MeasurementClean_QualityFlag\";");
        migrationBuilder.Sql("ALTER TABLE \"Telemetry\".\"IngestionBatch\" DROP CONSTRAINT IF EXISTS \"CK_IngestionBatch_RowCounts\";");
    }
}
