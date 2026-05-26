using Fitness.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Fitness.Services
{
    public class TrainerService
    {
        private readonly FitnessContext _context;

        public TrainerService(FitnessContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Trainer>> GetAllAsync(string? fullName, string? experienceSort, bool? noExperience)
        {
            return await _context.Trainers
                .FromSqlRaw("SELECT * FROM get_all_trainers({0}, {1}, {2})", 
                    (object)fullName ?? DBNull.Value, 
                    noExperience ?? false,
                    (object)experienceSort ?? DBNull.Value)
                .ToListAsync();
        }

        public async Task<Trainer?> GetByIdAsync(int id)
        {
            return await _context.Trainers
                .FromSqlRaw("SELECT * FROM get_trainer_by_id({0})", id)
                .FirstOrDefaultAsync();
        }

        public async Task<Trainer> CreateAsync(Trainer trainer)
        {
            await _context.Database.ExecuteSqlRawAsync("SELECT add_trainer({0}, {1})", 
                (object)trainer.FullName ?? DBNull.Value, 
                (object)trainer.Experience ?? DBNull.Value);
            return trainer;
        }

        public async Task<bool> UpdateAsync(int id, Trainer trainer)
        {
            var result = await _context.Database.ExecuteSqlRawAsync("SELECT update_trainer({0}, {1}, {2})", 
                id,
                (object)trainer.FullName ?? DBNull.Value, 
                (object)trainer.Experience ?? DBNull.Value);
            
            return result > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var result = await _context.Database.ExecuteSqlRawAsync("SELECT delete_trainer({0})", id);
            return result > 0;
        }

        public async Task<TrainerStatistics> GetStatisticsAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT get_trainer_statistics()";
                var result = await command.ExecuteScalarAsync();
                var statsJson = result?.ToString();

                if (string.IsNullOrEmpty(statsJson)) return new TrainerStatistics();

                return JsonSerializer.Deserialize<TrainerStatistics>(statsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new TrainerStatistics();
            }
        }

        private bool TrainerExists(int id)
        {
            return _context.Trainers.Any(e => e.TrainerId == id);
        }

        public class TrainerStatistics
        {
            public int TotalTrainers { get; set; }
            public int TrainersWithExperience { get; set; }
            public int TrainersWithoutExperience { get; set; }
        }
    }
}