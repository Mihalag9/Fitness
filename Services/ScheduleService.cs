using Fitness.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Fitness.Services
{
    public class ScheduleService
    {
        private readonly FitnessContext _context;

        public ScheduleService(FitnessContext context)
        {
            _context = context;
        }

        public async Task<SchedulePageData> GetPageDataAsync(string? trainerName, string? gymName, string? workoutName, int? workoutTypeId, DateTime? dateFrom, DateTime? dateTo)
        {
            var items = await GetAllAsync(trainerName, gymName, workoutName, workoutTypeId, dateFrom, dateTo);
            var stats = await GetStatisticsAsync();
            var trainers = await GetTrainersDictionaryAsync();
            var workouts = await GetWorkoutsDictionaryAsync();
            var gyms = await GetGymsDictionaryAsync();
            var types = await GetWorkoutTypesDictionaryAsync();

            return new SchedulePageData
            {
                Items = items,
                Statistics = stats,
                Trainers = trainers,
                Workouts = workouts,
                Gyms = gyms,
                WorkoutTypes = types
            };
        }

        public async Task<IEnumerable<ScheduleView>> GetAllAsync(string? trainerName, string? gymName, string? workoutName, int? workoutTypeId, DateTime? dateFrom, DateTime? dateTo)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var schedules = new List<ScheduleView>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_all_schedules(@p0, @p1, @p2, @p3, @p4, @p5)";
                AddNullableParam(command, "@p0", trainerName);
                AddNullableParam(command, "@p1", gymName);
                AddNullableParam(command, "@p2", workoutName);
                AddNullableIntParam(command, "@p3", workoutTypeId);
                AddNullableDateOnlyParam(command, "@p4", dateFrom);
                AddNullableDateOnlyParam(command, "@p5", dateTo);

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        schedules.Add(new ScheduleView
                        {
                            ScheduleId = reader.GetInt32(0),
                            TrainerId = reader.IsDBNull(1) ? null : reader.GetInt32(1),
                            TrainerName = reader.IsDBNull(2) ? null : reader.GetString(2),
                            WorkoutId = reader.GetInt32(3),
                            WorkoutName = reader.GetString(4),
                            DurationMinutes = reader.GetInt32(5),
                            GymId = reader.GetInt32(6),
                            GymName = reader.GetString(7),
                            WorkoutTypeId = reader.GetInt32(8),
                            WorkoutTypeName = reader.GetString(9),
                            WorkDate = reader.GetDateTime(10),
                            StartTime = reader.GetFieldValue<TimeOnly>(11).ToString("HH:mm"),
                            EndTime = reader.GetFieldValue<TimeOnly>(12).ToString("HH:mm")
                        });
                    }
                }
            }
            return schedules;
        }

        public async Task<ScheduleView?> GetByIdAsync(int id)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_schedule_by_id(@p0)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = id; command.Parameters.Add(p0);

                using (var reader = await command.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                    {
                        return new ScheduleView
                        {
                            ScheduleId = reader.GetInt32(0),
                            TrainerId = reader.IsDBNull(1) ? null : reader.GetInt32(1),
                            TrainerName = reader.IsDBNull(2) ? null : reader.GetString(2),
                            WorkoutId = reader.GetInt32(3),
                            WorkoutName = reader.GetString(4),
                            DurationMinutes = reader.GetInt32(5),
                            GymId = reader.GetInt32(6),
                            GymName = reader.GetString(7),
                            WorkoutTypeId = reader.GetInt32(8),
                            WorkoutTypeName = reader.GetString(9),
                            WorkDate = reader.GetDateTime(10),
                            StartTime = reader.GetFieldValue<TimeOnly>(11).ToString("HH:mm"),
                            EndTime = reader.GetFieldValue<TimeOnly>(12).ToString("HH:mm")
                        };
                    }
                }
            }
            return null;
        }

        public async Task<(Schedule? Entity, string? Message)> CreateAsync(ScheduleDto dto)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT add_schedule(@p0, @p1, @p2, @p3, @p4, @p5)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = (object)dto.TrainerId ?? DBNull.Value; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = dto.WorkoutId; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = dto.GymId; command.Parameters.Add(p2);
                var p3 = command.CreateParameter(); p3.ParameterName = "@p3"; p3.Value = dto.WorkoutTypeId; command.Parameters.Add(p3);
                var p4 = command.CreateParameter(); p4.ParameterName = "@p4"; p4.Value = DateOnly.FromDateTime(dto.WorkDate); command.Parameters.Add(p4);
                var p5 = command.CreateParameter(); p5.ParameterName = "@p5"; p5.Value = TimeOnly.Parse(dto.StartTime); command.Parameters.Add(p5);

                var result = await command.ExecuteScalarAsync();
                var msg = result?.ToString();

                if (msg != null && msg.Contains("успешно"))
                {
                    var idStr = msg.Split('(').Last().Replace(")", "").Replace("ID: ", "").Trim();
                    int.TryParse(idStr, out int newId);
                    var schedule = new Schedule
                    {
                        ScheduleId = newId,
                        TrainerId = dto.TrainerId,
                        WorkoutId = dto.WorkoutId,
                        GymId = dto.GymId,
                        WorkoutTypeId = dto.WorkoutTypeId,
                        WorkDate = DateOnly.FromDateTime(dto.WorkDate),
                        StartTime = TimeOnly.Parse(dto.StartTime)
                    };
                    return (schedule, msg);
                }
                return (null, msg ?? "Не удалось создать запись");
            }
        }

        public async Task<(bool Success, string? Message)> UpdateAsync(int id, ScheduleDto dto)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT update_schedule(@p0, @p1, @p2, @p3, @p4, @p5, @p6)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = id; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = (object)dto.TrainerId ?? DBNull.Value; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = dto.WorkoutId; command.Parameters.Add(p2);
                var p3 = command.CreateParameter(); p3.ParameterName = "@p3"; p3.Value = dto.GymId; command.Parameters.Add(p3);
                var p4 = command.CreateParameter(); p4.ParameterName = "@p4"; p4.Value = dto.WorkoutTypeId; command.Parameters.Add(p4);
                var p5 = command.CreateParameter(); p5.ParameterName = "@p5"; p5.Value = DateOnly.FromDateTime(dto.WorkDate); command.Parameters.Add(p5);
                var p6 = command.CreateParameter(); p6.ParameterName = "@p6"; p6.Value = TimeOnly.Parse(dto.StartTime); command.Parameters.Add(p6);

                var result = await command.ExecuteScalarAsync();
                var msg = result?.ToString();

                if (msg != null && msg.Contains("успешно"))
                    return (true, msg);
                return (false, msg ?? "Не удалось обновить запись");
            }
        }

        public async Task<(bool Success, string? Message)> DeleteAsync(int id)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT delete_schedule(@p0)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = id; command.Parameters.Add(p0);

                var result = await command.ExecuteScalarAsync();
                var msg = result?.ToString();

                if (msg != null && msg.Contains("успешно"))
                    return (true, msg);
                return (false, msg ?? "Не удалось удалить запись");
            }
        }

        public async Task<ScheduleStatistics> GetStatisticsAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT get_schedule_statistics()";
                var result = await command.ExecuteScalarAsync();
                var statsJson = result?.ToString();

                if (string.IsNullOrEmpty(statsJson)) return new ScheduleStatistics();

                return JsonSerializer.Deserialize<ScheduleStatistics>(statsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new ScheduleStatistics();
            }
        }

        public async Task<IEnumerable<TrainerDict>> GetTrainersDictionaryAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var list = new List<TrainerDict>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_trainers_dictionary_for_schedule()";
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        list.Add(new TrainerDict
                        {
                            TrainerId = reader.GetInt32(0),
                            FullName = reader.GetString(1)
                        });
                    }
                }
            }
            return list;
        }

        public async Task<IEnumerable<WorkoutDict>> GetWorkoutsDictionaryAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var list = new List<WorkoutDict>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_workouts_dictionary_for_schedule()";
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        list.Add(new WorkoutDict
                        {
                            WorkoutId = reader.GetInt32(0),
                            WorkoutName = reader.GetString(1),
                            DurationMinutes = reader.GetInt32(2)
                        });
                    }
                }
            }
            return list;
        }

        public async Task<IEnumerable<GymDict>> GetGymsDictionaryAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var list = new List<GymDict>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_gyms_dictionary_for_schedule()";
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        list.Add(new GymDict
                        {
                            GymId = reader.GetInt32(0),
                            GymName = reader.GetString(1)
                        });
                    }
                }
            }
            return list;
        }

        public async Task<IEnumerable<WorkoutTypeDict>> GetWorkoutTypesDictionaryAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var list = new List<WorkoutTypeDict>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_workout_types_dictionary()";
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        list.Add(new WorkoutTypeDict
                        {
                            WorkoutTypeId = reader.GetInt32(0),
                            TypeName = reader.GetString(1)
                        });
                    }
                }
            }
            return list;
        }

        private static void AddNullableParam(System.Data.Common.DbCommand command, string name, string? value)
        {
            var p = command.CreateParameter();
            p.ParameterName = name;
            p.Value = (object)value ?? DBNull.Value;
            command.Parameters.Add(p);
        }

        private static void AddNullableDateParam(System.Data.Common.DbCommand command, string name, DateTime? value)
        {
            var p = command.CreateParameter();
            p.ParameterName = name;
            p.Value = (object)value ?? DBNull.Value;
            command.Parameters.Add(p);
        }

        private static void AddNullableDateOnlyParam(System.Data.Common.DbCommand command, string name, DateTime? value)
        {
            var p = command.CreateParameter();
            p.ParameterName = name;
            p.Value = value.HasValue ? (object)DateOnly.FromDateTime(value.Value) : DBNull.Value;
            command.Parameters.Add(p);
        }

        private static void AddNullableIntParam(System.Data.Common.DbCommand command, string name, int? value)
        {
            var p = command.CreateParameter();
            p.ParameterName = name;
            p.Value = (object)value ?? DBNull.Value;
            command.Parameters.Add(p);
        }

        public class SchedulePageData
        {
            public IEnumerable<ScheduleView> Items { get; set; } = Enumerable.Empty<ScheduleView>();
            public ScheduleStatistics Statistics { get; set; } = new();
            public IEnumerable<TrainerDict> Trainers { get; set; } = Enumerable.Empty<TrainerDict>();
            public IEnumerable<WorkoutDict> Workouts { get; set; } = Enumerable.Empty<WorkoutDict>();
            public IEnumerable<GymDict> Gyms { get; set; } = Enumerable.Empty<GymDict>();
            public IEnumerable<WorkoutTypeDict> WorkoutTypes { get; set; } = Enumerable.Empty<WorkoutTypeDict>();
        }

        public class ScheduleView
        {
            public int ScheduleId { get; set; }
            public int? TrainerId { get; set; }
            public string? TrainerName { get; set; }
            public int WorkoutId { get; set; }
            public string WorkoutName { get; set; } = null!;
            public int DurationMinutes { get; set; }
            public int GymId { get; set; }
            public string GymName { get; set; } = null!;
            public int WorkoutTypeId { get; set; }
            public string WorkoutTypeName { get; set; } = null!;
            public DateTime WorkDate { get; set; }
            public string StartTime { get; set; } = null!;
            public string EndTime { get; set; } = null!;
        }

        public class ScheduleStatistics
        {
            public int TotalSchedules { get; set; }
            public int GroupWorkouts { get; set; }
            public int IndividualWorkouts { get; set; }
            public int TrainersCount { get; set; }
        }

        public class TrainerDict
        {
            public int TrainerId { get; set; }
            public string FullName { get; set; } = null!;
        }

        public class WorkoutDict
        {
            public int WorkoutId { get; set; }
            public string WorkoutName { get; set; } = null!;
            public int DurationMinutes { get; set; }
        }

        public class GymDict
        {
            public int GymId { get; set; }
            public string GymName { get; set; } = null!;
        }

        public class WorkoutTypeDict
        {
            public int WorkoutTypeId { get; set; }
            public string TypeName { get; set; } = null!;
        }
    }

    public class ScheduleDto
    {
        public int? TrainerId { get; set; }
        public int WorkoutId { get; set; }
        public int GymId { get; set; }
        public int WorkoutTypeId { get; set; }
        public DateTime WorkDate { get; set; }
        public string StartTime { get; set; } = null!;
    }
}
