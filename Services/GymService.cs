using Fitness.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Fitness.Services
{
    public class GymService
    {
        private readonly FitnessContext _context;

        public GymService(FitnessContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<GymView>> GetAllAsync(string? gymName, bool? hasEquipment, string? equipmentName, string? brand)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var gyms = new List<GymView>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_all_gyms(@p0, @p1, @p2, @p3)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = (object)gymName ?? DBNull.Value; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = (object)hasEquipment ?? DBNull.Value; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = (object)equipmentName ?? DBNull.Value; command.Parameters.Add(p2);
                var p3 = command.CreateParameter(); p3.ParameterName = "@p3"; p3.Value = (object)brand ?? DBNull.Value; command.Parameters.Add(p3);

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        gyms.Add(new GymView
                        {
                            GymId = reader.GetInt32(0),
                            GymName = reader.GetString(1),
                            EquipmentList = reader.IsDBNull(2) ? null : reader.GetString(2)
                        });
                    }
                }
            }
            return gyms;
        }

        public async Task<Gym?> GetByIdAsync(int id)
        {
            return await _context.Gyms
                .FromSqlRaw("SELECT * FROM get_gym_by_id({0})", id)
                .FirstOrDefaultAsync();
        }

        public async Task<(Gym? Entity, string? Error)> CreateAsync(Gym gym)
        {
            if (await _context.Gyms.AnyAsync(g => g.GymName == gym.GymName))
                return (null, "Зал с таким названием уже существует");

            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT add_gym(@p0)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = (object)gym.GymName ?? DBNull.Value; command.Parameters.Add(p0);

                var result = await command.ExecuteScalarAsync();
                if (result != null && result != DBNull.Value)
                {
                    gym.GymId = Convert.ToInt32(result);
                }
                return (gym, null);
            }
        }

        public async Task<(bool Success, string? Error)> UpdateAsync(int id, Gym gym)
        {
            if (await _context.Gyms.AnyAsync(g => g.GymName == gym.GymName && g.GymId != id))
                return (false, "Зал с таким названием уже существует");

            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT update_gym(@p0, @p1)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = id; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = (object)gym.GymName ?? DBNull.Value; command.Parameters.Add(p1);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value) return (false, null);
                return ((bool)result, null);
            }
        }

        public async Task<(bool Success, string? Message)> DeleteAsync(int id)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT delete_gym(@p0)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = id; command.Parameters.Add(p0);

                var result = await command.ExecuteScalarAsync();
                var msg = result?.ToString();

                if (msg != null && msg.Contains("успешно"))
                    return (true, msg);
                return (false, msg ?? "Не удалось удалить зал");
            }
        }

        public async Task<IEnumerable<InventoryItemView>> GetInventoryByGymAsync(int gymId)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var items = new List< InventoryItemView > ();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_inventory_by_gym(@p0)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = gymId; command.Parameters.Add(p0);

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        items.Add(new InventoryItemView
                        {
                            EquipmentId = reader.GetInt32(0),
                            EquipmentName = reader.GetString(1),
                            Brand = reader.IsDBNull(2) ? null : reader.GetString(2),
                            Model = reader.IsDBNull(3) ? null : reader.GetString(3),
                            Quantity = reader.GetInt32(4)
                        });
                    }
                }
            }
            return items;
        }

        public async Task<GymInventoryResult> UpsertInventoryAsync(int gymId, int equipmentId, int quantity)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT upsert_inventory(@p0, @p1, @p2)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = gymId; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = equipmentId; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = quantity; command.Parameters.Add(p2);

                var result = await command.ExecuteScalarAsync();
                var msg = result?.ToString();

                if (msg != null && !msg.Contains("успешно"))
                {
                    return new GymInventoryResult { Success = false, Error = msg };
                }
            }

            var inventory = await GetInventoryByGymAsync(gymId);
            var items = await GetAllAsync(null, null, null, null);
            var stats = await GetStatisticsAsync();
            return new GymInventoryResult { Success = true, Inventory = inventory, Items = items, Statistics = stats };
        }

        public async Task<GymInventoryResult> DeleteInventoryItemAsync(int gymId, int equipmentId)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT delete_inventory_item(@p0, @p1)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = gymId; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = equipmentId; command.Parameters.Add(p1);

                var result = await command.ExecuteScalarAsync();
                var msg = result?.ToString();

                if (msg == null || !msg.Contains("успешно"))
                {
                    return new GymInventoryResult { Success = false, Error = msg ?? "Оборудование не найдено в зале" };
                }
            }

            var inventory = await GetInventoryByGymAsync(gymId);
            var items = await GetAllAsync(null, null, null, null);
            var stats = await GetStatisticsAsync();
            return new GymInventoryResult { Success = true, Inventory = inventory, Items = items, Statistics = stats };
        }

        public async Task<IEnumerable<EquipmentView>> GetAllEquipmentAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var items = new List< EquipmentView > ();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_equipment_dictionary()";
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        items.Add(new EquipmentView
                        {
                            EquipmentId = reader.GetInt32(0),
                            EquipmentName = reader.GetString(1),
                            Brand = reader.IsDBNull(2) ? null : reader.GetString(2),
                            Model = reader.IsDBNull(3) ? null : reader.GetString(3)
                        });
                    }
                }
            }
            return items;
        }

        public async Task<IEnumerable<string>> GetBrandsAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var brands = new List<string>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_equipment_brands()";
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        brands.Add(reader.GetString(0));
                    }
                }
            }
            return brands;
        }

        public async Task<GymEditData?> GetEditDataAsync(int id)
        {
            var gym = await GetByIdAsync(id);
            if (gym == null) return null;

            var inventory = await GetInventoryByGymAsync(id);
            var equipment = await GetAllEquipmentAsync();

            return new GymEditData
            {
                Gym = gym,
                Inventory = inventory,
                Equipment = equipment
            };
        }

        public async Task<GymStatistics> GetStatisticsAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT get_gym_statistics()";
                var result = await command.ExecuteScalarAsync();
                var statsJson = result?.ToString();

                if (string.IsNullOrEmpty(statsJson)) return new GymStatistics();

                return JsonSerializer.Deserialize<GymStatistics>(statsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new GymStatistics();
            }
        }

        public class GymView
        {
            public int GymId { get; set; }
            public string GymName { get; set; } = null!;
            public string? EquipmentList { get; set; }
        }

        public class InventoryItemView
        {
            public int EquipmentId { get; set; }
            public string EquipmentName { get; set; } = null!;
            public string? Brand { get; set; }
            public string? Model { get; set; }
            public int Quantity { get; set; }
        }

        public class EquipmentView
        {
            public int EquipmentId { get; set; }
            public string EquipmentName { get; set; } = null!;
            public string? Brand { get; set; }
            public string? Model { get; set; }
        }

        public class GymStatistics
        {
            public int TotalGyms { get; set; }
            public int TotalEquipmentUnits { get; set; }
        }

        public class GymEditData
        {
            public Gym Gym { get; set; } = null!;
            public IEnumerable<InventoryItemView> Inventory { get; set; } = Enumerable.Empty<InventoryItemView>();
            public IEnumerable<EquipmentView> Equipment { get; set; } = Enumerable.Empty<EquipmentView>();
        }

        public class GymInventoryResult
        {
            public bool Success { get; set; }
            public string? Error { get; set; }
            public IEnumerable<InventoryItemView> Inventory { get; set; } = Enumerable.Empty<InventoryItemView>();
            public IEnumerable<GymView> Items { get; set; } = Enumerable.Empty<GymView>();
            public GymStatistics Statistics { get; set; } = new();
        }
    }
}