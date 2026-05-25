using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fitness.Models;

[Route("api/[controller]")]
[ApiController]
public class WorkoutsController : ControllerBase
{
    private readonly FitnessContext _context;
    public WorkoutsController(FitnessContext context)
    {
        _context = context;
    }

    // GET: api/Workout
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Workout>>> GetWorkout()
    {
        return await _context.Workouts.ToListAsync();
    }

    // GET: api/Workout/5
    [HttpGet("{workoutid}")]
    public async Task<ActionResult<Workout>> GetWorkout(int workoutid)
    {
        var workout = await _context.Workouts.FindAsync(workoutid);

        if (workout == null)
        {
            return NotFound();
        }

        return workout;
    }

    // PUT: api/Workout/5
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPut("{workoutid}")]
    public async Task<IActionResult> PutWorkout(int? workoutid, Workout workout)
    {
        if (workoutid != workout.WorkoutId)
        {
            return BadRequest();
        }

        _context.Entry(workout).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!WorkoutExists(workoutid))
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

    // POST: api/Workout
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPost]
    public async Task<ActionResult<Workout>> PostWorkout(Workout workout)
    {
        _context.Workouts.Add(workout);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetWorkout", new { workoutid = workout.WorkoutId }, workout);
    }

    // DELETE: api/Workout/5
    [HttpDelete("{workoutid}")]
    public async Task<IActionResult> DeleteWorkout(int? workoutid)
    {
        var workout = await _context.Workouts.FindAsync(workoutid);
        if (workout == null)
        {
            return NotFound();
        }

        _context.Workouts.Remove(workout);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool WorkoutExists(int? workoutid)
    {
        return _context.Workouts.Any(e => e.WorkoutId == workoutid);
    }
}
