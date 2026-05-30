using Fitness.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Fitness.Services
{
    public class EquipmentService
    {
        private readonly FitnessContext _context;

        public EquipmentService(FitnessContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Equipment>> GetAllAsync(string? equipmentName, string? brand)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            var items = new List<Equipment>();
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT * FROM get_all_equipments(@p0, @p1)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = (object)equipmentName ?? DBNull.Value; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = (object)brand ?? DBNull.Value; command.Parameters.Add(p1);

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        items.Add(new Equipment
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

        public async Task<Equipment?> GetByIdAsync(int id)
        {
            return await _context.Equipment
                .FromSqlRaw("SELECT * FROM get_equipment_by_id({0})", id)
                .FirstOrDefaultAsync();
        }

        public async Task<(Equipment? Entity, string? Error)> CreateAsync(Equipment equipment)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT add_equipment(@p0, @p1, @p2)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = (object)equipment.EquipmentName ?? DBNull.Value; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = (object)equipment.Brand ?? DBNull.Value; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = (object)equipment.Model ?? DBNull.Value; command.Parameters.Add(p2);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value) return (equipment, null);
                return (null, result.ToString());
            }
        }

        public async Task<(bool Success, string? Error)> UpdateAsync(int id, Equipment equipment)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT update_equipment(@p0, @p1, @p2, @p3)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = id; command.Parameters.Add(p0);
                var p1 = command.CreateParameter(); p1.ParameterName = "@p1"; p1.Value = (object)equipment.EquipmentName ?? DBNull.Value; command.Parameters.Add(p1);
                var p2 = command.CreateParameter(); p2.ParameterName = "@p2"; p2.Value = (object)equipment.Brand ?? DBNull.Value; command.Parameters.Add(p2);
                var p3 = command.CreateParameter(); p3.ParameterName = "@p3"; p3.Value = (object)equipment.Model ?? DBNull.Value; command.Parameters.Add(p3);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value) return (true, null);
                var str = result.ToString();
                if (str == "NOT_FOUND") return (false, null);
                return (false, str);
            }
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT delete_equipment(@p0)";
                var p0 = command.CreateParameter(); p0.ParameterName = "@p0"; p0.Value = id; command.Parameters.Add(p0);

                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value) return false;
                return (bool)result;
            }
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

        public async Task<EquipmentStatistics> GetStatisticsAsync()
        {
            var connection = _context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync();

            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT get_equipment_statistics()";
                var result = await command.ExecuteScalarAsync();
                var statsJson = result?.ToString();

                if (string.IsNullOrEmpty(statsJson)) return new EquipmentStatistics();

                return JsonSerializer.Deserialize<EquipmentStatistics>(statsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new EquipmentStatistics();
            }
        }

        public class EquipmentStatistics
        {
            public int TotalEquipment { get; set; }
            public int WithModel { get; set; }
        }
    }
}