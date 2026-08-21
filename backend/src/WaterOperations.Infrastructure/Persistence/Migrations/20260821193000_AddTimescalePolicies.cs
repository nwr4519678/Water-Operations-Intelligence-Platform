using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WaterOperations.Infrastructure.Persistence.Migrations;

public partial class AddTimescalePolicies : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'timescaledb') THEN
                    CREATE EXTENSION IF NOT EXISTS timescaledb;
                    PERFORM create_hypertable('"Telemetry"."MeasurementRaw"', 'DeviceTimestampUtc', if_not_exists => TRUE);
                    PERFORM create_hypertable('"Telemetry"."MeasurementClean"', 'TimestampUtc', if_not_exists => TRUE);
                    PERFORM add_retention_policy('"Telemetry"."MeasurementRaw"', INTERVAL '90 days', if_not_exists => TRUE);
                    PERFORM add_retention_policy('"Telemetry"."MeasurementClean"', INTERVAL '365 days', if_not_exists => TRUE);
                END IF;
            END $$;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
                    PERFORM remove_retention_policy('"Telemetry"."MeasurementRaw"', if_exists => TRUE);
                    PERFORM remove_retention_policy('"Telemetry"."MeasurementClean"', if_exists => TRUE);
                END IF;
            END $$;
            """);
    }
}
