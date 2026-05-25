using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fitness.Models;

namespace Fitness.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InventoriesController : ControllerBase
    {
        private readonly FitnessContext _context;

        public InventoriesController(FitnessContext context)
        {
            _context = context;
        }

        // GET: api/Inventories
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Inventory>>> GetInventories()
        {
            return await _context.Inventories.ToListAsync();
        }

        // GET: api/Inventories/5/10
        [HttpGet("{equipmentid}/{gymid}")]
        public async Task<ActionResult<Inventory>> GetInventory(int equipmentid, int gymid)
        {
            var inventory = await _context.Inventories.FindAsync(equipmentid, gymid);

            if (inventory == null)
            {
                return NotFound();
            }

            return inventory;
        }

        // PUT: api/Inventories/5/10
        [HttpPut("{equipmentid}/{gymid}")]
        public async Task<IActionResult> PutInventory(int equipmentid, int gymid, Inventory inventory)
        {
            if (equipmentid != inventory.EquipmentId || gymid != inventory.GymId)
            {
                return BadRequest();
            }

            _context.Entry(inventory).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!InventoryExists(equipmentid, gymid))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Inventories
        [HttpPost]
        public async Task<ActionResult<Inventory>> PostInventory(Inventory inventory)
        {
            _context.Inventories.Add(inventory);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetInventory), new { equipmentid = inventory.EquipmentId, gymid = inventory.GymId }, inventory);
        }

        // DELETE: api/Inventories/5/10
        [HttpDelete("{equipmentid}/{gymid}")]
        public async Task<IActionResult> DeleteInventory(int equipmentid, int gymid)
        {
            var inventory = await _context.Inventories.FindAsync(equipmentid, gymid);
            if (inventory == null)
            {
                return NotFound();
            }

            _context.Inventories.Remove(inventory);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool InventoryExists(int equipmentid, int gymid)
        {
            return _context.Inventories.Any(e => e.EquipmentId == equipmentid && e.GymId == gymid);
        }
    }
}
