using Fitness.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Fitness.Services
{
    public class AbonnementService
    {
        private readonly FitnessContext _context;

        public AbonnementService(FitnessContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Abonnement>> GetAllAsync(
            string? abonnementType,
            bool? weekdayAccess,
            bool? weekendAccess,
            decimal? priceMin,
            decimal? priceMax)
        {
            return await _context.Abonnements
                .FromSqlRaw("SELECT * FROM get_all_abonnements({0}, {1}, {2}, {3}, {4})", 
                    (object)abonnementType ?? DBNull.Value,
                    (object)weekdayAccess ?? DBNull.Value,
                    (object)weekendAccess ?? DBNull.Value,
                    (object)priceMin ?? DBNull.Value,
                    (object)priceMax ?? DBNull.Value)
                .ToListAsync();
        }

        public async Task<Abonnement?> GetByIdAsync(int id)
        {
            return await _context.Abonnements
                .FromSqlRaw("SELECT * FROM get_abonnement_by_id({0})", id)
                .FirstOrDefaultAsync();
        }

        public async Task<Abonnement> CreateAsync(Abonnement abonnement)
        {
            await _context.Database.ExecuteSqlRawAsync("SELECT add_abonnement({0}, {1}, {2}, {3}, {4}, {5}, {6})", 
                (object)abonnement.AbonnementType ?? DBNull.Value,
                abonnement.Price,
                abonnement.DurationMonths,
                abonnement.WeekdayAccess,
                abonnement.WeekendAccess,
                abonnement.AccessStartTime,
                abonnement.AccessEndTime);
            return abonnement;
        }

        public async Task<bool> UpdateAsync(int id, Abonnement abonnement)
        {
            var result = await _context.Database.ExecuteSqlRawAsync("SELECT update_abonnement({0}, {1}, {2}, {3}, {4}, {5}, {6}, {7})", 
                id,
                (object)abonnement.AbonnementType ?? DBNull.Value,
                abonnement.Price,
                abonnement.DurationMonths,
                abonnement.WeekdayAccess,
                abonnement.WeekendAccess,
                abonnement.AccessStartTime,
                abonnement.AccessEndTime);
            
            return result > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var result = await _context.Database.ExecuteSqlRawAsync("SELECT delete_abonnement({0})", id);
            return result > 0;
        }

        public async Task<AbonnementStatistics> GetStatisticsAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT get_abonnement_statistics()";
                var result = await command.ExecuteScalarAsync();
                var statsJson = result?.ToString();

                if (string.IsNullOrEmpty(statsJson)) return new AbonnementStatistics();

                return JsonSerializer.Deserialize<AbonnementStatistics>(statsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new AbonnementStatistics();
            }
        }

        private bool AbonnementExists(int id)
        {
            return _context.Abonnements.Any(e => e.AbonnementId == id);
        }

        public class AbonnementStatistics
        {
            public int TotalAbonnements { get; set; }
            public decimal MinPrice { get; set; }
            public decimal MaxPrice { get; set; }
            public double UnlimitedPercentage { get; set; }
        }
    }
}