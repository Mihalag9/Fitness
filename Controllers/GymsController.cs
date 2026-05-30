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
            if (gymName?.Length > 30) return BadRequest(new { message = "Название зала не должно превышать 30 символов" });
            if (equipmentName?.Length > 40) return BadRequest(new { message = "Название оборудования не должно превышать 40 символов" });
            if (brand?.Length > 20) return BadRequest(new { message = "Бренд не должен превышать 20 символов" });

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

        [HttpGet("{gymid}/edit-data")]
        public async Task<ActionResult<object>> GetEditData(int gymid)
        {
            var data = await _gymService.GetEditDataAsync(gymid);
            if (data == null) return NotFound();
            return Ok(data);
        }

        [HttpPut("{gymid}/inventory")]
        public async Task<IActionResult> PutInventory(int gymid, [FromBody] InventoryUpdateDto dto)
        {
            var result = await _gymService.UpsertInventoryAsync(gymid, dto.EquipmentId, dto.Quantity);
            if (!result.Success) return BadRequest(new { message = result.Error });
            return Ok(result);
        }

        [HttpDelete("{gymid}/inventory/{equipmentid}")]
        public async Task<IActionResult> DeleteInventoryItem(int gymid, int equipmentid)
        {
            var result = await _gymService.DeleteInventoryItemAsync(gymid, equipmentid);
            if (!result.Success) return NotFound();
            return Ok(result);
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