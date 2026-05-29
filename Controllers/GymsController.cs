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

        [HttpGet]
        public async Task<ActionResult<object>> GetGyms(
            [FromQuery] string? gymName,
            [FromQuery] bool? hasEquipment,
            [FromQuery] string? equipmentName,
            [FromQuery] string? brand)
        {
            var gyms = await _gymService.GetAllAsync(gymName, hasEquipment, equipmentName, brand);
            var stats = await _gymService.GetStatisticsAsync();
            var brands = await _gymService.GetBrandsAsync();
            return Ok(new { Items = gyms, Statistics = stats, Brands = brands });
        }

        [HttpGet("{gymid}")]
        public async Task<ActionResult<Gym>> GetGym(int gymid)
        {
            var gym = await _gymService.GetByIdAsync(gymid);
            if (gym == null) return NotFound();
            return gym;
        }

        [HttpGet("statistics")]
        public async Task<ActionResult<GymService.GymStatistics>> GetStatistics()
        {
            var stats = await _gymService.GetStatisticsAsync();
            return Ok(stats);
        }

        [HttpPost]
        public async Task<ActionResult<Gym>> PostGym(Gym gym)
        {
            var (created, error) = await _gymService.CreateAsync(gym);
            if (error != null) return BadRequest(new { message = error });
            return CreatedAtAction(nameof(GetGym), new { gymid = created!.GymId }, created);
        }

        [HttpPut("{gymid}")]
        public async Task<IActionResult> PutGym(int gymid, Gym gym)
        {
            var (success, error) = await _gymService.UpdateAsync(gymid, gym);
            if (error != null) return BadRequest(new { message = error });
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpDelete("{gymid}")]
        public async Task<IActionResult> DeleteGym(int gymid)
        {
            var success = await _gymService.DeleteAsync(gymid);
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpGet("{gymid}/inventory")]
        public async Task<ActionResult<IEnumerable<GymService.InventoryItemView>>> GetInventory(int gymid)
        {
            var items = await _gymService.GetInventoryByGymAsync(gymid);
            return Ok(items);
        }

        [HttpPut("{gymid}/inventory")]
        public async Task<IActionResult> PutInventory(int gymid, [FromBody] InventoryUpdateDto dto)
        {
            var (success, error) = await _gymService.UpsertInventoryAsync(gymid, dto.EquipmentId, dto.Quantity);
            if (!success) return BadRequest(new { message = error });
            return NoContent();
        }

        [HttpDelete("{gymid}/inventory/{equipmentid}")]
        public async Task<IActionResult> DeleteInventoryItem(int gymid, int equipmentid)
        {
            var success = await _gymService.DeleteInventoryItemAsync(gymid, equipmentid);
            if (!success) return NotFound();
            return NoContent();
        }

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