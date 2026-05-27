using Microsoft.AspNetCore.Mvc;
using Fitness.Models;
using Fitness.Services;

[Route("api/[controller]")]
[ApiController]
public class WorkoutsController : ControllerBase
{
    private readonly WorkoutService _workoutService;

    public WorkoutsController(WorkoutService workoutService)
    {
        _workoutService = workoutService;
    }

    // GET: api/Workouts?workoutName=...&durationFrom=...&durationTo=...&maxParticipantsMin=...&maxParticipantsMax=...&participantsSort=...
    [HttpGet]
    public async Task<ActionResult<object>> GetWorkouts(
        [FromQuery] string? workoutName,
        [FromQuery] int? durationFrom,
        [FromQuery] int? durationTo,
        [FromQuery] int? maxParticipantsMin,
        [FromQuery] int? maxParticipantsMax,
        [FromQuery] string? participantsSort)
    {
        var workouts = await _workoutService.GetAllAsync(workoutName, durationFrom, durationTo, maxParticipantsMin, maxParticipantsMax, participantsSort);
        var stats = await _workoutService.GetStatisticsAsync();
        return Ok(new { Items = workouts, Statistics = stats });
    }

    // GET: api/Workouts/5
    [HttpGet("{workoutid}")]
    public async Task<ActionResult<Workout>> GetWorkout(int workoutid)
    {
        var workout = await _workoutService.GetByIdAsync(workoutid);

        if (workout == null)
        {
            return NotFound();
        }

        return workout;
    }

    // GET: api/Workouts/statistics
    [HttpGet("statistics")]
    public async Task<ActionResult<WorkoutService.WorkoutStatistics>> GetStatistics()
    {
        var stats = await _workoutService.GetStatisticsAsync();
        return Ok(stats);
    }

    // POST: api/Workouts
    [HttpPost]
    public async Task<ActionResult<Workout>> PostWorkout(Workout workout)
    {
        var createdWorkout = await _workoutService.CreateAsync(workout);
        return CreatedAtAction(nameof(GetWorkout), new { workoutid = createdWorkout.WorkoutId }, createdWorkout);
    }

    // PUT: api/Workouts/5
    [HttpPut("{workoutid}")]
    public async Task<IActionResult> PutWorkout(int workoutid, Workout workout)
    {
        var success = await _workoutService.UpdateAsync(workoutid, workout);

        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }

    // DELETE: api/Workouts/5
    [HttpDelete("{workoutid}")]
    public async Task<IActionResult> DeleteWorkout(int workoutid)
    {
        var success = await _workoutService.DeleteAsync(workoutid);

        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }
}
