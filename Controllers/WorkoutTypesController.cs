using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fitness.Models;

[Route("api/[controller]")]
[ApiController]
public class WorkoutTypesController : ControllerBase
{
    private readonly FitnessContext _context;
    public WorkoutTypesController(FitnessContext context)
    {
        _context = context;
    }

    // GET: api/WorkoutType
    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkoutType>>> GetWorkoutType()
    {
        return await _context.WorkoutTypes.ToListAsync();
    }

    // GET: api/WorkoutType/5
    [HttpGet("{workouttypeid}")]
    public async Task<ActionResult<WorkoutType>> GetWorkoutType(int workouttypeid)
    {
        var workouttype = await _context.WorkoutTypes.FindAsync(workouttypeid);

        if (workouttype == null)
        {
            return NotFound();
        }

        return workouttype;
    }

    // PUT: api/WorkoutType/5
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPut("{workouttypeid}")]
    public async Task<IActionResult> PutWorkoutType(int? workouttypeid, WorkoutType workouttype)
    {
        if (workouttypeid != workouttype.WorkoutTypeId)
        {
            return BadRequest();
        }

        _context.Entry(workouttype).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!WorkoutTypeExists(workouttypeid))
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

    // POST: api/WorkoutType
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPost]
    public async Task<ActionResult<WorkoutType>> PostWorkoutType(WorkoutType workouttype)
    {
        _context.WorkoutTypes.Add(workouttype);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetWorkoutType", new { workouttypeid = workouttype.WorkoutTypeId }, workouttype);
    }

    // DELETE: api/WorkoutType/5
    [HttpDelete("{workouttypeid}")]
    public async Task<IActionResult> DeleteWorkoutType(int? workouttypeid)
    {
        var workouttype = await _context.WorkoutTypes.FindAsync(workouttypeid);
        if (workouttype == null)
        {
            return NotFound();
        }

        _context.WorkoutTypes.Remove(workouttype);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool WorkoutTypeExists(int? workouttypeid)
    {
        return _context.WorkoutTypes.Any(e => e.WorkoutTypeId == workouttypeid);
    }
}
