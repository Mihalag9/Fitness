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
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT add_abonnement(@p0, @p1, @p2, @p3, @p4, @p5, @p6)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = (object)abonnement.AbonnementType ?? DBNull.Value; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = abonnement.Price; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = abonnement.DurationMonths; command.Parameters.Add(p2);
                var p3 = command.CreateParameter(); p3.ParameterName = "@p3"; p3.Value = abonnement.WeekdayAccess; command.Parameters.Add(p3);
                var p4 = command.CreateParameter(); p4.ParameterName = "@p4"; p4.Value = abonnement.WeekendAccess; command.Parameters.Add(p4);
                var p5 = command.CreateParameter(); p5.ParameterName = "@p5"; p5.Value = abonnement.AccessStartTime; command.Parameters.Add(p5);
                var p6 = command.CreateParameter(); p6.ParameterName = "@p6"; p6.Value = abonnement.AccessEndTime; command.Parameters.Add(p6);

                var result = await command.ExecuteScalarAsync();
                if (result != null && result != DBNull.Value)
                {
                    abonnement.AbonnementId = Convert.ToInt32(result);
                }
                return abonnement;
            }
        }

        public async Task<bool> UpdateAsync(int id, Abonnement abonnement)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT update_abonnement(@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = id; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = (object)abonnement.AbonnementType ?? DBNull.Value; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = abonnement.Price; command.Parameters.Add(p2);
                var p3 = command.CreateParameter(); p3.ParameterName = "@p3"; p3.Value = abonnement.DurationMonths; command.Parameters.Add(p3);
                var p4 = command.CreateParameter(); p4.ParameterName = "@p4"; p4.Value = abonnement.WeekdayAccess; command.Parameters.Add(p4);
                var p5 = command.CreateParameter(); p5.ParameterName = "@p5"; p5.Value = abonnement.WeekendAccess; command.Parameters.Add(p5);
                var p6 = command.CreateParameter(); p6.ParameterName = "@p6"; p6.Value = abonnement.AccessStartTime; command.Parameters.Add(p6);
                var p7 = command.CreateParameter(); p7.ParameterName = "@p7"; p7.Value = abonnement.AccessEndTime; command.Parameters.Add(p7);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value) return false;
                return (bool)result;
            }
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT delete_abonnement(@p0)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = id; command.Parameters.Add(p0);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value) return false;
                return (bool)result;
            }
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

                return JsonSerializer.Deserialize < AbonnementStatistics > (statsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new AbonnementStatistics();
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