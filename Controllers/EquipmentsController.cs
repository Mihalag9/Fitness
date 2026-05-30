using Microsoft.AspNetCore.Mvc;
using Fitness.Models;
using Fitness.Services;

namespace Fitness.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EquipmentController : ControllerBase
    {
        private readonly EquipmentService _equipmentService;

        public EquipmentController(EquipmentService equipmentService)
        {
            _equipmentService = equipmentService;
        }

        [HttpGet]
        public async Task<ActionResult<object>> GetEquipment(
            [FromQuery] string? equipmentName,
            [FromQuery] string? brand)
        {
            if (equipmentName?.Length > 40) return BadRequest(new { message = "Название оборудования не должно превышать 40 символов" });
            if (brand?.Length > 20) return BadRequest(new { message = "Бренд не должен превышать 20 символов" });

            var items = await _equipmentService.GetAllAsync(equipmentName, brand);
            var stats = await _equipmentService.GetStatisticsAsync();
            var brands = await _equipmentService.GetBrandsAsync();
            return Ok(new { Items = items, Statistics = stats, Brands = brands });
        }

        [HttpGet("brands")]
        public async Task<ActionResult<IEnumerable<string>>> GetBrands()
        {
            var brands = await _equipmentService.GetBrandsAsync();
            return Ok(brands);
        }

        [HttpGet("{equipmentid}")]
        public async Task<ActionResult<Equipment>> GetEquipment(int equipmentid)
        {
            var item = await _equipmentService.GetByIdAsync(equipmentid);
            if (item == null) return NotFound();
            return item;
        }

        [HttpGet("statistics")]
        public async Task<ActionResult<EquipmentService.EquipmentStatistics>> GetStatistics()
        {
            var stats = await _equipmentService.GetStatisticsAsync();
            return Ok(stats);
        }

        [HttpPost]
        public async Task<ActionResult<Equipment>> PostEquipment(Equipment equipment)
        {
            var (created, error) = await _equipmentService.CreateAsync(equipment);
            if (error != null) return BadRequest(new { message = error });
            return CreatedAtAction(nameof(GetEquipment), new { equipmentid = created!.EquipmentId }, created);
        }

        [HttpPut("{equipmentid}")]
        public async Task<IActionResult> PutEquipment(int equipmentid, Equipment equipment)
        {
            var (success, error) = await _equipmentService.UpdateAsync(equipmentid, equipment);
            if (error != null) return BadRequest(new { message = error });
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpDelete("{equipmentid}")]
        public async Task<IActionResult> DeleteEquipment(int equipmentid)
        {
            var success = await _equipmentService.DeleteAsync(equipmentid);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}