using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using WaterOperations.Application.Features.Dahiti.DTOs;
using WaterOperations.Application.Features.Dahiti.Exceptions;
using WaterOperations.Application.Features.Dahiti.Interfaces;
using WaterOperations.Application.Features.AI.DTOs;
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
                var id = reader.GetInt32(0);
                var rawName = reader.GetString(1);
                var lat = reader.GetDouble(4);
                var lon = reader.GetDouble(5);
                var resolvedName = ResolveStationLocationName(id, rawName, lat, lon);

                result.Add(new DahitiStationDto(
                    $"DAHITI-{id}", id, resolvedName, reader.GetString(2), reader.GetString(3),
                    lat, lon, reader.IsDBNull(6) ? null : reader.GetFieldValue<DateTimeOffset>(6),
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

    public static string ResolveStationLocationName(int dahitiId, string rawTargetName, double lat, double lon)
    {
        return dahitiId switch
        {
            17683 => "Wadi El Rayan Reservoir (Faiyum)",
            210 => "Lake Nasser (Aswan High Dam)",
            950 => "Nile - Nag Hammadi (Qena)",
            11691 => "Nile - Beni Suef Reach",
            15059 => "Nile - Farshut / Nag Hammadi (Qena)",
            15289 => "Nile - Dandara Bend (Qena)",
            15290 => "Nile - Armant Reach (Luxor)",
            16384 => "Nile - Tahta Reach (Sohag)",
            16740 => "Nile - Qena City Reach",
            17469 => "Nile - Beni Mazar (Minya)",
            17684 => "Nile - Matai Reach (Minya)",
            17685 => "Nile - Dairut Barrage (Asyut)",
            17687 => "Nile - Manfalut Reach (Asyut)",
            17694 => "Nile - Qus / Naqada (Qena)",
            17695 => "Nile - Luxor North (Karnak)",
            68 => "Lake Qarun (Faiyum)",
            17699 => "Toshka Lakes (East Basin)",
            27216 => "Toshka Lakes (South Basin)",
            8972 => "Nile Delta - Rosetta Branch (Beheira)",
            _ => ResolveByCoordinates(rawTargetName, lat, lon)
        };
    }

    private static string ResolveByCoordinates(string rawTargetName, double lat, double lon)
    {
        if (lat >= 30.7 && lon <= 30.9) return $"Nile Delta - Rosetta Branch ({lat:F2}°N)";
        if (lat >= 30.7 && lon > 30.9) return $"Nile Delta - Damietta Branch ({lat:F2}°N)";
        if (lat >= 29.8) return $"Nile - Greater Cairo Reach ({lat:F2}°N)";
        if (lat >= 28.8 && lon <= 30.7 && lat >= 29.1) return $"Faiyum Waterbody ({lat:F2}°N)";
        if (lat >= 28.8) return $"Nile - Beni Suef Reach ({lat:F2}°N)";
        if (lat >= 27.8) return $"Nile - Minya Reach ({lat:F2}°N)";
        if (lat >= 26.8) return $"Nile - Asyut Reach ({lat:F2}°N)";
        if (lat >= 26.2) return $"Nile - Sohag Reach ({lat:F2}°N)";
        if (lat >= 25.8) return $"Nile - Qena Reach ({lat:F2}°N)";
        if (lat >= 25.2) return $"Nile - Luxor Reach ({lat:F2}°N)";
        if (lat >= 24.0) return $"Nile - Aswan Reach ({lat:F2}°N)";
        if (lat < 24.0 && lon <= 31.5) return $"Toshka Lakes ({lat:F2}°N)";
        if (lat < 24.0) return $"Lake Nasser ({lat:F2}°N)";
        return rawTargetName;
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
                with monthly as (
                    select date_trunc('month', observed_at at time zone 'UTC') at time zone 'UTC' as month,
                           avg(wse) as average_level, min(wse) as minimum_level, max(wse) as maximum_level,
                           count(*) as observation_count
                    from public.dahiti_water_levels
                    where dahiti_id = @dahiti_id
                    group by 1
                    order by month desc
                    limit @months
                )
                select month, average_level, minimum_level, maximum_level, observation_count
                from monthly
                order by month;
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

    public async Task<List<DahitiReadingDto>> GetReadingsAsync(
        int dahitiId,
        int limit,
        CancellationToken cancellationToken)
    {
        await db.Database.OpenConnectionAsync(cancellationToken);
        try
        {
            await using var command = db.Database.GetDbConnection().CreateCommand();
            command.CommandText = """
                select observed_at, wse, uncertainty
                from public.dahiti_water_levels
                where dahiti_id = @dahiti_id
                order by observed_at asc
                limit @limit;
                """;
            var idParameter = command.CreateParameter();
            idParameter.ParameterName = "@dahiti_id";
            idParameter.Value = dahitiId;
            command.Parameters.Add(idParameter);
            var limitParameter = command.CreateParameter();
            limitParameter.ParameterName = "@limit";
            limitParameter.Value = Math.Clamp(limit, 1, 10000);
            command.Parameters.Add(limitParameter);

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            var result = new List<DahitiReadingDto>();
            while (await reader.ReadAsync(cancellationToken))
            {
                result.Add(new DahitiReadingDto(
                    reader.GetFieldValue<DateTimeOffset>(0),
                    reader.GetDouble(1),
                    reader.IsDBNull(2) ? null : reader.GetDouble(2)));
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

    public async Task<List<AiTelemetryObservation>> GetObservationsAsync(
        int dahitiId,
        int limit,
        CancellationToken cancellationToken)
    {
        await db.Database.OpenConnectionAsync(cancellationToken);
        try
        {
            await using var command = db.Database.GetDbConnection().CreateCommand();
            command.CommandText = """
                select observed_at, wse, uncertainty
                from public.dahiti_water_levels
                where dahiti_id = @dahiti_id
                order by observed_at desc
                limit @limit;
                """;
            var idParameter = command.CreateParameter();
            idParameter.ParameterName = "@dahiti_id";
            idParameter.Value = dahitiId;
            command.Parameters.Add(idParameter);
            var limitParameter = command.CreateParameter();
            limitParameter.ParameterName = "@limit";
            limitParameter.Value = Math.Clamp(limit, 1, 5000);
            command.Parameters.Add(limitParameter);

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            var result = new List<AiTelemetryObservation>();
            while (await reader.ReadAsync(cancellationToken))
            {
                result.Add(new AiTelemetryObservation(
                    reader.GetFieldValue<DateTimeOffset>(0),
                    reader.GetDouble(1),
                    reader.IsDBNull(2) ? null : reader.GetDouble(2)));
            }
            result.Reverse();
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
