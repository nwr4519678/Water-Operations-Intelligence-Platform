using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WaterOperations.Infrastructure.Persistence.Migrations;

public partial class AddImportJobProgress : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) =>
        migrationBuilder.AddColumn<int>("ProgressPercent", "ImportJob", "Integration", nullable: false, defaultValue: 0);

    protected override void Down(MigrationBuilder migrationBuilder) =>
        migrationBuilder.DropColumn("ProgressPercent", "ImportJob", "Integration");
}
