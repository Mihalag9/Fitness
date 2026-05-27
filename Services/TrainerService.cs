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
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT add_trainer(@p0, @p1)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = (object)trainer.FullName ?? DBNull.Value; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = (object)trainer.Experience ?? DBNull.Value; command.Parameters.Add(p1);

                var result = await command.ExecuteScalarAsync();
                if (result != null && result != DBNull.Value)
                {
                    trainer.TrainerId = Convert.ToInt32(result);
                }
                return trainer;
            }
        }

        public async Task<bool> UpdateAsync(int id, Trainer trainer)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT update_trainer(@p0, @p1, @p2)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = id; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = (object)trainer.FullName ?? DBNull.Value; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = (object)trainer.Experience ?? DBNull.Value; command.Parameters.Add(p2);

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
                command.CommandText = "SELECT delete_trainer(@p0)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = id; command.Parameters.Add(p0);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value) return false;
                return (bool)result;
            }
        }

        public async Task<IEnumerable<TrainerRole>> GetAllRolesAsync()
        {
            return await _context.TrainerRoles
                .FromSqlRaw("SELECT * FROM get_trainer_roles()")
                .ToListAsync();
        }

        public async Task<IEnumerable<TrainerRole>> GetRolesByTrainerAsync(int trainerId)
        {
            return await _context.TrainerRoles
                .FromSqlRaw("SELECT * FROM \"TrainerRole\" WHERE \"TrainerId\" = {0}", trainerId)
                .ToListAsync();
        }

        public async Task<bool> AddRoleAsync(TrainerRole role)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT add_trainer_role(@p0, @p1, @p2)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = role.TrainerId; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = role.WorkoutId; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = (object)role.TRole ?? DBNull.Value; command.Parameters.Add(p2);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value) return false;
                return (bool)result;
            }
        }

        public async Task<bool> UpdateRoleAsync(int trainerId, int workoutId, string role)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT update_trainer_role(@p0, @p1, @p2)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = trainerId; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = workoutId; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = role; command.Parameters.Add(p2);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value) return false;
                return (bool)result;
            }
        }

        public async Task<bool> DeleteRoleAsync(int trainerId, int workoutId)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT delete_trainer_role(@p0, @p1)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = trainerId; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = workoutId; command.Parameters.Add(p1);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value) return false;
                return (bool)result;
            }
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

                return JsonSerializer.Deserialize < TrainerStatistics > (statsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new TrainerStatistics();
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