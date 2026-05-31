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

        public async Task<IEnumerable<TrainerView>> GetAllAsync(string? fullName, string? experienceSort, bool? noExperience, string? workoutName, string? role)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var items = new List<TrainerView>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_all_trainers(@p0, @p1, @p2, @p3, @p4)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = (object)fullName ?? DBNull.Value; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = noExperience ?? false; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = (object)experienceSort ?? DBNull.Value; command.Parameters.Add(p2);
                var p3 = command.CreateParameter(); p3.ParameterName = "@p3"; p3.Value = (object)workoutName ?? DBNull.Value; command.Parameters.Add(p3);
                var p4 = command.CreateParameter(); p4.ParameterName = "@p4"; p4.Value = (object)role ?? DBNull.Value; command.Parameters.Add(p4);

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        items.Add(new TrainerView
                        {
                            TrainerId = reader.GetInt32(0),
                            FullName = reader.GetString(1),
                            Experience = reader.IsDBNull(2) ? null : reader.GetInt32(2),
                            Specializations = reader.IsDBNull(3) ? null : reader.GetString(3)
                        });
                    }
                }
            }
            return items;
        }

        public async Task<Trainer?> GetByIdAsync(int id)
        {
            return await _context.Trainers
                .FromSqlRaw("SELECT * FROM get_trainer_by_id({0})", id)
                .FirstOrDefaultAsync();
        }

        public async Task<(Trainer? Entity, string? Message)> CreateAsync(Trainer trainer)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT add_trainer(@p0, @p1)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = (object)trainer.FullName ?? DBNull.Value; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = (object)trainer.Experience ?? DBNull.Value; command.Parameters.Add(p1);

                var result = await command.ExecuteScalarAsync();
                var msg = result?.ToString();

                if (msg != null && msg.Contains("успешно"))
                {
                    var idStr = msg.Split('(').Last().Replace(")", "").Replace("ID: ", "").Trim();
                    int.TryParse(idStr, out int newId);
                    trainer.TrainerId = newId;
                    return (trainer, msg);
                }
                return (null, msg ?? "Не удалось создать тренера");
            }
        }

        public async Task<(bool Success, string? Message)> UpdateAsync(int id, Trainer trainer)
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
                var msg = result?.ToString();

                if (msg != null && msg.Contains("успешно"))
                    return (true, msg);
                return (false, msg ?? "Не удалось обновить тренера");
            }
        }

        public async Task<(bool Success, string? Message)> DeleteAsync(int id)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT delete_trainer(@p0)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = id; command.Parameters.Add(p0);

                var result = await command.ExecuteScalarAsync();
                var msg = result?.ToString();

                if (msg != null && msg.Contains("успешно"))
                    return (true, msg);
                return (false, msg ?? "Не удалось удалить тренера");
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

                return JsonSerializer.Deserialize<TrainerStatistics>(statsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new TrainerStatistics();
            }
        }

        public async Task<IEnumerable<string>> GetRolesAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var items = new List<string>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_trainer_roles()";
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        items.Add(reader.GetString(0));
                    }
                }
            }
            return items;
        }

        public async Task<IEnumerable<TrainerRoleView>> GetRolesByTrainerAsync(int trainerId)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var items = new List<TrainerRoleView>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_roles_by_trainer(@p0)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = trainerId; command.Parameters.Add(p0);

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        items.Add(new TrainerRoleView
                        {
                            WorkoutId = reader.GetInt32(0),
                            WorkoutName = reader.GetString(1),
                            TRole = reader.GetString(2)
                        });
                    }
                }
            }
            return items;
        }

        public async Task<IEnumerable<WorkoutView>> GetWorkoutsDictionaryAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var items = new List<WorkoutView>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_workouts_for_trainer_dictionary()";
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        items.Add(new WorkoutView
                        {
                            WorkoutId = reader.GetInt32(0),
                            WorkoutName = reader.GetString(1)
                        });
                    }
                }
            }
            return items;
        }

        public async Task<TrainerPageData> GetPageDataAsync(string? fullName, string? experienceSort, bool? noExperience, string? workoutName, string? role)
        {
            var items = await GetAllAsync(fullName, experienceSort, noExperience, workoutName, role);
            var stats = await GetStatisticsAsync();
            var roles = await GetRolesAsync();

            return new TrainerPageData
            {
                Items = items,
                Statistics = stats,
                Roles = roles
            };
        }

        public async Task<TrainerEditData?> GetEditDataAsync(int id)
        {
            var trainer = await GetByIdAsync(id);
            if (trainer == null) return null;

            var roles = await GetRolesByTrainerAsync(id);
            var workouts = await GetWorkoutsDictionaryAsync();

            return new TrainerEditData
            {
                Trainer = trainer,
                Roles = roles,
                Workouts = workouts
            };
        }

        public async Task<TrainerRoleResult> AddTrainerRoleAsync(int trainerId, int workoutId, string role)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT add_trainer_role(@p0, @p1, @p2)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = trainerId; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = workoutId; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = (object)role ?? DBNull.Value; command.Parameters.Add(p2);

                var result = await command.ExecuteScalarAsync();
                if (result != null && result != DBNull.Value)
                {
                    return new TrainerRoleResult { Success = false, Error = result.ToString() };
                }
            }

            var roles = await GetRolesByTrainerAsync(trainerId);
            var items = await GetAllAsync(null, null, null, null, null);
            var stats = await GetStatisticsAsync();
            return new TrainerRoleResult { Success = true, Roles = roles, Items = items, Statistics = stats };
        }

        public async Task<TrainerRoleResult> DeleteTrainerRoleAsync(int trainerId, int workoutId)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT delete_trainer_role(@p0, @p1)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = trainerId; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = workoutId; command.Parameters.Add(p1);

                var result = await command.ExecuteScalarAsync();
                if (result != null && result != DBNull.Value)
                {
                    return new TrainerRoleResult { Success = false, Error = result.ToString() };
                }
            }

            var roles = await GetRolesByTrainerAsync(trainerId);
            var items = await GetAllAsync(null, null, null, null, null);
            var stats = await GetStatisticsAsync();
            return new TrainerRoleResult { Success = true, Roles = roles, Items = items, Statistics = stats };
        }

        public class TrainerView
        {
            public int TrainerId { get; set; }
            public string FullName { get; set; } = null!;
            public int? Experience { get; set; }
            public string? Specializations { get; set; }
        }

        public class TrainerRoleView
        {
            public int WorkoutId { get; set; }
            public string WorkoutName { get; set; } = null!;
            public string TRole { get; set; } = null!;
        }

        public class WorkoutView
        {
            public int WorkoutId { get; set; }
            public string WorkoutName { get; set; } = null!;
        }

        public class TrainerStatistics
        {
            public int TotalTrainers { get; set; }
            public int TrainersWithExperience { get; set; }
            public int TrainersWithoutExperience { get; set; }
        }

        public class TrainerPageData
        {
            public IEnumerable<TrainerView> Items { get; set; } = Enumerable.Empty<TrainerView>();
            public TrainerStatistics Statistics { get; set; } = new();
            public IEnumerable<string> Roles { get; set; } = Enumerable.Empty<string>();
        }

        public class TrainerEditData
        {
            public Trainer Trainer { get; set; } = null!;
            public IEnumerable<TrainerRoleView> Roles { get; set; } = Enumerable.Empty<TrainerRoleView>();
            public IEnumerable<WorkoutView> Workouts { get; set; } = Enumerable.Empty<WorkoutView>();
        }

        public class TrainerRoleResult
        {
            public bool Success { get; set; }
            public string? Error { get; set; }
            public IEnumerable<TrainerRoleView> Roles { get; set; } = Enumerable.Empty<TrainerRoleView>();
            public IEnumerable<TrainerView> Items { get; set; } = Enumerable.Empty<TrainerView>();
            public TrainerStatistics Statistics { get; set; } = new();
        }
    }
}