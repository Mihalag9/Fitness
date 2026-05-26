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

        // ---- Gyms ----

        public async Task<IEnumerable<GymView>> GetAllAsync(string? gymName, bool? hasEquipment)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var gyms = new List<GymView>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_all_gyms(@p0, @p1)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = (object)gymName ?? DBNull.Value; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = (object)hasEquipment ?? DBNull.Value; command.Parameters.Add(p1);

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

        public async Task<Gym> CreateAsync(Gym gym)
        {
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
                return gym;
            }
        }

        public async Task<bool> UpdateAsync(int id, Gym gym)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT update_gym(@p0, @p1)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = id; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = (object)gym.GymName ?? DBNull.Value; command.Parameters.Add(p1);

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
                command.CommandText = "SELECT delete_gym(@p0)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = id; command.Parameters.Add(p0);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value) return false;
                return (bool)result;
            }
        }

        // ---- Inventory ----

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

        public async Task<bool> UpsertInventoryAsync(int gymId, int equipmentId, int quantity)
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
                if (result == null || result == DBNull.Value) return false;
                return (bool)result;
            }
        }

        public async Task<bool> DeleteInventoryItemAsync(int gymId, int equipmentId)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT delete_inventory_item(@p0, @p1)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = gymId; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = equipmentId; command.Parameters.Add(p1);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value) return false;
                return (bool)result;
            }
        }

        // ---- Equipment (справочник) ----

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

        // ---- Statistics ----

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

        // ---- DTOs ----
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
    }
}