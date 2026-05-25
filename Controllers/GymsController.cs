using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fitness.Models;

[Route("api/[controller]")]
[ApiController]
public class GymsController : ControllerBase
{
    private readonly FitnessContext _context;
    public GymsController(FitnessContext context)
    {
        _context = context;
    }

    // GET: api/Gym
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Gym>>> GetGym()
    {
        return await _context.Gyms.ToListAsync();
    }

    // GET: api/Gym/5
    [HttpGet("{gymid}")]
    public async Task<ActionResult<Gym>> GetGym(int gymid)
    {
        var gym = await _context.Gyms.FindAsync(gymid);

        if (gym == null)
        {
            return NotFound();
        }

        return gym;
    }

    // PUT: api/Gym/5
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPut("{gymid}")]
    public async Task<IActionResult> PutGym(int? gymid, Gym gym)
    {
        if (gymid != gym.GymId)
        {
            return BadRequest();
        }

        _context.Entry(gym).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!GymExists(gymid))
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

    // POST: api/Gym
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPost]
    public async Task<ActionResult<Gym>> PostGym(Gym gym)
    {
        _context.Gyms.Add(gym);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetGym", new { gymid = gym.GymId }, gym);
    }

    // DELETE: api/Gym/5
    [HttpDelete("{gymid}")]
    public async Task<IActionResult> DeleteGym(int? gymid)
    {
        var gym = await _context.Gyms.FindAsync(gymid);
        if (gym == null)
        {
            return NotFound();
        }

        _context.Gyms.Remove(gym);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool GymExists(int? gymid)
    {
        return _context.Gyms.Any(e => e.GymId == gymid);
    }
}
