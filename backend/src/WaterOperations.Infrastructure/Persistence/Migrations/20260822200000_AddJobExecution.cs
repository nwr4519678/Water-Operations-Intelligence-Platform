using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WaterOperations.Infrastructure.Persistence.Migrations;

public partial class AddJobExecution : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "JobExecution",
            schema: "Integration",
            columns: table => new
            {
                JobExecutionId = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                JobKey = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                JobType = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                AttemptCount = table.Column<int>(type: "integer", nullable: false),
                StartedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                AvailableAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                ExpiresAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                LastError = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true)
            },
            constraints: table => table.PrimaryKey("PK_JobExecution", x => x.JobExecutionId));
        migrationBuilder.CreateIndex("IX_JobExecution_JobKey", "JobExecution", "JobKey", "Integration", unique: true);
        migrationBuilder.CreateIndex("IX_JobExecution_Status_AvailableAtUtc", "JobExecution", new[] { "Status", "AvailableAtUtc" }, "Integration");
    }

    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropTable("JobExecution", "Integration");
}
