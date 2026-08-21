using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WaterOperations.Infrastructure.Persistence.Migrations;

public partial class AddOutboxMessages : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(name: "Integration");
        migrationBuilder.CreateTable(
            name: "OutboxMessage", schema: "Integration",
            columns: table => new
            {
                OutboxMessageId = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                OrganizationId = table.Column<Guid>(type: "uuid", nullable: true),
                OccurredAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                EventType = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                PayloadJson = table.Column<string>(type: "jsonb", nullable: false),
                Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                AttemptCount = table.Column<int>(type: "integer", nullable: false),
                AvailableAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                ProcessedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                LastError = table.Column<string>(type: "text", nullable: true)
            }, constraints: table => table.PrimaryKey("PK_OutboxMessage", x => x.OutboxMessageId));
        migrationBuilder.CreateIndex(name: "IX_OutboxMessage_Status_AvailableAtUtc", table: "OutboxMessage", schema: "Integration", columns: new[] { "Status", "AvailableAtUtc" });
    }

    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropTable(name: "OutboxMessage", schema: "Integration");
}
