using Fitness.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Fitness.Services
{
    public class WorkoutService
    {
        private readonly FitnessContext _context;

        public WorkoutService(FitnessContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Workout>> GetAllAsync(string? workoutName, int? durationFrom, int? durationTo, int? maxParticipantsMin, int? maxParticipantsMax, string? participantsSort)
        {
            return await _context.Workouts
                .FromSqlRaw("SELECT * FROM get_all_workouts({0}, {1}, {2}, {3}, {4}, {5})",
                    (object)workoutName ?? DBNull.Value,
                    (object)durationFrom ?? DBNull.Value,
                    (object)durationTo ?? DBNull.Value,
                    (object)maxParticipantsMin ?? DBNull.Value,
                    (object)maxParticipantsMax ?? DBNull.Value,
                    (object)participantsSort ?? DBNull.Value)
                .ToListAsync();
        }

        public async Task<Workout?> GetByIdAsync(int id)
        {
            return await _context.Workouts
                .FromSqlRaw("SELECT * FROM get_workout_by_id({0})", id)
                .FirstOrDefaultAsync();
        }

        public async Task<Workout> CreateAsync(Workout workout)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT add_workout(@p0, @p1, @p2)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = (object)workout.WorkoutName ?? DBNull.Value; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = workout.DurationMinutes; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = workout.MaxParticipants; command.Parameters.Add(p2);

                var result = await command.ExecuteScalarAsync();
                if (result != null && result != DBNull.Value)
                {
                    workout.WorkoutId = Convert.ToInt32(result);
                }
                return workout;
            }
        }

        public async Task<bool> UpdateAsync(int id, Workout workout)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT update_workout(@p0, @p1, @p2, @p3)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = id; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = (object)workout.WorkoutName ?? DBNull.Value; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = workout.DurationMinutes; command.Parameters.Add(p2);
                var p3 = command.CreateParameter(); p3.ParameterName = "@p3"; p3.Value = workout.MaxParticipants; command.Parameters.Add(p3);

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
                command.CommandText = "SELECT delete_workout(@p0)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = id; command.Parameters.Add(p0);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value) return false;
                return (bool)result;
            }
        }

        public async Task<WorkoutStatistics> GetStatisticsAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT get_workout_statistics()";
                var result = await command.ExecuteScalarAsync();
                var statsJson = result?.ToString();

                if (string.IsNullOrEmpty(statsJson)) return new WorkoutStatistics();

                return JsonSerializer.Deserialize<WorkoutStatistics>(statsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new WorkoutStatistics();
            }
        }

        private bool WorkoutExists(int id)
        {
            return _context.Workouts.Any(e => e.WorkoutId == id);
        }

        public class WorkoutStatistics
        {
            public int TotalWorkouts { get; set; }
            public int AvgDuration { get; set; }
            public int MaxDuration { get; set; }
            public int MinDuration { get; set; }
            public int TotalTrainersAssigned { get; set; }
        }
    }
}
