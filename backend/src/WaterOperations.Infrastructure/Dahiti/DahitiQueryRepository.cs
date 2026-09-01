using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Features.Dahiti.DTOs;
using WaterOperations.Application.Features.Dahiti.Exceptions;
using WaterOperations.Application.Features.Dahiti.Interfaces;
using WaterOperations.Infrastructure.Persistence;

namespace WaterOperations.Infrastructure.Dahiti;

public sealed class DahitiQueryRepository(WaterOperationsDbContext db) : IDahitiQueryRepository
{
    public async Task<List<DahitiStationDto>> GetStationsAsync(CancellationToken cancellationToken)
    {
        await db.Database.OpenConnectionAsync(cancellationToken);
        try
        {
            await using var command = db.Database.GetDbConnection().CreateCommand();
            command.CommandText = """
                select s.dahiti_id, s.target_name, s.country, s.continent, s.latitude, s.longitude,
                       s.last_synced_at, l.observed_at, l.wse, l.uncertainty, s.observation_count
                from public.dahiti_stations s
                left join public.dahiti_station_latest l on l.dahiti_id = s.dahiti_id
                order by s.target_name, s.dahiti_id;
                """;
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            var result = new List<DahitiStationDto>();
            while (await reader.ReadAsync(cancellationToken))
            {
                result.Add(new DahitiStationDto(
                    $"DAHITI-{reader.GetInt32(0)}", reader.GetInt32(0), reader.GetString(1), reader.GetString(2), reader.GetString(3),
                    reader.GetDouble(4), reader.GetDouble(5), reader.IsDBNull(6) ? null : reader.GetFieldValue<DateTimeOffset>(6),
                    reader.IsDBNull(7) ? null : reader.GetFieldValue<DateTimeOffset>(7), reader.IsDBNull(8) ? null : reader.GetDouble(8),
                    reader.IsDBNull(9) ? null : reader.GetDouble(9), reader.GetInt32(10)));
            }
            return result;
        }
        catch (DbException exception) when (exception.SqlState == "42P01")
        {
            throw new DahitiDataNotInitializedException();
        }
        finally
        {
            await db.Database.CloseConnectionAsync();
        }
    }

    public async Task<List<DahitiMonthlyTrendDto>> GetMonthlyTrendAsync(
        int dahitiId,
        int months,
        CancellationToken cancellationToken)
    {
        await db.Database.OpenConnectionAsync(cancellationToken);
        try
        {
            await using var command = db.Database.GetDbConnection().CreateCommand();
            command.CommandText = """
                select date_trunc('month', observed_at at time zone 'UTC') at time zone 'UTC' as month,
                       avg(wse) as average_level, min(wse) as minimum_level, max(wse) as maximum_level,
                       count(*) as observation_count
                from public.dahiti_water_levels
                where dahiti_id = @dahiti_id
                  and observed_at >= date_trunc('month', now()) - make_interval(months => @months)
                group by 1 order by 1;
                """;
            var stationParameter = command.CreateParameter();
            stationParameter.ParameterName = "@dahiti_id";
            stationParameter.Value = dahitiId;
            command.Parameters.Add(stationParameter);
            var monthsParameter = command.CreateParameter();
            monthsParameter.ParameterName = "@months";
            monthsParameter.Value = months;
            command.Parameters.Add(monthsParameter);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            var result = new List<DahitiMonthlyTrendDto>();
            while (await reader.ReadAsync(cancellationToken))
            {
                result.Add(new DahitiMonthlyTrendDto(
                    reader.GetFieldValue<DateTime>(0), reader.GetDouble(1), reader.GetDouble(2),
                    reader.GetDouble(3), reader.GetInt64(4)));
            }
            return result;
        }
        catch (DbException exception) when (exception.SqlState == "42P01")
        {
            throw new DahitiDataNotInitializedException();
        }
        finally
        {
            await db.Database.CloseConnectionAsync();
        }
    }
}
