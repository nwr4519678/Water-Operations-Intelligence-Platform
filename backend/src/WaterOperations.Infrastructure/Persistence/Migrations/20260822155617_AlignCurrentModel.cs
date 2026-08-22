using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1861

namespace WaterOperations.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AlignCurrentModel : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "MfaRecoveryCode",
            schema: "Security",
            columns: table => new
            {
                MfaRecoveryCodeId = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                CodeHash = table.Column<string>(type: "character varying(64)", unicode: false, maxLength: 64, nullable: false),
                CreatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                UsedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_MfaRecoveryCode", x => x.MfaRecoveryCodeId);
                table.ForeignKey(
                    name: "FK_MfaRecoveryCode_User_UserId",
                    column: x => x.UserId,
                    principalSchema: "Security",
                    principalTable: "User",
                    principalColumn: "UserId",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_MfaRecoveryCode_UserId_CodeHash",
            schema: "Security",
            table: "MfaRecoveryCode",
            columns: new[] { "UserId", "CodeHash" },
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "MfaRecoveryCode",
            schema: "Security");
    }
}
