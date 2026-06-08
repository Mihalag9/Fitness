using Fitness.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Fitness.Services
{
    public class BookingService
    {
        private readonly FitnessContext _context;

        public BookingService(FitnessContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<BookingView>> GetBookingsByScheduleAsync(int scheduleId, string? clientName, bool? attended)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var bookings = new List<BookingView>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_bookings_by_schedule(@p0, @p1, @p2)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = scheduleId; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = (object)clientName ?? DBNull.Value; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = attended.HasValue ? (object)attended.Value : DBNull.Value; command.Parameters.Add(p2);

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        bookings.Add(new BookingView
                        {
                            ClientId = reader.GetInt32(0),
                            ClientName = reader.GetString(1),
                            BookedAt = reader.GetDateTime(2),
                            Attended = reader.IsDBNull(3) ? null : reader.GetBoolean(3)
                        });
                    }
                }
            }
            return bookings;
        }

        public async Task<(bool Success, string? Message)> CreateAsync(int clientId, int scheduleId)
        {
            if (clientId <= 0) return (false, "Не указан клиент");

            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT add_booking(@p0, @p1)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = clientId; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = scheduleId; command.Parameters.Add(p1);

                var result = await command.ExecuteScalarAsync();
                var msg = result?.ToString();

                if (msg != null && msg.Contains("успешно"))
                    return (true, msg);
                return (false, msg ?? "Не удалось записать клиента");
            }
        }

        public async Task<(bool Success, string? Message)> DeleteAsync(int clientId, int scheduleId)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT delete_booking(@p0, @p1)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = clientId; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = scheduleId; command.Parameters.Add(p1);

                var result = await command.ExecuteScalarAsync();
                var msg = result?.ToString();

                if (msg != null && msg.Contains("успешно"))
                    return (true, msg);
                return (false, msg ?? "Не удалось удалить запись");
            }
        }

        public async Task<(bool Success, string? Message)> ToggleAttendedAsync(int clientId, int scheduleId)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT toggle_attended(@p0, @p1)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = clientId; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = scheduleId; command.Parameters.Add(p1);

                var result = await command.ExecuteScalarAsync();
                var msg = result?.ToString();

                if (msg != null && !msg.Contains("не найдена"))
                    return (true, msg);
                return (false, msg ?? "Не удалось изменить статус");
            }
        }

        public async Task<IEnumerable<ClientDict>> GetClientsDictionaryAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var list = new List<ClientDict>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_clients_dictionary_for_booking()";
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        list.Add(new ClientDict
                        {
                            ClientId = reader.GetInt32(0),
                            FullName = reader.GetString(1),
                            AbonnementType = reader.IsDBNull(2) ? null : reader.GetString(2),
                            ExpiryDate = reader.IsDBNull(3) ? null : DateOnly.FromDateTime(reader.GetDateTime(3)),
                            AccessStartTime = reader.IsDBNull(4) ? null : ReadTimeOnly(reader.GetValue(4)),
                            AccessEndTime = reader.IsDBNull(5) ? null : ReadTimeOnly(reader.GetValue(5)),
                            WeekdayAccess = reader.IsDBNull(6) ? null : reader.GetBoolean(6),
                            WeekendAccess = reader.IsDBNull(7) ? null : reader.GetBoolean(7)
                        });
                    }
                }
            }
            return list;
        }

        public async Task<BookingStats> GetBookingStatsAsync(int scheduleId)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT get_booking_stats(@p0)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = scheduleId; command.Parameters.Add(p0);

                var result = await command.ExecuteScalarAsync();
                var statsJson = result?.ToString();

                if (string.IsNullOrEmpty(statsJson)) return new BookingStats();

                return JsonSerializer.Deserialize<BookingStats>(statsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new BookingStats();
            }
        }

        public class BookingView
        {
            public int ClientId { get; set; }
            public string ClientName { get; set; } = null!;
            public DateTime BookedAt { get; set; }
            public bool? Attended { get; set; }
        }

        public class ClientDict
        {
            public int ClientId { get; set; }
            public string FullName { get; set; } = null!;
            public string? AbonnementType { get; set; }
            public DateOnly? ExpiryDate { get; set; }
            public TimeOnly? AccessStartTime { get; set; }
            public TimeOnly? AccessEndTime { get; set; }
            public bool? WeekdayAccess { get; set; }
            public bool? WeekendAccess { get; set; }
        }

        public class BookingStats
        {
            public int BookedCount { get; set; }
            public int MaxParticipants { get; set; }
        }

        private static TimeOnly ReadTimeOnly(object value)
        {
            if (value is TimeOnly to) return to;
            if (value is TimeSpan ts) return TimeOnly.FromTimeSpan(ts);
            return TimeOnly.Parse(value?.ToString() ?? "00:00");
        }
    }
}
