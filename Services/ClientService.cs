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

        public async Task<Client> CreateAsync(Client client)
        {
            await _context.Database.ExecuteSqlRawAsync("SELECT add_client({0}, {1}, {2})", 
                (object)client.FullName ?? DBNull.Value, 
                (object)client.BirthDate ?? DBNull.Value,
                (object)client.Phone ?? DBNull.Value);
            return client;
        }

        public async Task<bool> UpdateAsync(int id, Client client)
        {
            var result = await _context.Database.ExecuteSqlRawAsync("SELECT update_client({0}, {1}, {2}, {3})", 
                id,
                (object)client.FullName ?? DBNull.Value, 
                (object)client.BirthDate ?? DBNull.Value,
                (object)client.Phone ?? DBNull.Value);
            
            return result > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var result = await _context.Database.ExecuteSqlRawAsync("SELECT delete_client({0})", id);
            return result > 0;
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

                return JsonSerializer.Deserialize<ClientStatistics>(statsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new ClientStatistics();
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
