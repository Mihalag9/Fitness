using Fitness.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Fitness.Services
{
    public class ReviewService
    {
        private readonly FitnessContext _context;

        public ReviewService(FitnessContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ReviewView>> GetAllAsync(string? clientName, string? trainerName, DateOnly? dateFrom, DateOnly? dateTo, string? ratingSort)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var items = new List<ReviewView>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_all_reviews(@p0, @p1, @p2, @p3, @p4)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = (object)clientName ?? DBNull.Value; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = (object)trainerName ?? DBNull.Value; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = (object?)dateFrom ?? DBNull.Value; command.Parameters.Add(p2);
                var p3 = command.CreateParameter(); p3.ParameterName = "@p3"; p3.Value = (object?)dateTo ?? DBNull.Value; command.Parameters.Add(p3);
                var p4 = command.CreateParameter(); p4.ParameterName = "@p4"; p4.Value = (object)ratingSort ?? DBNull.Value; command.Parameters.Add(p4);

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        items.Add(new ReviewView
                        {
                            ClientId = reader.GetInt32(0),
                            ClientName = reader.GetString(1),
                            TrainerId = reader.GetInt32(2),
                            TrainerName = reader.GetString(3),
                            CreatedAt = reader.GetDateTime(4),
                            ReviewText = reader.IsDBNull(5) ? null : reader.GetString(5),
                            Rating = reader.IsDBNull(6) ? null : reader.GetInt32(6)
                        });
                    }
                }
            }
            return items;
        }

        public async Task<(bool Success, string? Error)> CreateAsync(int clientId, int trainerId, string? reviewText, int rating)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT add_review(@p0, @p1, @p2, @p3)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = clientId; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = trainerId; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = (object)reviewText ?? DBNull.Value; command.Parameters.Add(p2);
                var p3 = command.CreateParameter(); p3.ParameterName = "@p3"; p3.Value = rating; command.Parameters.Add(p3);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value) return (true, null);
                return (false, result.ToString());
            }
        }

        public async Task<(bool Success, string? Error)> UpdateAsync(int clientId, int trainerId, string? reviewText, int rating)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT update_review(@p0, @p1, @p2, @p3)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = clientId; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = trainerId; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = (object)reviewText ?? DBNull.Value; command.Parameters.Add(p2);
                var p3 = command.CreateParameter(); p3.ParameterName = "@p3"; p3.Value = rating; command.Parameters.Add(p3);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value) return (true, null);
                return (false, result.ToString());
            }
        }

        public async Task<(bool Success, string? Error)> DeleteAsync(int clientId, int trainerId)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT delete_review(@p0, @p1)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = clientId; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = trainerId; command.Parameters.Add(p1);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value) return (true, null);
                return (false, result.ToString());
            }
        }

        public async Task<ReviewStatistics> GetStatisticsAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT get_review_statistics()";
                var result = await command.ExecuteScalarAsync();
                var statsJson = result?.ToString();
                if (string.IsNullOrEmpty(statsJson)) return new ReviewStatistics();
                return JsonSerializer.Deserialize<ReviewStatistics>(statsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new ReviewStatistics();
            }
        }

        public async Task<IEnumerable<ClientView>> GetClientsDictionaryAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var items = new List<ClientView>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_clients_for_reviews_dictionary()";
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        items.Add(new ClientView
                        {
                            ClientId = reader.GetInt32(0),
                            FullName = reader.GetString(1)
                        });
                    }
                }
            }
            return items;
        }

        public async Task<IEnumerable<TrainerView>> GetTrainersDictionaryAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var items = new List<TrainerView>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_trainers_for_reviews_dictionary()";
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        items.Add(new TrainerView
                        {
                            TrainerId = reader.GetInt32(0),
                            FullName = reader.GetString(1)
                        });
                    }
                }
            }
            return items;
        }

        public class ReviewView
        {
            public int ClientId { get; set; }
            public string ClientName { get; set; } = null!;
            public int TrainerId { get; set; }
            public string TrainerName { get; set; } = null!;
            public DateTime CreatedAt { get; set; }
            public string? ReviewText { get; set; }
            public int? Rating { get; set; }
        }

        public class ReviewStatistics
        {
            public int TotalReviews { get; set; }
            public string? BestTrainerName { get; set; }
            public double? BestTrainerAvg { get; set; }
        }

        public class ClientView
        {
            public int ClientId { get; set; }
            public string FullName { get; set; } = null!;
        }

        public class TrainerView
        {
            public int TrainerId { get; set; }
            public string FullName { get; set; } = null!;
        }
    }
}
