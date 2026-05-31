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

        public async Task<IEnumerable<WorkoutView>> GetAllAsync(string? workoutName, int? durationFrom, int? durationTo, int? maxParticipantsMin, int? maxParticipantsMax, string? participantsSort)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var workouts = new List<WorkoutView>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_all_workouts(@p0, @p1, @p2, @p3, @p4, @p5)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = (object)workoutName ?? DBNull.Value; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = (object)durationFrom ?? DBNull.Value; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = (object)durationTo ?? DBNull.Value; command.Parameters.Add(p2);
                var p3 = command.CreateParameter(); p3.ParameterName = "@p3"; p3.Value = (object)maxParticipantsMin ?? DBNull.Value; command.Parameters.Add(p3);
                var p4 = command.CreateParameter(); p4.ParameterName = "@p4"; p4.Value = (object)maxParticipantsMax ?? DBNull.Value; command.Parameters.Add(p4);
                var p5 = command.CreateParameter(); p5.ParameterName = "@p5"; p5.Value = (object)participantsSort ?? DBNull.Value; command.Parameters.Add(p5);

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        workouts.Add(new WorkoutView
                        {
                            WorkoutId = reader.GetInt32(0),
                            WorkoutName = reader.GetString(1),
                            DurationMinutes = reader.GetInt32(2),
                            MaxParticipants = reader.GetInt32(3),
                            GymList = reader.IsDBNull(4) ? null : reader.GetString(4)
                        });
                    }
                }
            }
            return workouts;
        }

        public async Task<Workout?> GetByIdAsync(int id)
        {
            return await _context.Workouts
                .FromSqlRaw("SELECT * FROM get_workout_by_id({0})", id)
                .FirstOrDefaultAsync();
        }

        public async Task<(Workout? Entity, string? Error)> CreateAsync(Workout workout)
        {
            if (await _context.Workouts.AnyAsync(w => w.WorkoutName == workout.WorkoutName))
                return (null, "Тренировка с таким названием уже существует");

            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT add_workout(@p0, @p1, @p2)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = (object)workout.WorkoutName ?? DBNull.Value; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = workout.DurationMinutes; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = workout.MaxParticipants; command.Parameters.Add(p2);

                var result = await command.ExecuteScalarAsync();
                var msg = result?.ToString();

                if (msg != null && msg.Contains("успешно"))
                {
                    var idStr = msg.Split('(').Last().Replace(")", "").Replace("ID: ", "").Trim();
                    int.TryParse(idStr, out int newId);
                    workout.WorkoutId = newId;
                    return (workout, msg);
                }
                return (null, msg ?? "Не удалось создать тренировку");
            }
        }

        public async Task<(bool Success, string? Error)> UpdateAsync(int id, Workout workout)
        {
            if (await _context.Workouts.AnyAsync(w => w.WorkoutName == workout.WorkoutName && w.WorkoutId != id))
                return (false, "Тренировка с таким названием уже существует");

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
                var msg = result?.ToString();

                if (msg != null && msg.Contains("успешно"))
                    return (true, msg);
                return (false, msg ?? "Не удалось обновить тренировку");
            }
        }

        public async Task<(bool Success, string? Message)> DeleteAsync(int id)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT delete_workout(@p0)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = id; command.Parameters.Add(p0);

                var result = await command.ExecuteScalarAsync();
                var msg = result?.ToString();

                if (msg != null && msg.Contains("успешно"))
                    return (true, msg);
                return (false, msg ?? "Не удалось удалить тренировку");
            }
        }

        public async Task<IEnumerable<GymLinkView>> GetGymsByWorkoutAsync(int workoutId)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var gyms = new List<GymLinkView>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_gyms_by_workout(@p0)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = workoutId; command.Parameters.Add(p0);

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        gyms.Add(new GymLinkView
                        {
                            GymId = reader.GetInt32(0),
                            GymName = reader.GetString(1)
                        });
                    }
                }
            }
            return gyms;
        }

        public async Task<WorkoutGymResult> AddGymLinkAsync(int gymId, int workoutId)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT add_gym_allowed_workout(@p0, @p1)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = gymId; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = workoutId; command.Parameters.Add(p1);

                var result = await command.ExecuteScalarAsync();
                var msg = result?.ToString();

                if (msg != null && !msg.Contains("успешно"))
                {
                    return new WorkoutGymResult { Success = false, Error = msg };
                }
            }

            var gyms = await GetGymsByWorkoutAsync(workoutId);
            var items = await GetAllAsync(null, null, null, null, null, null);
            var stats = await GetStatisticsAsync();
            return new WorkoutGymResult { Success = true, Gyms = gyms, Items = items, Statistics = stats };
        }

        public async Task<WorkoutGymResult> RemoveGymLinkAsync(int gymId, int workoutId)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT remove_gym_allowed_workout(@p0, @p1)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = gymId; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = workoutId; command.Parameters.Add(p1);

                var result = await command.ExecuteScalarAsync();
                var msg = result?.ToString();

                if (msg == null || !msg.Contains("успешно"))
                {
                    return new WorkoutGymResult { Success = false, Error = msg ?? "Связь не найдена" };
                }
            }

            var gymsList = await GetGymsByWorkoutAsync(workoutId);
            var itemsList = await GetAllAsync(null, null, null, null, null, null);
            var statsResult = await GetStatisticsAsync();
            return new WorkoutGymResult { Success = true, Gyms = gymsList, Items = itemsList, Statistics = statsResult };
        }

        public async Task<IEnumerable<GymLinkView>> GetAllGymsDictionaryAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var gyms = new List<GymLinkView>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_gyms_dictionary()";

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        gyms.Add(new GymLinkView
                        {
                            GymId = reader.GetInt32(0),
                            GymName = reader.GetString(1)
                        });
                    }
                }
            }
            return gyms;
        }

        public async Task<WorkoutEditData?> GetEditDataAsync(int id)
        {
            var workout = await GetByIdAsync(id);
            if (workout == null) return null;

            var gyms = await GetGymsByWorkoutAsync(id);
            var allGyms = await GetAllGymsDictionaryAsync();

            return new WorkoutEditData
            {
                Workout = workout,
                Gyms = gyms,
                AllGyms = allGyms
            };
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

        public class WorkoutStatistics
        {
            public int TotalWorkouts { get; set; }
            public int AvgDuration { get; set; }
            public int MaxDuration { get; set; }
            public int MinDuration { get; set; }
            public int TotalTrainersAssigned { get; set; }
        }

        public class WorkoutView
        {
            public int WorkoutId { get; set; }
            public string WorkoutName { get; set; } = null!;
            public int DurationMinutes { get; set; }
            public int MaxParticipants { get; set; }
            public string? GymList { get; set; }
        }

        public class GymLinkView
        {
            public int GymId { get; set; }
            public string GymName { get; set; } = null!;
        }

        public class WorkoutEditData
        {
            public Workout Workout { get; set; } = null!;
            public IEnumerable<GymLinkView> Gyms { get; set; } = Enumerable.Empty<GymLinkView>();
            public IEnumerable<GymLinkView> AllGyms { get; set; } = Enumerable.Empty<GymLinkView>();
        }

        public class WorkoutGymResult
        {
            public bool Success { get; set; }
            public string? Error { get; set; }
            public IEnumerable<GymLinkView> Gyms { get; set; } = Enumerable.Empty<GymLinkView>();
            public IEnumerable<WorkoutView> Items { get; set; } = Enumerable.Empty<WorkoutView>();
            public WorkoutStatistics Statistics { get; set; } = new();
        }
    }
}
