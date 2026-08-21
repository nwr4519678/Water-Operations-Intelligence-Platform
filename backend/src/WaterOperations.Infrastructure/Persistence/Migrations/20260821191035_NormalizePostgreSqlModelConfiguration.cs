using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WaterOperations.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class NormalizePostgreSqlModelConfiguration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "BeforeJson", schema: "Security", table: "AuditLog",
                type: "jsonb", nullable: true, oldClrType: typeof(string), oldType: "text");
            migrationBuilder.AlterColumn<string>(
                name: "AfterJson", schema: "Security", table: "AuditLog",
                type: "jsonb", nullable: true, oldClrType: typeof(string), oldType: "text");
            migrationBuilder.AlterColumn<string>(
                name: "MetadataJson", schema: "Security", table: "AuditLog",
                type: "jsonb", nullable: true, oldClrType: typeof(string), oldType: "text");
            migrationBuilder.AlterColumn<string>(
                name: "WidgetsJson", schema: "Platform", table: "DashboardLayout",
                type: "jsonb", nullable: false, oldClrType: typeof(string), oldType: "text");
            migrationBuilder.AlterColumn<string>(
                name: "DefinitionJson", schema: "Telemetry", table: "FeatureSet",
                type: "jsonb", nullable: false, oldClrType: typeof(string), oldType: "text");
            migrationBuilder.AlterColumn<string>(
                name: "FeaturesJson", schema: "Telemetry", table: "FeatureStoreEntry",
                type: "jsonb", nullable: false, oldClrType: typeof(string), oldType: "text");
            migrationBuilder.AlterColumn<string>(
                name: "PayloadJson", schema: "Telemetry", table: "MeasurementRaw",
                type: "jsonb", nullable: true, oldClrType: typeof(string), oldType: "text", oldNullable: true);
            migrationBuilder.AlterColumn<string>(
                name: "MetricsJson", schema: "AI", table: "MlModel",
                type: "jsonb", nullable: true, oldClrType: typeof(string), oldType: "text", oldNullable: true);
            migrationBuilder.AlterColumn<string>(
                name: "MetricsJson", schema: "AI", table: "MlTrainingRun",
                type: "jsonb", nullable: true, oldClrType: typeof(string), oldType: "text", oldNullable: true);
            migrationBuilder.AlterColumn<string>(
                name: "RecipientJson", schema: "Operations", table: "ReportSchedule",
                type: "jsonb", nullable: false, oldClrType: typeof(string), oldType: "text");
            migrationBuilder.AlterColumn<string>(
                name: "SnapshotJson", schema: "Platform", table: "ShareSnapshot",
                type: "jsonb", nullable: false, oldClrType: typeof(string), oldType: "text");
            migrationBuilder.AlterColumn<string>(
                name: "MetadataJson", schema: "Operations", table: "Station",
                type: "jsonb", nullable: true, oldClrType: typeof(string), oldType: "text", oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"Security\".\"AuditLog\" ALTER COLUMN \"BeforeJson\" TYPE text USING \"BeforeJson\"::text;");
            migrationBuilder.Sql("ALTER TABLE \"Security\".\"AuditLog\" ALTER COLUMN \"AfterJson\" TYPE text USING \"AfterJson\"::text;");
            migrationBuilder.Sql("ALTER TABLE \"Security\".\"AuditLog\" ALTER COLUMN \"MetadataJson\" TYPE text USING \"MetadataJson\"::text;");
            migrationBuilder.Sql("ALTER TABLE \"Platform\".\"DashboardLayout\" ALTER COLUMN \"WidgetsJson\" TYPE text USING \"WidgetsJson\"::text;");
            migrationBuilder.Sql("ALTER TABLE \"Telemetry\".\"FeatureSet\" ALTER COLUMN \"DefinitionJson\" TYPE text USING \"DefinitionJson\"::text;");
            migrationBuilder.Sql("ALTER TABLE \"Telemetry\".\"FeatureStoreEntry\" ALTER COLUMN \"FeaturesJson\" TYPE text USING \"FeaturesJson\"::text;");
            migrationBuilder.Sql("ALTER TABLE \"Telemetry\".\"MeasurementRaw\" ALTER COLUMN \"PayloadJson\" TYPE text USING \"PayloadJson\"::text;");
            migrationBuilder.Sql("ALTER TABLE \"AI\".\"MlModel\" ALTER COLUMN \"MetricsJson\" TYPE text USING \"MetricsJson\"::text;");
            migrationBuilder.Sql("ALTER TABLE \"AI\".\"MlTrainingRun\" ALTER COLUMN \"MetricsJson\" TYPE text USING \"MetricsJson\"::text;");
            migrationBuilder.Sql("ALTER TABLE \"Operations\".\"ReportSchedule\" ALTER COLUMN \"RecipientJson\" TYPE text USING \"RecipientJson\"::text;");
            migrationBuilder.Sql("ALTER TABLE \"Platform\".\"ShareSnapshot\" ALTER COLUMN \"SnapshotJson\" TYPE text USING \"SnapshotJson\"::text;");
            migrationBuilder.Sql("ALTER TABLE \"Operations\".\"Station\" ALTER COLUMN \"MetadataJson\" TYPE text USING \"MetadataJson\"::text;");
        }
    }
}
