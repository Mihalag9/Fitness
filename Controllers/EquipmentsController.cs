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
        public async Task<ActionResult<IEnumerable<Equipment>>> GetEquipment([FromQuery] string? equipmentName)
        {
            var items = await _equipmentService.GetAllAsync(equipmentName);
            return Ok(items);
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
            var created = await _equipmentService.CreateAsync(equipment);
            return CreatedAtAction(nameof(GetEquipment), new { equipmentid = created.EquipmentId }, created);
        }

        [HttpPut("{equipmentid}")]
        public async Task<IActionResult> PutEquipment(int equipmentid, Equipment equipment)
        {
            var success = await _equipmentService.UpdateAsync(equipmentid, equipment);
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