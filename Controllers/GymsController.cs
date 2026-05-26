using Microsoft.AspNetCore.Mvc;
using Fitness.Models;
using Fitness.Services;

namespace Fitness.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GymsController : ControllerBase
    {
        private readonly GymService _gymService;

        public GymsController(GymService gymService)
        {
            _gymService = gymService;
        }

        // GET: api/Gyms?gymName=...&hasEquipment=...
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GymService.GymView>>> GetGyms(
            [FromQuery] string? gymName,
            [FromQuery] bool? hasEquipment)
        {
            var gyms = await _gymService.GetAllAsync(gymName, hasEquipment);
            return Ok(gyms);
        }

        // GET: api/Gyms/5
        [HttpGet("{gymid}")]
        public async Task<ActionResult<Gym>> GetGym(int gymid)
        {
            var gym = await _gymService.GetByIdAsync(gymid);
            if (gym == null) return NotFound();
            return gym;
        }

        // GET: api/Gyms/statistics
        [HttpGet("statistics")]
        public async Task<ActionResult<GymService.GymStatistics>> GetStatistics()
        {
            var stats = await _gymService.GetStatisticsAsync();
            return Ok(stats);
        }

        // POST: api/Gyms
        [HttpPost]
        public async Task<ActionResult<Gym>> PostGym(Gym gym)
        {
            var created = await _gymService.CreateAsync(gym);
            return CreatedAtAction(nameof(GetGym), new { gymid = created.GymId }, created);
        }

        // PUT: api/Gyms/5
        [HttpPut("{gymid}")]
        public async Task<IActionResult> PutGym(int gymid, Gym gym)
        {
            var success = await _gymService.UpdateAsync(gymid, gym);
            if (!success) return NotFound();
            return NoContent();
        }

        // DELETE: api/Gyms/5
        [HttpDelete("{gymid}")]
        public async Task<IActionResult> DeleteGym(int gymid)
        {
            var success = await _gymService.DeleteAsync(gymid);
            if (!success) return NotFound();
            return NoContent();
        }

        // ---- Inventory sub-routes ----

        // GET: api/Gyms/5/inventory
        [HttpGet("{gymid}/inventory")]
        public async Task<ActionResult<IEnumerable<GymService.InventoryItemView>>> GetInventory(int gymid)
        {
            var items = await _gymService.GetInventoryByGymAsync(gymid);
            return Ok(items);
        }

        // PUT: api/Gyms/5/inventory
        [HttpPut("{gymid}/inventory")]
        public async Task<IActionResult> PutInventory(int gymid, [FromBody] InventoryUpdateDto dto)
        {
            var success = await _gymService.UpsertInventoryAsync(gymid, dto.EquipmentId, dto.Quantity);
            if (!success) return BadRequest();
            return NoContent();
        }

        // DELETE: api/Gyms/5/inventory/10
        [HttpDelete("{gymid}/inventory/{equipmentid}")]
        public async Task<IActionResult> DeleteInventoryItem(int gymid, int equipmentid)
        {
            var success = await _gymService.DeleteInventoryItemAsync(gymid, equipmentid);
            if (!success) return NotFound();
            return NoContent();
        }

        // GET: api/Gyms/equipment (справочник)
        [HttpGet("equipment")]
        public async Task<ActionResult<IEnumerable<GymService.EquipmentView>>> GetEquipment()
        {
            var items = await _gymService.GetAllEquipmentAsync();
            return Ok(items);
        }
    }

    public class InventoryUpdateDto
    {
        public int EquipmentId { get; set; }
        public int Quantity { get; set; }
    }
}