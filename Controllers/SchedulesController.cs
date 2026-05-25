using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fitness.Models;

[Route("api/[controller]")]
[ApiController]
public class SchedulesController : ControllerBase
{
    private readonly FitnessContext _context;
    public SchedulesController(FitnessContext context)
    {
        _context = context;
    }

    // GET: api/Schedule
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Schedule>>> GetSchedule()
    {
        return await _context.Schedules.ToListAsync();
    }

    // GET: api/Schedule/5
    [HttpGet("{scheduleid}")]
    public async Task<ActionResult<Schedule>> GetSchedule(int scheduleid)
    {
        var schedule = await _context.Schedules.FindAsync(scheduleid);

        if (schedule == null)
        {
            return NotFound();
        }

        return schedule;
    }

    // PUT: api/Schedule/5
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPut("{scheduleid}")]
    public async Task<IActionResult> PutSchedule(int? scheduleid, Schedule schedule)
    {
        if (scheduleid != schedule.ScheduleId)
        {
            return BadRequest();
        }

        _context.Entry(schedule).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!ScheduleExists(scheduleid))
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

    // POST: api/Schedule
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPost]
    public async Task<ActionResult<Schedule>> PostSchedule(Schedule schedule)
    {
        _context.Schedules.Add(schedule);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetSchedule", new { scheduleid = schedule.ScheduleId }, schedule);
    }

    // DELETE: api/Schedule/5
    [HttpDelete("{scheduleid}")]
    public async Task<IActionResult> DeleteSchedule(int? scheduleid)
    {
        var schedule = await _context.Schedules.FindAsync(scheduleid);
        if (schedule == null)
        {
            return NotFound();
        }

        _context.Schedules.Remove(schedule);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool ScheduleExists(int? scheduleid)
    {
        return _context.Schedules.Any(e => e.ScheduleId == scheduleid);
    }
}
