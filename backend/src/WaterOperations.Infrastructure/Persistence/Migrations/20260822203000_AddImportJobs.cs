using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WaterOperations.Infrastructure.Persistence.Migrations;

public partial class AddImportJobs : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(name: "ImportJob", schema: "Integration", columns: table => new
        {
            ImportJobId = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
            OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
            RequestJson = table.Column<string>(type: "jsonb", nullable: false),
            Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
            CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
            StartedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
            CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
            LastError = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true)
        }, constraints: table => table.PrimaryKey("PK_ImportJob", x => x.ImportJobId));
        migrationBuilder.CreateIndex("IX_ImportJob_Status_CreatedAtUtc", "ImportJob", new[] { "Status", "CreatedAtUtc" }, "Integration");
    }
    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropTable("ImportJob", "Integration");
}
