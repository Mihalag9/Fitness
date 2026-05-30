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

    // GET: api/Workouts/gyms/dictionary
    [HttpGet("gyms/dictionary")]
    public async Task<ActionResult<IEnumerable<WorkoutService.GymLinkView>>> GetGymsDictionary()
    {
        var gyms = await _workoutService.GetAllGymsDictionaryAsync();
        return Ok(gyms);
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
        if (workoutName?.Length > 50) return BadRequest(new { message = "Название не должно превышать 50 символов" });

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
        var (createdWorkout, error) = await _workoutService.CreateAsync(workout);
        if (error != null) return BadRequest(new { message = error });
        return CreatedAtAction(nameof(GetWorkout), new { workoutid = createdWorkout!.WorkoutId }, createdWorkout);
    }

    // PUT: api/Workouts/5
    [HttpPut("{workoutid}")]
    public async Task<IActionResult> PutWorkout(int workoutid, Workout workout)
    {
        var (success, error) = await _workoutService.UpdateAsync(workoutid, workout);
        if (error != null) return BadRequest(new { message = error });

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

    // GET: api/Workouts/5/gyms
    [HttpGet("{workoutid}/gyms")]
    public async Task<ActionResult<IEnumerable<WorkoutService.GymLinkView>>> GetLinkedGyms(int workoutid)
    {
        var gyms = await _workoutService.GetGymsByWorkoutAsync(workoutid);
        return Ok(gyms);
    }

    // PUT: api/Workouts/5/gyms
    [HttpPut("{workoutid}/gyms")]
    public async Task<IActionResult> PutGymLink(int workoutid, [FromBody] GymLinkDto dto)
    {
        if (dto == null || dto.GymId <= 0)
            return BadRequest();

        var (success, error) = await _workoutService.AddGymLinkAsync(dto.GymId, workoutid);
        if (!success) return BadRequest(error ?? "Ошибка");
        return NoContent();
    }

    // DELETE: api/Workouts/5/gyms/3
    [HttpDelete("{workoutid}/gyms/{gymid}")]
    public async Task<IActionResult> DeleteGymLink(int workoutid, int gymid)
    {
        var success = await _workoutService.RemoveGymLinkAsync(gymid, workoutid);
        if (!success) return NotFound();
        return NoContent();
    }
}

public class GymLinkDto
{
    public int GymId { get; set; }
}
