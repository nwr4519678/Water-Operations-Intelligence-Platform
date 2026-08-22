using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1861

namespace WaterOperations.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddMfaRecoveryCodes : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "OutboxMessage",
            schema: "Platform",
            columns: table => new
            {
                OutboxMessageId = table.Column<Guid>(type: "uuid", nullable: false),
                OrganizationId = table.Column<Guid>(type: "uuid", nullable: true),
                EventType = table.Column<string>(type: "character varying(200)", unicode: false, maxLength: 200, nullable: false),
                PayloadJson = table.Column<string>(type: "jsonb", nullable: false),
                OccurredAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                ProcessedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                FailedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                AttemptCount = table.Column<int>(type: "integer", nullable: false),
                LastError = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_OutboxMessage", x => x.OutboxMessageId);
            });

        migrationBuilder.CreateIndex(
            name: "IX_OutboxMessage_ProcessedAtUtc_OccurredAtUtc",
            schema: "Platform",
            table: "OutboxMessage",
            columns: new[] { "ProcessedAtUtc", "OccurredAtUtc" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "OutboxMessage",
            schema: "Platform");
    }
}
