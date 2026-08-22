using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WaterOperations.Infrastructure.Persistence.Migrations;

public partial class AddDataLegalHolds : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(name: "DataLegalHold", schema: "Integration", columns: table => new
        {
            DataLegalHoldId = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
            OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
            FromUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
            ToUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
            Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
            IsActive = table.Column<bool>(type: "boolean", nullable: false),
            CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
            CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: true)
        }, constraints: table => table.PrimaryKey("PK_DataLegalHold", x => x.DataLegalHoldId));
        migrationBuilder.CreateIndex("IX_DataLegalHold_OrganizationId_IsActive_FromUtc_ToUtc", "DataLegalHold", new[] { "OrganizationId", "IsActive", "FromUtc", "ToUtc" }, "Integration");
    }
    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropTable("DataLegalHold", "Integration");
}
