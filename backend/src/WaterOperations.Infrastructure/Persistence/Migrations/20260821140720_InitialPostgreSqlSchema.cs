using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace WaterOperations.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialPostgreSqlSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "Operations");

            migrationBuilder.EnsureSchema(
                name: "AI");

            migrationBuilder.EnsureSchema(
                name: "Security");

            migrationBuilder.EnsureSchema(
                name: "Platform");

            migrationBuilder.EnsureSchema(
                name: "Telemetry");

            migrationBuilder.EnsureSchema(
                name: "Core");

            migrationBuilder.EnsureSchema(
                name: "Reporting");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:pgcrypto", ",,");

            migrationBuilder.CreateTable(
                name: "AlarmType",
                schema: "Operations",
                columns: table => new
                {
                    AlarmTypeId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "character varying(60)", unicode: false, maxLength: 60, nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlarmType", x => x.AlarmTypeId);
                });

            migrationBuilder.CreateTable(
                name: "FeatureSet",
                schema: "Telemetry",
                columns: table => new
                {
                    FeatureSetVersion = table.Column<string>(type: "character varying(50)", unicode: false, maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    DefinitionJson = table.Column<string>(type: "text", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())"),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeatureSet", x => x.FeatureSetVersion);
                });

            migrationBuilder.CreateTable(
                name: "Organization",
                schema: "Platform",
                columns: table => new
                {
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Slug = table.Column<string>(type: "character varying(120)", unicode: false, maxLength: 120, nullable: false),
                    LogoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PrimaryColor = table.Column<string>(type: "character varying(20)", unicode: false, maxLength: 20, nullable: true),
                    DefaultTimeZone = table.Column<string>(type: "character varying(100)", unicode: false, maxLength: 100, nullable: false, defaultValue: "UTC"),
                    DefaultLocale = table.Column<string>(type: "character varying(10)", unicode: false, maxLength: 10, nullable: false, defaultValue: "en"),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())"),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Organization", x => x.OrganizationId);
                });

            migrationBuilder.CreateTable(
                name: "Parameter",
                schema: "Core",
                columns: table => new
                {
                    ParameterId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "character varying(50)", unicode: false, maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    CanonicalUnit = table.Column<string>(type: "character varying(32)", unicode: false, maxLength: 32, nullable: false),
                    DataType = table.Column<string>(type: "character varying(20)", unicode: false, maxLength: 20, nullable: false, defaultValue: "DECIMAL"),
                    MinimumValue = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    MaximumValue = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    DefaultResampleMinutes = table.Column<int>(type: "integer", nullable: false, defaultValue: 15),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Parameter", x => x.ParameterId);
                });

            migrationBuilder.CreateTable(
                name: "Permission",
                schema: "Security",
                columns: table => new
                {
                    PermissionId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "character varying(100)", unicode: false, maxLength: 100, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Permission", x => x.PermissionId);
                });

            migrationBuilder.CreateTable(
                name: "Role",
                schema: "Security",
                columns: table => new
                {
                    RoleId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "character varying(50)", unicode: false, maxLength: 50, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsSystemRole = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Role", x => x.RoleId);
                });

            migrationBuilder.CreateTable(
                name: "IngestionBatch",
                schema: "Telemetry",
                columns: table => new
                {
                    IngestionBatchId = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceType = table.Column<string>(type: "character varying(30)", unicode: false, maxLength: 30, nullable: false, defaultValue: "DEVICE"),
                    SourceName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    SchemaVersion = table.Column<string>(type: "character varying(50)", unicode: false, maxLength: 50, nullable: true),
                    StartedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())"),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    TotalRows = table.Column<int>(type: "integer", nullable: false),
                    AcceptedRows = table.Column<int>(type: "integer", nullable: false),
                    RejectedRows = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", unicode: false, maxLength: 20, nullable: false, defaultValue: "RECEIVED"),
                    ErrorMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IngestionBatch", x => x.IngestionBatchId);
                    table.ForeignKey(
                        name: "FK_IngestionBatch_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId");
                });

            migrationBuilder.CreateTable(
                name: "Region",
                schema: "Core",
                columns: table => new
                {
                    RegionId = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", unicode: false, maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    BoundaryJson = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Region", x => x.RegionId);
                    table.ForeignKey(
                        name: "FK_Region_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SystemSetting",
                schema: "Platform",
                columns: table => new
                {
                    SystemSettingId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: true),
                    SettingKey = table.Column<string>(type: "character varying(150)", unicode: false, maxLength: 150, nullable: false),
                    SettingValue = table.Column<string>(type: "text", nullable: false),
                    ValueType = table.Column<string>(type: "character varying(20)", unicode: false, maxLength: 20, nullable: false, defaultValue: "STRING"),
                    IsSecret = table.Column<bool>(type: "boolean", nullable: false),
                    UpdatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemSetting", x => x.SystemSettingId);
                    table.ForeignKey(
                        name: "FK_SystemSetting_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId");
                });

            migrationBuilder.CreateTable(
                name: "User",
                schema: "Security",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", unicode: false, maxLength: 320, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(500)", unicode: false, maxLength: 500, nullable: false),
                    ClientType = table.Column<string>(type: "character varying(20)", unicode: false, maxLength: 20, nullable: false, defaultValue: "WEB"),
                    PreferredLocale = table.Column<string>(type: "character varying(10)", unicode: false, maxLength: 10, nullable: false, defaultValue: "en"),
                    PreferredTimeZone = table.Column<string>(type: "character varying(100)", unicode: false, maxLength: 100, nullable: false, defaultValue: "UTC"),
                    Theme = table.Column<string>(type: "character varying(20)", unicode: false, maxLength: 20, nullable: false, defaultValue: "LIGHT"),
                    DecimalPrecision = table.Column<byte>(type: "smallint", nullable: false, defaultValue: (byte)2),
                    IsMfaEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    MfaSecretEncrypted = table.Column<byte[]>(type: "bytea", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    LastLoginAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())"),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())"),
                    RowVersion = table.Column<byte[]>(type: "bytea", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_User", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_User_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId");
                });

            migrationBuilder.CreateTable(
                name: "RolePermission",
                schema: "Security",
                columns: table => new
                {
                    RoleId = table.Column<int>(type: "integer", nullable: false),
                    PermissionId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolePermission", x => new { x.RoleId, x.PermissionId });
                    table.ForeignKey(
                        name: "FK_RolePermission_Permission",
                        column: x => x.PermissionId,
                        principalSchema: "Security",
                        principalTable: "Permission",
                        principalColumn: "PermissionId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RolePermission_Role",
                        column: x => x.RoleId,
                        principalSchema: "Security",
                        principalTable: "Role",
                        principalColumn: "RoleId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Station",
                schema: "Core",
                columns: table => new
                {
                    StationId = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    RegionId = table.Column<Guid>(type: "uuid", nullable: true),
                    StationCode = table.Column<string>(type: "character varying(80)", unicode: false, maxLength: 80, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Latitude = table.Column<decimal>(type: "numeric(9,6)", nullable: true),
                    Longitude = table.Column<decimal>(type: "numeric(9,6)", nullable: true),
                    ElevationMeters = table.Column<decimal>(type: "numeric(10,3)", nullable: true),
                    StaffGaugeHeight = table.Column<decimal>(type: "numeric(18,4)", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", unicode: false, maxLength: 20, nullable: false, defaultValue: "OFFLINE"),
                    LastSeenAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    CommunicationIntervalSeconds = table.Column<int>(type: "integer", nullable: true),
                    MetadataJson = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())"),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Station", x => x.StationId);
                    table.ForeignKey(
                        name: "FK_Station_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Station_Region",
                        column: x => x.RegionId,
                        principalSchema: "Core",
                        principalTable: "Region",
                        principalColumn: "RegionId");
                });

            migrationBuilder.CreateTable(
                name: "AuditLog",
                schema: "Security",
                columns: table => new
                {
                    AuditLogId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: true),
                    ActorUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ActionCode = table.Column<string>(type: "character varying(100)", unicode: false, maxLength: 100, nullable: false),
                    EntityType = table.Column<string>(type: "character varying(100)", unicode: false, maxLength: 100, nullable: true),
                    EntityId = table.Column<string>(type: "character varying(100)", unicode: false, maxLength: 100, nullable: true),
                    RequestId = table.Column<string>(type: "character varying(100)", unicode: false, maxLength: 100, nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(45)", unicode: false, maxLength: 45, nullable: true),
                    Success = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    BeforeJson = table.Column<string>(type: "text", nullable: true),
                    AfterJson = table.Column<string>(type: "text", nullable: true),
                    MetadataJson = table.Column<string>(type: "text", nullable: true),
                    OccurredAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLog", x => x.AuditLogId);
                    table.ForeignKey(
                        name: "FK_Audit_Actor",
                        column: x => x.ActorUserId,
                        principalSchema: "Security",
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Audit_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId");
                });

            migrationBuilder.CreateTable(
                name: "DashboardLayout",
                schema: "Platform",
                columns: table => new
                {
                    DashboardLayoutId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    LayoutName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: "Default"),
                    WidgetsJson = table.Column<string>(type: "text", nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DashboardLayout", x => x.DashboardLayoutId);
                    table.ForeignKey(
                        name: "FK_DashboardLayout_User",
                        column: x => x.UserId,
                        principalSchema: "Security",
                        principalTable: "User",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NotificationPreference",
                schema: "Operations",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Severity = table.Column<string>(type: "character varying(20)", unicode: false, maxLength: 20, nullable: false),
                    InAppEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    EmailEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    PushEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    DesktopEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    DailyDigestEnabled = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationPreference", x => new { x.UserId, x.Severity });
                    table.ForeignKey(
                        name: "FK_NotificationPreference_User",
                        column: x => x.UserId,
                        principalSchema: "Security",
                        principalTable: "User",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Session",
                schema: "Security",
                columns: table => new
                {
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RefreshTokenHash = table.Column<string>(type: "character varying(500)", unicode: false, maxLength: 500, nullable: false),
                    DeviceName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(45)", unicode: false, maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())"),
                    ExpiresAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    RevokedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Session", x => x.SessionId);
                    table.ForeignKey(
                        name: "FK_Session_User",
                        column: x => x.UserId,
                        principalSchema: "Security",
                        principalTable: "User",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserRole",
                schema: "Security",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleId = table.Column<int>(type: "integer", nullable: false),
                    AssignedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())"),
                    AssignedByUserId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRole", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_UserRole_AssignedBy",
                        column: x => x.AssignedByUserId,
                        principalSchema: "Security",
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_UserRole_Role",
                        column: x => x.RoleId,
                        principalSchema: "Security",
                        principalTable: "Role",
                        principalColumn: "RoleId");
                    table.ForeignKey(
                        name: "FK_UserRole_User",
                        column: x => x.UserId,
                        principalSchema: "Security",
                        principalTable: "User",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Alarm",
                schema: "Operations",
                columns: table => new
                {
                    AlarmId = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    StationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParameterId = table.Column<int>(type: "integer", nullable: true),
                    AlarmTypeId = table.Column<int>(type: "integer", nullable: false),
                    Severity = table.Column<string>(type: "character varying(20)", unicode: false, maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", unicode: false, maxLength: 20, nullable: false, defaultValue: "ACTIVE"),
                    Message = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ValueAtRaise = table.Column<decimal>(type: "numeric(38,12)", nullable: true),
                    ThresholdValue = table.Column<decimal>(type: "numeric(38,12)", nullable: true),
                    RaisedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    AcknowledgedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    AcknowledgedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ResolvedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    ResolvedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ResolutionNote = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CorrelationClusterId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Alarm", x => x.AlarmId);
                    table.ForeignKey(
                        name: "FK_Alarm_AckUser",
                        column: x => x.AcknowledgedByUserId,
                        principalSchema: "Security",
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Alarm_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Alarm_Parameter",
                        column: x => x.ParameterId,
                        principalSchema: "Core",
                        principalTable: "Parameter",
                        principalColumn: "ParameterId");
                    table.ForeignKey(
                        name: "FK_Alarm_ResolveUser",
                        column: x => x.ResolvedByUserId,
                        principalSchema: "Security",
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Alarm_Station",
                        column: x => x.StationId,
                        principalSchema: "Core",
                        principalTable: "Station",
                        principalColumn: "StationId");
                    table.ForeignKey(
                        name: "FK_Alarm_Type",
                        column: x => x.AlarmTypeId,
                        principalSchema: "Operations",
                        principalTable: "AlarmType",
                        principalColumn: "AlarmTypeId");
                });

            migrationBuilder.CreateTable(
                name: "ChartAnnotation",
                schema: "Operations",
                columns: table => new
                {
                    ChartAnnotationId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    StationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParameterId = table.Column<int>(type: "integer", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TimestampUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    Text = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())"),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChartAnnotation", x => x.ChartAnnotationId);
                    table.ForeignKey(
                        name: "FK_Annotation_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId");
                    table.ForeignKey(
                        name: "FK_Annotation_Parameter",
                        column: x => x.ParameterId,
                        principalSchema: "Core",
                        principalTable: "Parameter",
                        principalColumn: "ParameterId");
                    table.ForeignKey(
                        name: "FK_Annotation_Station",
                        column: x => x.StationId,
                        principalSchema: "Core",
                        principalTable: "Station",
                        principalColumn: "StationId");
                    table.ForeignKey(
                        name: "FK_Annotation_User",
                        column: x => x.UserId,
                        principalSchema: "Security",
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "DataQualityLog",
                schema: "Telemetry",
                columns: table => new
                {
                    DataQualityLogId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    StationId = table.Column<Guid>(type: "uuid", nullable: false),
                    WindowStartUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    WindowEndUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    TotalCount = table.Column<int>(type: "integer", nullable: false),
                    ValidCount = table.Column<int>(type: "integer", nullable: false),
                    InterpolatedCount = table.Column<int>(type: "integer", nullable: false),
                    QuarantinedCount = table.Column<int>(type: "integer", nullable: false),
                    DuplicateCount = table.Column<int>(type: "integer", nullable: false),
                    ValidPct = table.Column<decimal>(type: "numeric(7,3)", nullable: false),
                    InterpolatedPct = table.Column<decimal>(type: "numeric(7,3)", nullable: false),
                    QuarantinedPct = table.Column<decimal>(type: "numeric(7,3)", nullable: false),
                    SchemaDriftEvents = table.Column<int>(type: "integer", nullable: false),
                    RulesetVersion = table.Column<string>(type: "character varying(50)", unicode: false, maxLength: 50, nullable: true),
                    ComputedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DataQualityLog", x => x.DataQualityLogId);
                    table.ForeignKey(
                        name: "FK_DQ_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId");
                    table.ForeignKey(
                        name: "FK_DQ_Station",
                        column: x => x.StationId,
                        principalSchema: "Core",
                        principalTable: "Station",
                        principalColumn: "StationId");
                });

            migrationBuilder.CreateTable(
                name: "FocusStationScore",
                schema: "AI",
                columns: table => new
                {
                    FocusStationScoreId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    StationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Score = table.Column<decimal>(type: "numeric(12,6)", nullable: false),
                    RankNo = table.Column<int>(type: "integer", nullable: true),
                    ReasonsJson = table.Column<string>(type: "text", nullable: true),
                    ComputedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())"),
                    IsPinned = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FocusStationScore", x => x.FocusStationScoreId);
                    table.ForeignKey(
                        name: "FK_FocusScore_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId");
                    table.ForeignKey(
                        name: "FK_FocusScore_Station",
                        column: x => x.StationId,
                        principalSchema: "Core",
                        principalTable: "Station",
                        principalColumn: "StationId");
                    table.ForeignKey(
                        name: "FK_FocusScore_User",
                        column: x => x.UserId,
                        principalSchema: "Security",
                        principalTable: "User",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MlModel",
                schema: "AI",
                columns: table => new
                {
                    ModelId = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ModelType = table.Column<string>(type: "character varying(50)", unicode: false, maxLength: 50, nullable: false),
                    StationId = table.Column<Guid>(type: "uuid", nullable: true),
                    ParameterId = table.Column<int>(type: "integer", nullable: true),
                    Version = table.Column<string>(type: "character varying(50)", unicode: false, maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", unicode: false, maxLength: 20, nullable: false, defaultValue: "TRAINING"),
                    TrainedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    PromotedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    MetricsJson = table.Column<string>(type: "text", nullable: true),
                    ArtifactPath = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ArtifactSha256 = table.Column<string>(type: "character varying(64)", unicode: false, maxLength: 64, nullable: true),
                    FeatureSetVersion = table.Column<string>(type: "character varying(50)", unicode: false, maxLength: 50, nullable: true),
                    CleaningRulesetVersion = table.Column<string>(type: "character varying(50)", unicode: false, maxLength: 50, nullable: true),
                    HyperparametersJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MlModel", x => x.ModelId);
                    table.ForeignKey(
                        name: "FK_MlModel_FeatureSet",
                        column: x => x.FeatureSetVersion,
                        principalSchema: "Telemetry",
                        principalTable: "FeatureSet",
                        principalColumn: "FeatureSetVersion");
                    table.ForeignKey(
                        name: "FK_MlModel_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId");
                    table.ForeignKey(
                        name: "FK_MlModel_Parameter",
                        column: x => x.ParameterId,
                        principalSchema: "Core",
                        principalTable: "Parameter",
                        principalColumn: "ParameterId");
                    table.ForeignKey(
                        name: "FK_MlModel_Station",
                        column: x => x.StationId,
                        principalSchema: "Core",
                        principalTable: "Station",
                        principalColumn: "StationId");
                });

            migrationBuilder.CreateTable(
                name: "Report",
                schema: "Reporting",
                columns: table => new
                {
                    ReportId = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    StationId = table.Column<Guid>(type: "uuid", nullable: true),
                    ParameterId = table.Column<int>(type: "integer", nullable: true),
                    PeriodStartUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    PeriodEndUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    Format = table.Column<string>(type: "character varying(20)", unicode: false, maxLength: 20, nullable: false, defaultValue: "PDF"),
                    Status = table.Column<string>(type: "character varying(20)", unicode: false, maxLength: 20, nullable: false, defaultValue: "QUEUED"),
                    FilePath = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    SummaryJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())"),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Report", x => x.ReportId);
                    table.ForeignKey(
                        name: "FK_Report_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId");
                    table.ForeignKey(
                        name: "FK_Report_Parameter",
                        column: x => x.ParameterId,
                        principalSchema: "Core",
                        principalTable: "Parameter",
                        principalColumn: "ParameterId");
                    table.ForeignKey(
                        name: "FK_Report_Station",
                        column: x => x.StationId,
                        principalSchema: "Core",
                        principalTable: "Station",
                        principalColumn: "StationId");
                    table.ForeignKey(
                        name: "FK_Report_User",
                        column: x => x.RequestedByUserId,
                        principalSchema: "Security",
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "ReportSchedule",
                schema: "Reporting",
                columns: table => new
                {
                    ReportScheduleId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    StationId = table.Column<Guid>(type: "uuid", nullable: true),
                    ParameterId = table.Column<int>(type: "integer", nullable: true),
                    Frequency = table.Column<string>(type: "character varying(20)", unicode: false, maxLength: 20, nullable: false),
                    Format = table.Column<string>(type: "character varying(20)", unicode: false, maxLength: 20, nullable: false),
                    RecipientJson = table.Column<string>(type: "text", nullable: false),
                    NextRunAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    LastRunAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReportSchedule", x => x.ReportScheduleId);
                    table.ForeignKey(
                        name: "FK_ReportSchedule_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId");
                    table.ForeignKey(
                        name: "FK_ReportSchedule_Parameter",
                        column: x => x.ParameterId,
                        principalSchema: "Core",
                        principalTable: "Parameter",
                        principalColumn: "ParameterId");
                    table.ForeignKey(
                        name: "FK_ReportSchedule_Station",
                        column: x => x.StationId,
                        principalSchema: "Core",
                        principalTable: "Station",
                        principalColumn: "StationId");
                    table.ForeignKey(
                        name: "FK_ReportSchedule_User",
                        column: x => x.CreatedByUserId,
                        principalSchema: "Security",
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "RiskScore",
                schema: "AI",
                columns: table => new
                {
                    RiskScoreId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    StationId = table.Column<Guid>(type: "uuid", nullable: true),
                    RegionId = table.Column<Guid>(type: "uuid", nullable: true),
                    Score = table.Column<decimal>(type: "numeric(6,2)", nullable: false),
                    ForecastProximity = table.Column<decimal>(type: "numeric(6,3)", nullable: true),
                    UpstreamPropagation = table.Column<decimal>(type: "numeric(6,3)", nullable: true),
                    AnomalyPresence = table.Column<decimal>(type: "numeric(6,3)", nullable: true),
                    TrendSlope = table.Column<decimal>(type: "numeric(18,8)", nullable: true),
                    WeightsJson = table.Column<string>(type: "text", nullable: true),
                    ComputedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskScore", x => x.RiskScoreId);
                    table.ForeignKey(
                        name: "FK_RiskScore_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId");
                    table.ForeignKey(
                        name: "FK_RiskScore_Region",
                        column: x => x.RegionId,
                        principalSchema: "Core",
                        principalTable: "Region",
                        principalColumn: "RegionId");
                    table.ForeignKey(
                        name: "FK_RiskScore_Station",
                        column: x => x.StationId,
                        principalSchema: "Core",
                        principalTable: "Station",
                        principalColumn: "StationId");
                });

            migrationBuilder.CreateTable(
                name: "ShareSnapshot",
                schema: "Platform",
                columns: table => new
                {
                    ShareSnapshotId = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    StationId = table.Column<Guid>(type: "uuid", nullable: true),
                    SnapshotJson = table.Column<string>(type: "text", nullable: false),
                    TokenHash = table.Column<string>(type: "character varying(128)", unicode: false, maxLength: 128, nullable: false),
                    ExpiresAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    RevokedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShareSnapshot", x => x.ShareSnapshotId);
                    table.ForeignKey(
                        name: "FK_ShareSnapshot_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId");
                    table.ForeignKey(
                        name: "FK_ShareSnapshot_Station",
                        column: x => x.StationId,
                        principalSchema: "Core",
                        principalTable: "Station",
                        principalColumn: "StationId");
                    table.ForeignKey(
                        name: "FK_ShareSnapshot_User",
                        column: x => x.CreatedByUserId,
                        principalSchema: "Security",
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "StationCollaborationNote",
                schema: "Operations",
                columns: table => new
                {
                    NoteId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    StationId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentNoteId = table.Column<long>(type: "bigint", nullable: true),
                    NoteText = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    IsResolved = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())"),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StationCollaborationNote", x => x.NoteId);
                    table.ForeignKey(
                        name: "FK_Note_Author",
                        column: x => x.AuthorUserId,
                        principalSchema: "Security",
                        principalTable: "User",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_Note_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId");
                    table.ForeignKey(
                        name: "FK_Note_Parent",
                        column: x => x.ParentNoteId,
                        principalSchema: "Operations",
                        principalTable: "StationCollaborationNote",
                        principalColumn: "NoteId");
                    table.ForeignKey(
                        name: "FK_Note_Station",
                        column: x => x.StationId,
                        principalSchema: "Core",
                        principalTable: "Station",
                        principalColumn: "StationId");
                });

            migrationBuilder.CreateTable(
                name: "StationConnection",
                schema: "Core",
                columns: table => new
                {
                    StationConnectionId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    StationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Protocol = table.Column<string>(type: "character varying(30)", unicode: false, maxLength: 30, nullable: false),
                    DeviceIdentifier = table.Column<string>(type: "character varying(150)", unicode: false, maxLength: 150, nullable: true),
                    FirmwareVersion = table.Column<string>(type: "character varying(80)", unicode: false, maxLength: 80, nullable: true),
                    SignalStrength = table.Column<decimal>(type: "numeric(10,3)", nullable: true),
                    BatteryVoltage = table.Column<decimal>(type: "numeric(10,4)", nullable: true),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    LastConnectedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StationConnection", x => x.StationConnectionId);
                    table.ForeignKey(
                        name: "FK_StationConnection_Station",
                        column: x => x.StationId,
                        principalSchema: "Core",
                        principalTable: "Station",
                        principalColumn: "StationId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StationLink",
                schema: "Core",
                columns: table => new
                {
                    StationLinkId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    FromStationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ToStationId = table.Column<Guid>(type: "uuid", nullable: false),
                    LinkType = table.Column<string>(type: "character varying(30)", unicode: false, maxLength: 30, nullable: false, defaultValue: "DOWNSTREAM"),
                    DistanceMeters = table.Column<decimal>(type: "numeric(12,3)", nullable: true),
                    FlowDirection = table.Column<string>(type: "character varying(20)", unicode: false, maxLength: 20, nullable: false, defaultValue: "FORWARD"),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StationLink", x => x.StationLinkId);
                    table.ForeignKey(
                        name: "FK_StationLink_From",
                        column: x => x.FromStationId,
                        principalSchema: "Core",
                        principalTable: "Station",
                        principalColumn: "StationId");
                    table.ForeignKey(
                        name: "FK_StationLink_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StationLink_To",
                        column: x => x.ToStationId,
                        principalSchema: "Core",
                        principalTable: "Station",
                        principalColumn: "StationId");
                });

            migrationBuilder.CreateTable(
                name: "StationParameter",
                schema: "Core",
                columns: table => new
                {
                    StationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParameterId = table.Column<int>(type: "integer", nullable: false),
                    SourceUnit = table.Column<string>(type: "character varying(32)", unicode: false, maxLength: 32, nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CalibrationOffset = table.Column<decimal>(type: "numeric(18,6)", nullable: false),
                    CalibrationScale = table.Column<decimal>(type: "numeric(18,6)", nullable: false, defaultValue: 1m),
                    InstalledAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    LastCalibrationAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StationParameter", x => new { x.StationId, x.ParameterId });
                    table.ForeignKey(
                        name: "FK_StationParameter_Parameter",
                        column: x => x.ParameterId,
                        principalSchema: "Core",
                        principalTable: "Parameter",
                        principalColumn: "ParameterId");
                    table.ForeignKey(
                        name: "FK_StationParameter_Station",
                        column: x => x.StationId,
                        principalSchema: "Core",
                        principalTable: "Station",
                        principalColumn: "StationId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AlarmLabel",
                schema: "Operations",
                columns: table => new
                {
                    AlarmLabelId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AlarmId = table.Column<Guid>(type: "uuid", nullable: false),
                    Label = table.Column<string>(type: "character varying(30)", unicode: false, maxLength: 30, nullable: false),
                    LabeledByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    LabeledAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())"),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlarmLabel", x => x.AlarmLabelId);
                    table.ForeignKey(
                        name: "FK_AlarmLabel_Alarm",
                        column: x => x.AlarmId,
                        principalSchema: "Operations",
                        principalTable: "Alarm",
                        principalColumn: "AlarmId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AlarmLabel_User",
                        column: x => x.LabeledByUserId,
                        principalSchema: "Security",
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "Notification",
                schema: "Operations",
                columns: table => new
                {
                    NotificationId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    AlarmId = table.Column<Guid>(type: "uuid", nullable: true),
                    Title = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Body = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Severity = table.Column<string>(type: "character varying(20)", unicode: false, maxLength: 20, nullable: false, defaultValue: "INFO"),
                    Channel = table.Column<string>(type: "character varying(20)", unicode: false, maxLength: 20, nullable: false, defaultValue: "IN_APP"),
                    ReadAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    SentAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notification", x => x.NotificationId);
                    table.ForeignKey(
                        name: "FK_Notification_Alarm",
                        column: x => x.AlarmId,
                        principalSchema: "Operations",
                        principalTable: "Alarm",
                        principalColumn: "AlarmId");
                    table.ForeignKey(
                        name: "FK_Notification_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId");
                    table.ForeignKey(
                        name: "FK_Notification_User",
                        column: x => x.UserId,
                        principalSchema: "Security",
                        principalTable: "User",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MlTrainingRun",
                schema: "AI",
                columns: table => new
                {
                    TrainingRunId = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    ModelId = table.Column<Guid>(type: "uuid", nullable: true),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    StartedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    FinishedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    DatasetStartUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    DatasetEndUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    FeatureSetVersion = table.Column<string>(type: "character varying(50)", unicode: false, maxLength: 50, nullable: true),
                    CleaningRulesetVersion = table.Column<string>(type: "character varying(50)", unicode: false, maxLength: 50, nullable: true),
                    TriggerSource = table.Column<string>(type: "character varying(30)", unicode: false, maxLength: 30, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", unicode: false, maxLength: 20, nullable: false, defaultValue: "RUNNING"),
                    MetricsJson = table.Column<string>(type: "text", nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    RowsRead = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MlTrainingRun", x => x.TrainingRunId);
                    table.ForeignKey(
                        name: "FK_TrainingRun_FeatureSet",
                        column: x => x.FeatureSetVersion,
                        principalSchema: "Telemetry",
                        principalTable: "FeatureSet",
                        principalColumn: "FeatureSetVersion");
                    table.ForeignKey(
                        name: "FK_TrainingRun_Model",
                        column: x => x.ModelId,
                        principalSchema: "AI",
                        principalTable: "MlModel",
                        principalColumn: "ModelId");
                    table.ForeignKey(
                        name: "FK_TrainingRun_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId");
                });

            migrationBuilder.CreateTable(
                name: "StationCluster",
                schema: "AI",
                columns: table => new
                {
                    StationClusterId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    StationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClusterId = table.Column<int>(type: "integer", nullable: false),
                    ClusterProfile = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    FeatureVectorJson = table.Column<string>(type: "text", nullable: true),
                    AssignedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())"),
                    ModelId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StationCluster", x => x.StationClusterId);
                    table.ForeignKey(
                        name: "FK_StationCluster_Model",
                        column: x => x.ModelId,
                        principalSchema: "AI",
                        principalTable: "MlModel",
                        principalColumn: "ModelId");
                    table.ForeignKey(
                        name: "FK_StationCluster_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId");
                    table.ForeignKey(
                        name: "FK_StationCluster_Station",
                        column: x => x.StationId,
                        principalSchema: "Core",
                        principalTable: "Station",
                        principalColumn: "StationId");
                });

            migrationBuilder.CreateTable(
                name: "FeatureStoreEntry",
                schema: "Telemetry",
                columns: table => new
                {
                    FeatureStoreEntryId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    StationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParameterId = table.Column<int>(type: "integer", nullable: false),
                    TimestampUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    FeatureSetVersion = table.Column<string>(type: "character varying(50)", unicode: false, maxLength: 50, nullable: false),
                    FeaturesJson = table.Column<string>(type: "text", nullable: false),
                    SourceQualitySummary = table.Column<string>(type: "character varying(20)", unicode: false, maxLength: 20, nullable: false, defaultValue: "VALID"),
                    ComputedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeatureStoreEntry", x => x.FeatureStoreEntryId);
                    table.ForeignKey(
                        name: "FK_FeatureStore_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId");
                    table.ForeignKey(
                        name: "FK_FeatureStore_Set",
                        column: x => x.FeatureSetVersion,
                        principalSchema: "Telemetry",
                        principalTable: "FeatureSet",
                        principalColumn: "FeatureSetVersion");
                    table.ForeignKey(
                        name: "FK_FeatureStore_StationParameter",
                        columns: x => new { x.StationId, x.ParameterId },
                        principalSchema: "Core",
                        principalTable: "StationParameter",
                        principalColumns: new[] { "StationId", "ParameterId" });
                });

            migrationBuilder.CreateTable(
                name: "MeasurementRaw",
                schema: "Telemetry",
                columns: table => new
                {
                    MeasurementRawId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    StationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParameterId = table.Column<int>(type: "integer", nullable: false),
                    IngestionBatchId = table.Column<Guid>(type: "uuid", nullable: true),
                    DeviceTimestampUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    IngestionTimestampUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())"),
                    RawValue = table.Column<decimal>(type: "numeric(38,12)", nullable: true),
                    RawUnit = table.Column<string>(type: "character varying(32)", unicode: false, maxLength: 32, nullable: true),
                    PayloadJson = table.Column<string>(type: "text", nullable: true),
                    DeviceSequence = table.Column<long>(type: "bigint", nullable: true),
                    DuplicateOfId = table.Column<long>(type: "bigint", nullable: true),
                    IsDuplicate = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MeasurementRaw", x => x.MeasurementRawId);
                    table.ForeignKey(
                        name: "FK_Raw_Batch",
                        column: x => x.IngestionBatchId,
                        principalSchema: "Telemetry",
                        principalTable: "IngestionBatch",
                        principalColumn: "IngestionBatchId");
                    table.ForeignKey(
                        name: "FK_Raw_Duplicate",
                        column: x => x.DuplicateOfId,
                        principalSchema: "Telemetry",
                        principalTable: "MeasurementRaw",
                        principalColumn: "MeasurementRawId");
                    table.ForeignKey(
                        name: "FK_Raw_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId");
                    table.ForeignKey(
                        name: "FK_Raw_StationParameter",
                        columns: x => new { x.StationId, x.ParameterId },
                        principalSchema: "Core",
                        principalTable: "StationParameter",
                        principalColumns: new[] { "StationId", "ParameterId" });
                });

            migrationBuilder.CreateTable(
                name: "Threshold",
                schema: "Core",
                columns: table => new
                {
                    ThresholdId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    StationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParameterId = table.Column<int>(type: "integer", nullable: false),
                    WarningLow = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    WarningHigh = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    CriticalLow = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    CriticalHigh = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    EffectiveFromUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())"),
                    EffectiveToUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    UpdatedByUserId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Threshold", x => x.ThresholdId);
                    table.ForeignKey(
                        name: "FK_Threshold_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Threshold_StationParameter",
                        columns: x => new { x.StationId, x.ParameterId },
                        principalSchema: "Core",
                        principalTable: "StationParameter",
                        principalColumns: new[] { "StationId", "ParameterId" });
                    table.ForeignKey(
                        name: "FK_Threshold_User",
                        column: x => x.UpdatedByUserId,
                        principalSchema: "Security",
                        principalTable: "User",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "MeasurementClean",
                schema: "Telemetry",
                columns: table => new
                {
                    MeasurementCleanId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    StationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParameterId = table.Column<int>(type: "integer", nullable: false),
                    SourceRawId = table.Column<long>(type: "bigint", nullable: true),
                    TimestampUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    Value = table.Column<decimal>(type: "numeric(38,12)", nullable: true),
                    CanonicalUnit = table.Column<string>(type: "character varying(32)", unicode: false, maxLength: 32, nullable: false),
                    QualityFlag = table.Column<string>(type: "character varying(20)", unicode: false, maxLength: 20, nullable: false, defaultValue: "VALID"),
                    QuarantineReason = table.Column<string>(type: "character varying(80)", unicode: false, maxLength: 80, nullable: true),
                    CleaningRulesetVersion = table.Column<string>(type: "character varying(50)", unicode: false, maxLength: 50, nullable: false),
                    IsInterpolated = table.Column<bool>(type: "boolean", nullable: false),
                    IsGapBoundary = table.Column<bool>(type: "boolean", nullable: false),
                    ProcessedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false, defaultValueSql: "timezone('utc', now())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MeasurementClean", x => x.MeasurementCleanId);
                    table.ForeignKey(
                        name: "FK_Clean_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId");
                    table.ForeignKey(
                        name: "FK_Clean_Raw",
                        column: x => x.SourceRawId,
                        principalSchema: "Telemetry",
                        principalTable: "MeasurementRaw",
                        principalColumn: "MeasurementRawId");
                    table.ForeignKey(
                        name: "FK_Clean_StationParameter",
                        columns: x => new { x.StationId, x.ParameterId },
                        principalSchema: "Core",
                        principalTable: "StationParameter",
                        principalColumns: new[] { "StationId", "ParameterId" });
                });

            migrationBuilder.CreateTable(
                name: "AnomalyEvent",
                schema: "AI",
                columns: table => new
                {
                    AnomalyEventId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    StationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParameterId = table.Column<int>(type: "integer", nullable: true),
                    MeasurementCleanId = table.Column<long>(type: "bigint", nullable: true),
                    ReasonCode = table.Column<string>(type: "character varying(30)", unicode: false, maxLength: 30, nullable: false),
                    Score = table.Column<decimal>(type: "numeric(9,6)", nullable: false),
                    DetectedAtUtc = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    WindowMinutes = table.Column<int>(type: "integer", nullable: true),
                    DetailsJson = table.Column<string>(type: "text", nullable: true),
                    IsReviewed = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnomalyEvent", x => x.AnomalyEventId);
                    table.ForeignKey(
                        name: "FK_Anomaly_Measurement",
                        column: x => x.MeasurementCleanId,
                        principalSchema: "Telemetry",
                        principalTable: "MeasurementClean",
                        principalColumn: "MeasurementCleanId");
                    table.ForeignKey(
                        name: "FK_Anomaly_Organization",
                        column: x => x.OrganizationId,
                        principalSchema: "Platform",
                        principalTable: "Organization",
                        principalColumn: "OrganizationId");
                    table.ForeignKey(
                        name: "FK_Anomaly_Parameter",
                        column: x => x.ParameterId,
                        principalSchema: "Core",
                        principalTable: "Parameter",
                        principalColumn: "ParameterId");
                    table.ForeignKey(
                        name: "FK_Anomaly_Station",
                        column: x => x.StationId,
                        principalSchema: "Core",
                        principalTable: "Station",
                        principalColumn: "StationId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Alarm_AcknowledgedByUserId",
                schema: "Operations",
                table: "Alarm",
                column: "AcknowledgedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Alarm_AlarmTypeId",
                schema: "Operations",
                table: "Alarm",
                column: "AlarmTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Alarm_Open",
                schema: "Operations",
                table: "Alarm",
                columns: new[] { "OrganizationId", "Status", "Severity", "RaisedAtUtc" },
                descending: new[] { false, false, false, true });

            migrationBuilder.CreateIndex(
                name: "IX_Alarm_ParameterId",
                schema: "Operations",
                table: "Alarm",
                column: "ParameterId");

            migrationBuilder.CreateIndex(
                name: "IX_Alarm_ResolvedByUserId",
                schema: "Operations",
                table: "Alarm",
                column: "ResolvedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Alarm_Station_Date",
                schema: "Operations",
                table: "Alarm",
                columns: new[] { "StationId", "RaisedAtUtc" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_AlarmLabel_AlarmId",
                schema: "Operations",
                table: "AlarmLabel",
                column: "AlarmId");

            migrationBuilder.CreateIndex(
                name: "IX_AlarmLabel_LabeledByUserId",
                schema: "Operations",
                table: "AlarmLabel",
                column: "LabeledByUserId");

            migrationBuilder.CreateIndex(
                name: "UQ_AlarmType_Code",
                schema: "Operations",
                table: "AlarmType",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Anomaly_Station_Date",
                schema: "AI",
                table: "AnomalyEvent",
                columns: new[] { "StationId", "DetectedAtUtc" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_AnomalyEvent_MeasurementCleanId",
                schema: "AI",
                table: "AnomalyEvent",
                column: "MeasurementCleanId");

            migrationBuilder.CreateIndex(
                name: "IX_AnomalyEvent_OrganizationId",
                schema: "AI",
                table: "AnomalyEvent",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_AnomalyEvent_ParameterId",
                schema: "AI",
                table: "AnomalyEvent",
                column: "ParameterId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLog_ActorUserId",
                schema: "Security",
                table: "AuditLog",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLog_OrganizationId",
                schema: "Security",
                table: "AuditLog",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_ChartAnnotation_OrganizationId",
                schema: "Operations",
                table: "ChartAnnotation",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_ChartAnnotation_ParameterId",
                schema: "Operations",
                table: "ChartAnnotation",
                column: "ParameterId");

            migrationBuilder.CreateIndex(
                name: "IX_ChartAnnotation_StationId",
                schema: "Operations",
                table: "ChartAnnotation",
                column: "StationId");

            migrationBuilder.CreateIndex(
                name: "IX_ChartAnnotation_UserId",
                schema: "Operations",
                table: "ChartAnnotation",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "UQ_DashboardLayout",
                schema: "Platform",
                table: "DashboardLayout",
                columns: new[] { "UserId", "LayoutName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DataQualityLog_OrganizationId",
                schema: "Telemetry",
                table: "DataQualityLog",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_DataQualityLog_StationId",
                schema: "Telemetry",
                table: "DataQualityLog",
                column: "StationId");

            migrationBuilder.CreateIndex(
                name: "IX_FeatureStoreEntry_FeatureSetVersion",
                schema: "Telemetry",
                table: "FeatureStoreEntry",
                column: "FeatureSetVersion");

            migrationBuilder.CreateIndex(
                name: "IX_FeatureStoreEntry_OrganizationId",
                schema: "Telemetry",
                table: "FeatureStoreEntry",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "UX_FeatureStore_Key",
                schema: "Telemetry",
                table: "FeatureStoreEntry",
                columns: new[] { "StationId", "ParameterId", "TimestampUtc", "FeatureSetVersion" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FocusStationScore_OrganizationId",
                schema: "AI",
                table: "FocusStationScore",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_FocusStationScore_StationId",
                schema: "AI",
                table: "FocusStationScore",
                column: "StationId");

            migrationBuilder.CreateIndex(
                name: "IX_FocusStationScore_UserId",
                schema: "AI",
                table: "FocusStationScore",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_IngestionBatch_OrganizationId",
                schema: "Telemetry",
                table: "IngestionBatch",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_Clean_Chart",
                schema: "Telemetry",
                table: "MeasurementClean",
                columns: new[] { "StationId", "TimestampUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_Clean_Time",
                schema: "Telemetry",
                table: "MeasurementClean",
                columns: new[] { "OrganizationId", "TimestampUtc", "QualityFlag" });

            migrationBuilder.CreateIndex(
                name: "IX_MeasurementClean_SourceRawId",
                schema: "Telemetry",
                table: "MeasurementClean",
                column: "SourceRawId");

            migrationBuilder.CreateIndex(
                name: "UX_Clean_Key",
                schema: "Telemetry",
                table: "MeasurementClean",
                columns: new[] { "StationId", "ParameterId", "TimestampUtc" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MeasurementRaw_DuplicateOfId",
                schema: "Telemetry",
                table: "MeasurementRaw",
                column: "DuplicateOfId");

            migrationBuilder.CreateIndex(
                name: "IX_MeasurementRaw_IngestionBatchId",
                schema: "Telemetry",
                table: "MeasurementRaw",
                column: "IngestionBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_MeasurementRaw_OrganizationId",
                schema: "Telemetry",
                table: "MeasurementRaw",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_Raw_Station_Time",
                schema: "Telemetry",
                table: "MeasurementRaw",
                columns: new[] { "StationId", "ParameterId", "DeviceTimestampUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_MlModel_FeatureSetVersion",
                schema: "AI",
                table: "MlModel",
                column: "FeatureSetVersion");

            migrationBuilder.CreateIndex(
                name: "IX_MlModel_ParameterId",
                schema: "AI",
                table: "MlModel",
                column: "ParameterId");

            migrationBuilder.CreateIndex(
                name: "IX_MlModel_StationId",
                schema: "AI",
                table: "MlModel",
                column: "StationId");

            migrationBuilder.CreateIndex(
                name: "UX_MlModel_Version",
                schema: "AI",
                table: "MlModel",
                columns: new[] { "OrganizationId", "ModelType", "StationId", "ParameterId", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MlTrainingRun_FeatureSetVersion",
                schema: "AI",
                table: "MlTrainingRun",
                column: "FeatureSetVersion");

            migrationBuilder.CreateIndex(
                name: "IX_MlTrainingRun_ModelId",
                schema: "AI",
                table: "MlTrainingRun",
                column: "ModelId");

            migrationBuilder.CreateIndex(
                name: "IX_MlTrainingRun_OrganizationId",
                schema: "AI",
                table: "MlTrainingRun",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_AlarmId",
                schema: "Operations",
                table: "Notification",
                column: "AlarmId");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_OrganizationId",
                schema: "Operations",
                table: "Notification",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_Unread",
                schema: "Operations",
                table: "Notification",
                columns: new[] { "UserId", "CreatedAtUtc" },
                descending: new[] { false, true },
                filter: "\"ReadAtUtc\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "UQ_Organization_Name",
                schema: "Platform",
                table: "Organization",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_Organization_Slug",
                schema: "Platform",
                table: "Organization",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_Parameter_Code",
                schema: "Core",
                table: "Parameter",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_Permission_Code",
                schema: "Security",
                table: "Permission",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_Region_Code",
                schema: "Core",
                table: "Region",
                columns: new[] { "OrganizationId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_Region_Name",
                schema: "Core",
                table: "Region",
                columns: new[] { "OrganizationId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Report_Date",
                schema: "Reporting",
                table: "Report",
                columns: new[] { "OrganizationId", "CreatedAtUtc" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_Report_ParameterId",
                schema: "Reporting",
                table: "Report",
                column: "ParameterId");

            migrationBuilder.CreateIndex(
                name: "IX_Report_RequestedByUserId",
                schema: "Reporting",
                table: "Report",
                column: "RequestedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Report_StationId",
                schema: "Reporting",
                table: "Report",
                column: "StationId");

            migrationBuilder.CreateIndex(
                name: "IX_ReportSchedule_CreatedByUserId",
                schema: "Reporting",
                table: "ReportSchedule",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ReportSchedule_OrganizationId",
                schema: "Reporting",
                table: "ReportSchedule",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_ReportSchedule_ParameterId",
                schema: "Reporting",
                table: "ReportSchedule",
                column: "ParameterId");

            migrationBuilder.CreateIndex(
                name: "IX_ReportSchedule_StationId",
                schema: "Reporting",
                table: "ReportSchedule",
                column: "StationId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskScore_OrganizationId",
                schema: "AI",
                table: "RiskScore",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskScore_RegionId",
                schema: "AI",
                table: "RiskScore",
                column: "RegionId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskScore_StationId",
                schema: "AI",
                table: "RiskScore",
                column: "StationId");

            migrationBuilder.CreateIndex(
                name: "UQ_Role_Code",
                schema: "Security",
                table: "Role",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RolePermission_PermissionId",
                schema: "Security",
                table: "RolePermission",
                column: "PermissionId");

            migrationBuilder.CreateIndex(
                name: "IX_Session_UserId",
                schema: "Security",
                table: "Session",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "UX_Session_Token",
                schema: "Security",
                table: "Session",
                column: "RefreshTokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShareSnapshot_CreatedByUserId",
                schema: "Platform",
                table: "ShareSnapshot",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ShareSnapshot_OrganizationId",
                schema: "Platform",
                table: "ShareSnapshot",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_ShareSnapshot_StationId",
                schema: "Platform",
                table: "ShareSnapshot",
                column: "StationId");

            migrationBuilder.CreateIndex(
                name: "UQ_ShareSnapshot_Token",
                schema: "Platform",
                table: "ShareSnapshot",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Station_RegionId",
                schema: "Core",
                table: "Station",
                column: "RegionId");

            migrationBuilder.CreateIndex(
                name: "IX_Station_Status",
                schema: "Core",
                table: "Station",
                columns: new[] { "OrganizationId", "Status", "Name" });

            migrationBuilder.CreateIndex(
                name: "UQ_Station_Code",
                schema: "Core",
                table: "Station",
                columns: new[] { "OrganizationId", "StationCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StationCluster_ModelId",
                schema: "AI",
                table: "StationCluster",
                column: "ModelId");

            migrationBuilder.CreateIndex(
                name: "IX_StationCluster_OrganizationId",
                schema: "AI",
                table: "StationCluster",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_StationCluster_StationId",
                schema: "AI",
                table: "StationCluster",
                column: "StationId");

            migrationBuilder.CreateIndex(
                name: "IX_StationCollaborationNote_AuthorUserId",
                schema: "Operations",
                table: "StationCollaborationNote",
                column: "AuthorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StationCollaborationNote_OrganizationId",
                schema: "Operations",
                table: "StationCollaborationNote",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_StationCollaborationNote_ParentNoteId",
                schema: "Operations",
                table: "StationCollaborationNote",
                column: "ParentNoteId");

            migrationBuilder.CreateIndex(
                name: "IX_StationCollaborationNote_StationId",
                schema: "Operations",
                table: "StationCollaborationNote",
                column: "StationId");

            migrationBuilder.CreateIndex(
                name: "IX_StationConnection_StationId",
                schema: "Core",
                table: "StationConnection",
                column: "StationId");

            migrationBuilder.CreateIndex(
                name: "UX_StationConnection_Device",
                schema: "Core",
                table: "StationConnection",
                column: "DeviceIdentifier",
                unique: true,
                filter: "\"DeviceIdentifier\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_StationLink_OrganizationId",
                schema: "Core",
                table: "StationLink",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_StationLink_ToStationId",
                schema: "Core",
                table: "StationLink",
                column: "ToStationId");

            migrationBuilder.CreateIndex(
                name: "UQ_StationLink",
                schema: "Core",
                table: "StationLink",
                columns: new[] { "FromStationId", "ToStationId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StationParameter_ParameterId",
                schema: "Core",
                table: "StationParameter",
                column: "ParameterId");

            migrationBuilder.CreateIndex(
                name: "UQ_SystemSetting",
                schema: "Platform",
                table: "SystemSetting",
                columns: new[] { "OrganizationId", "SettingKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Threshold_Current",
                schema: "Core",
                table: "Threshold",
                columns: new[] { "StationId", "ParameterId", "EffectiveFromUtc" },
                descending: new[] { false, false, true },
                filter: "\"IsActive\" = TRUE");

            migrationBuilder.CreateIndex(
                name: "IX_Threshold_OrganizationId",
                schema: "Core",
                table: "Threshold",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_Threshold_UpdatedByUserId",
                schema: "Core",
                table: "Threshold",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_User_Active",
                schema: "Security",
                table: "User",
                columns: new[] { "OrganizationId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "UX_User_Email",
                schema: "Security",
                table: "User",
                columns: new[] { "OrganizationId", "Email" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserRole_AssignedByUserId",
                schema: "Security",
                table: "UserRole",
                column: "AssignedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserRole_RoleId",
                schema: "Security",
                table: "UserRole",
                column: "RoleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlarmLabel",
                schema: "Operations");

            migrationBuilder.DropTable(
                name: "AnomalyEvent",
                schema: "AI");

            migrationBuilder.DropTable(
                name: "AuditLog",
                schema: "Security");

            migrationBuilder.DropTable(
                name: "ChartAnnotation",
                schema: "Operations");

            migrationBuilder.DropTable(
                name: "DashboardLayout",
                schema: "Platform");

            migrationBuilder.DropTable(
                name: "DataQualityLog",
                schema: "Telemetry");

            migrationBuilder.DropTable(
                name: "FeatureStoreEntry",
                schema: "Telemetry");

            migrationBuilder.DropTable(
                name: "FocusStationScore",
                schema: "AI");

            migrationBuilder.DropTable(
                name: "MlTrainingRun",
                schema: "AI");

            migrationBuilder.DropTable(
                name: "Notification",
                schema: "Operations");

            migrationBuilder.DropTable(
                name: "NotificationPreference",
                schema: "Operations");

            migrationBuilder.DropTable(
                name: "Report",
                schema: "Reporting");

            migrationBuilder.DropTable(
                name: "ReportSchedule",
                schema: "Reporting");

            migrationBuilder.DropTable(
                name: "RiskScore",
                schema: "AI");

            migrationBuilder.DropTable(
                name: "RolePermission",
                schema: "Security");

            migrationBuilder.DropTable(
                name: "Session",
                schema: "Security");

            migrationBuilder.DropTable(
                name: "ShareSnapshot",
                schema: "Platform");

            migrationBuilder.DropTable(
                name: "StationCluster",
                schema: "AI");

            migrationBuilder.DropTable(
                name: "StationCollaborationNote",
                schema: "Operations");

            migrationBuilder.DropTable(
                name: "StationConnection",
                schema: "Core");

            migrationBuilder.DropTable(
                name: "StationLink",
                schema: "Core");

            migrationBuilder.DropTable(
                name: "SystemSetting",
                schema: "Platform");

            migrationBuilder.DropTable(
                name: "Threshold",
                schema: "Core");

            migrationBuilder.DropTable(
                name: "UserRole",
                schema: "Security");

            migrationBuilder.DropTable(
                name: "MeasurementClean",
                schema: "Telemetry");

            migrationBuilder.DropTable(
                name: "Alarm",
                schema: "Operations");

            migrationBuilder.DropTable(
                name: "Permission",
                schema: "Security");

            migrationBuilder.DropTable(
                name: "MlModel",
                schema: "AI");

            migrationBuilder.DropTable(
                name: "Role",
                schema: "Security");

            migrationBuilder.DropTable(
                name: "MeasurementRaw",
                schema: "Telemetry");

            migrationBuilder.DropTable(
                name: "User",
                schema: "Security");

            migrationBuilder.DropTable(
                name: "AlarmType",
                schema: "Operations");

            migrationBuilder.DropTable(
                name: "FeatureSet",
                schema: "Telemetry");

            migrationBuilder.DropTable(
                name: "IngestionBatch",
                schema: "Telemetry");

            migrationBuilder.DropTable(
                name: "StationParameter",
                schema: "Core");

            migrationBuilder.DropTable(
                name: "Parameter",
                schema: "Core");

            migrationBuilder.DropTable(
                name: "Station",
                schema: "Core");

            migrationBuilder.DropTable(
                name: "Region",
                schema: "Core");

            migrationBuilder.DropTable(
                name: "Organization",
                schema: "Platform");
        }
    }
}
