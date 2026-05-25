using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fitness.Models;

[Route("api/[controller]")]
[ApiController]
public class EquipmentsController : ControllerBase
{
    private readonly FitnessContext _context;
    public EquipmentsController(FitnessContext context)
    {
        _context = context;
    }

    // GET: api/Equipment
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Equipment>>> GetEquipment()
    {
        return await _context.Equipment.ToListAsync();
    }

    // GET: api/Equipment/5
    [HttpGet("{equipmentid}")]
    public async Task<ActionResult<Equipment>> GetEquipment(int equipmentid)
    {
        var equipment = await _context.Equipment.FindAsync(equipmentid);

        if (equipment == null)
        {
            return NotFound();
        }

        return equipment;
    }

    // PUT: api/Equipment/5
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPut("{equipmentid}")]
    public async Task<IActionResult> PutEquipment(int? equipmentid, Equipment equipment)
    {
        if (equipmentid != equipment.EquipmentId)
        {
            return BadRequest();
        }

        _context.Entry(equipment).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!EquipmentExists(equipmentid))
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

    // POST: api/Equipment
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPost]
    public async Task<ActionResult<Equipment>> PostEquipment(Equipment equipment)
    {
        _context.Equipment.Add(equipment);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetEquipment", new { equipmentid = equipment.EquipmentId }, equipment);
    }

    // DELETE: api/Equipment/5
    [HttpDelete("{equipmentid}")]
    public async Task<IActionResult> DeleteEquipment(int? equipmentid)
    {
        var equipment = await _context.Equipment.FindAsync(equipmentid);
        if (equipment == null)
        {
            return NotFound();
        }

        _context.Equipment.Remove(equipment);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool EquipmentExists(int? equipmentid)
    {
        return _context.Equipment.Any(e => e.EquipmentId == equipmentid);
    }
}
