using Fitness.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Fitness.Services
{
    public class ClientService
    {
        private readonly FitnessContext _context;

        public ClientService(FitnessContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Client>> GetAllAsync(string? fullName, string? phone, DateOnly? birthDateFrom, DateOnly? birthDateTo)
        {
            return await _context.Clients
                .FromSqlRaw("SELECT * FROM get_all_clients({0}, {1}, {2}, {3})",
                    (object)fullName ?? DBNull.Value,
                    (object)phone ?? DBNull.Value,
                    (object)birthDateFrom ?? DBNull.Value,
                    (object)birthDateTo ?? DBNull.Value)
                .ToListAsync();
        }

        public async Task<Client?> GetByIdAsync(int id)
        {
            return await _context.Clients
                .FromSqlRaw("SELECT * FROM get_client_by_id({0})", id)
                .FirstOrDefaultAsync();
        }

        public async Task<(Client? Entity, string? Error)> CreateAsync(Client client)
        {
            if (!string.IsNullOrEmpty(client.Phone) && await _context.Clients.AnyAsync(c => c.Phone == client.Phone))
                return (null, "Клиент с таким номером телефона уже существует");

            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT add_client(@p0, @p1, @p2)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = (object)client.FullName ?? DBNull.Value; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = (object)client.BirthDate ?? DBNull.Value; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = (object)client.Phone ?? DBNull.Value; command.Parameters.Add(p2);

                var result = await command.ExecuteScalarAsync();
                if (result != null && result != DBNull.Value)
                {
                    client.ClientId = Convert.ToInt32(result);
                }
                return (client, null);
            }
        }

        public async Task<(bool Success, string? Error)> UpdateAsync(int id, Client client)
        {
            if (!string.IsNullOrEmpty(client.Phone) && await _context.Clients.AnyAsync(c => c.Phone == client.Phone && c.ClientId != id))
                return (false, "Клиент с таким номером телефона уже существует");

            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT update_client(@p0, @p1, @p2, @p3)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = id; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = (object)client.FullName ?? DBNull.Value; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = (object)client.BirthDate ?? DBNull.Value; command.Parameters.Add(p2);
                var p3 = command.CreateParameter(); p3.ParameterName = "@p3"; p3.Value = (object)client.Phone ?? DBNull.Value; command.Parameters.Add(p3);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value) return (false, null);
                return ((bool)result, null);
            }
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT delete_client(@p0)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = id; command.Parameters.Add(p0);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value) return false;
                return (bool)result;
            }
        }

        public async Task<ClientStatistics> GetStatisticsAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT get_client_statistics()";
                var result = await command.ExecuteScalarAsync();
                var statsJson = result?.ToString();

                if (string.IsNullOrEmpty(statsJson)) return new ClientStatistics();

                return JsonSerializer.Deserialize < ClientStatistics > (statsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new ClientStatistics();
            }
        }

        private bool ClientExists(int id)
        {
            return _context.Clients.Any(e => e.ClientId == id);
        }

        public class ClientStatistics
        {
            public int TotalClients { get; set; }
            public int ActiveAbonnements { get; set; }
        }
    }
}