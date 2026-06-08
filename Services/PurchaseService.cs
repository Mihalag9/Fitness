using Fitness.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Text.Json;

namespace Fitness.Services
{
    public class PurchaseService
    {
        private readonly FitnessContext _context;

        public PurchaseService(FitnessContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<PurchaseView>> GetAllAsync(string? clientName, string? abonnementType, string? status, DateOnly? dateFrom, DateOnly? dateTo)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var items = new List<PurchaseView>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_all_purchases(@p0, @p1, @p2, @p3, @p4)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = (object)clientName ?? DBNull.Value; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = (object)abonnementType ?? DBNull.Value; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = (object)status ?? DBNull.Value; command.Parameters.Add(p2);
                var p3 = command.CreateParameter(); p3.ParameterName = "@p3"; p3.Value = (object?)dateFrom ?? DBNull.Value; command.Parameters.Add(p3);
                var p4 = command.CreateParameter(); p4.ParameterName = "@p4"; p4.Value = (object?)dateTo ?? DBNull.Value; command.Parameters.Add(p4);

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        items.Add(new PurchaseView
                        {
                            ClientId = reader.GetInt32(0),
                            ClientName = reader.GetString(1),
                            AbonnementId = reader.GetInt32(2),
                            AbonnementType = reader.GetString(3),
                            DurationMonths = reader.GetInt32(4),
                            PurchaseDate = DateOnly.FromDateTime(reader.GetDateTime(5)),
                            ExpiryDate = DateOnly.FromDateTime(reader.GetDateTime(6)),
                            Status = reader.IsDBNull(7) ? null : reader.GetString(7)
                        });
                    }
                }
            }
            return items;
        }

        public async Task<(bool Success, string? Error)> CreateAsync(int clientId, int abonnementId, DateOnly purchaseDate)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT add_purchase(@p0, @p1, @p2)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = clientId; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = abonnementId; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = purchaseDate; command.Parameters.Add(p2);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value) return (true, null);
                return (false, result.ToString());
            }
        }

        public async Task<(bool Success, string? Error)> UpdateAsync(int clientId, int abonnementId, DateOnly purchaseDate, string newStatus)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT update_purchase(@p0, @p1, @p2, @p3)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = clientId; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = abonnementId; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = purchaseDate; command.Parameters.Add(p2);
                var p3 = command.CreateParameter(); p3.ParameterName = "@p3"; p3.Value = newStatus; command.Parameters.Add(p3);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value) return (true, null);
                return (false, result.ToString());
            }
        }

        public async Task<(bool Success, string? Error)> DeleteAsync(int clientId, int abonnementId, DateOnly purchaseDate)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT delete_purchase(@p0, @p1, @p2)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = clientId; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = abonnementId; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = purchaseDate; command.Parameters.Add(p2);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value) return (true, null);
                return (false, result.ToString());
            }
        }

        public async Task<PurchaseStatistics> GetStatisticsAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT get_purchase_statistics()";
                var result = await command.ExecuteScalarAsync();
                var statsJson = result?.ToString();
                if (string.IsNullOrEmpty(statsJson)) return new PurchaseStatistics();
                return JsonSerializer.Deserialize<PurchaseStatistics>(statsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new PurchaseStatistics();
            }
        }

        public async Task<IEnumerable<ClientView>> GetClientsDictionaryAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var items = new List<ClientView>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_clients_dictionary()";
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

        public async Task<IEnumerable<AbonnementView>> GetAbonnementsDictionaryAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var items = new List<AbonnementView>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_abonnements_dictionary()";
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        items.Add(new AbonnementView
                        {
                            AbonnementId = reader.GetInt32(0),
                            AbonnementType = reader.GetString(1),
                            DurationMonths = reader.GetInt32(2),
                            Price = reader.GetDecimal(3)
                        });
                    }
                }
            }
            return items;
        }

        public async Task<List<MonthlySalesItem>> GetMonthlySalesAsync(int months = 6)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT get_monthly_abonnement_sales(@months)";
                var p = command.CreateParameter();
                p.ParameterName = "@months";
                p.Value = months;
                command.Parameters.Add(p);

                var result = await command.ExecuteScalarAsync();
                var json = result?.ToString();
                if (string.IsNullOrEmpty(json)) return new List<MonthlySalesItem>();

                return JsonSerializer.Deserialize<List<MonthlySalesItem>>(json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                    ?? new List<MonthlySalesItem>();
            }
        }

        public async Task<PurchasePageData> GetPageDataAsync(string? clientName, string? abonnementType, string? status, DateOnly? dateFrom, DateOnly? dateTo)
        {
            var items = await GetAllAsync(clientName, abonnementType, status, dateFrom, dateTo);
            var stats = await GetStatisticsAsync();
            var clients = await GetClientsDictionaryAsync();
            var abonnements = await GetAbonnementsDictionaryAsync();
            var monthlySales = await GetMonthlySalesAsync(6);

            return new PurchasePageData
            {
                Items = items,
                Statistics = stats,
                Clients = clients,
                Abonnements = abonnements,
                MonthlySales = monthlySales
            };
        }

        public class PurchaseView
        {
            public int ClientId { get; set; }
            public string ClientName { get; set; } = null!;
            public int AbonnementId { get; set; }
            public string AbonnementType { get; set; } = null!;
            public int DurationMonths { get; set; }
            public DateOnly PurchaseDate { get; set; }
            public DateOnly ExpiryDate { get; set; }
            public string? Status { get; set; }
        }

        public class PurchaseStatistics
        {
            public int TotalPurchases { get; set; }
            public int ActiveCount { get; set; }
            public int CompletedCount { get; set; }
            public decimal TotalRevenue { get; set; }
        }

        public class ClientView
        {
            public int ClientId { get; set; }
            public string FullName { get; set; } = null!;
        }

        public class AbonnementView
        {
            public int AbonnementId { get; set; }
            public string AbonnementType { get; set; } = null!;
            public int DurationMonths { get; set; }
            public decimal Price { get; set; }
        }

        public class PurchasePageData
        {
            public IEnumerable<PurchaseView> Items { get; set; } = Enumerable.Empty<PurchaseView>();
            public PurchaseStatistics Statistics { get; set; } = new();
            public IEnumerable<ClientView> Clients { get; set; } = Enumerable.Empty<ClientView>();
            public IEnumerable<AbonnementView> Abonnements { get; set; } = Enumerable.Empty<AbonnementView>();
            public List<MonthlySalesItem> MonthlySales { get; set; } = new();
        }
    }
}
