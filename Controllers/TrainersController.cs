using Microsoft.AspNetCore.Mvc;
using Fitness.Models;
using Fitness.Services;

[Route("api/[controller]")]
[ApiController]
public class TrainersController : ControllerBase
{
    private readonly TrainerService _trainerService;

    public TrainersController(TrainerService trainerService)
    {
        _trainerService = trainerService;
    }

    // GET: api/Trainers?fullName=...&noExperience=...&workoutName=...&role=...
    [HttpGet]
    public async Task<ActionResult<object>> GetTrainers(
        [FromQuery] string? fullName,
        [FromQuery] string? experienceSort,
        [FromQuery] bool? noExperience,
        [FromQuery] string? workoutName,
        [FromQuery] string? role)
    {
        if (fullName?.Length > 50) return BadRequest(new { message = "ФИО не должно превышать 50 символов" });

        var trainers = await _trainerService.GetAllAsync(fullName, experienceSort, noExperience, workoutName, role);
        var stats = await _trainerService.GetStatisticsAsync();
        return Ok(new { Items = trainers, Statistics = stats });
    }

    // GET: api/Trainers/5
    [HttpGet("{trainerid}")]
    public async Task<ActionResult<Trainer>> GetTrainer(int trainerid)
    {
        var trainer = await _trainerService.GetByIdAsync(trainerid);

        if (trainer == null)
        {
            return NotFound();
        }

        return trainer;
    }

    // GET: api/Trainers/statistics
    [HttpGet("statistics")]
    public async Task<ActionResult<TrainerService.TrainerStatistics>> GetStatistics()
    {
        var stats = await _trainerService.GetStatisticsAsync();
        return Ok(stats);
    }

    // GET: api/Trainers/page-data
    [HttpGet("page-data")]
    public async Task<ActionResult<object>> GetPageData(
        [FromQuery] string? fullName,
        [FromQuery] string? experienceSort,
        [FromQuery] bool? noExperience,
        [FromQuery] string? workoutName,
        [FromQuery] string? role)
    {
        if (fullName?.Length > 50) return BadRequest(new { message = "ФИО не должно превышать 50 символов" });

        var data = await _trainerService.GetPageDataAsync(fullName, experienceSort, noExperience, workoutName, role);
        return Ok(data);
    }

    // GET: api/Trainers/5/edit-data
    [HttpGet("{trainerid}/edit-data")]
    public async Task<ActionResult<object>> GetEditData(int trainerid)
    {
        var data = await _trainerService.GetEditDataAsync(trainerid);
        if (data == null) return NotFound();
        return Ok(data);
    }

    // GET: api/Trainers/roles
    [HttpGet("roles")]
    public async Task<ActionResult<IEnumerable<string>>> GetRoles()
    {
        var roles = await _trainerService.GetRolesAsync();
        return Ok(roles);
    }

    // GET: api/Trainers/5/roles
    [HttpGet("{trainerid}/roles")]
    public async Task<ActionResult<IEnumerable<TrainerService.TrainerRoleView>>> GetRolesByTrainer(int trainerid)
    {
        var roles = await _trainerService.GetRolesByTrainerAsync(trainerid);
        return Ok(roles);
    }

    // PUT: api/Trainers/5/roles
    [HttpPut("{trainerid}/roles")]
    public async Task<IActionResult> AddTrainerRole(int trainerid, [FromBody] TrainerRoleDto dto)
    {
        if (dto == null || dto.WorkoutId <= 0)
            return BadRequest();

        var result = await _trainerService.AddTrainerRoleAsync(trainerid, dto.WorkoutId, dto.Role);
        if (!result.Success) return BadRequest(new { message = result.Error ?? "Ошибка" });
        return Ok(result);
    }

    // DELETE: api/Trainers/5/roles/3
    [HttpDelete("{trainerid}/roles/{workoutid}")]
    public async Task<IActionResult> DeleteTrainerRole(int trainerid, int workoutid)
    {
        var result = await _trainerService.DeleteTrainerRoleAsync(trainerid, workoutid);
        if (!result.Success) return NotFound(new { message = result.Error });
        return Ok(result);
    }

    // GET: api/Trainers/workouts/dictionary
    [HttpGet("workouts/dictionary")]
    public async Task<ActionResult<IEnumerable<TrainerService.WorkoutView>>> GetWorkoutsDictionary()
    {
        var workouts = await _trainerService.GetWorkoutsDictionaryAsync();
        return Ok(workouts);
    }

    // POST: api/Trainers
    [HttpPost]
    public async Task<ActionResult<Trainer>> PostTrainer(Trainer trainer)
    {
        var (createdTrainer, msg) = await _trainerService.CreateAsync(trainer);
        if (createdTrainer == null) return BadRequest(new { message = msg ?? "Не удалось создать тренера" });
        return CreatedAtAction(nameof(GetTrainer), new { trainerid = createdTrainer.TrainerId }, createdTrainer);
    }

    // PUT: api/Trainers/5
    [HttpPut("{trainerid}")]
    public async Task<IActionResult> PutTrainer(int trainerid, Trainer trainer)
    {
        var (success, message) = await _trainerService.UpdateAsync(trainerid, trainer);

        if (!success)
        {
            return BadRequest(new { message = message ?? "Не удалось обновить тренера" });
        }

        return NoContent();
    }

    // DELETE: api/Trainers/5
    [HttpDelete("{trainerid}")]
    public async Task<IActionResult> DeleteTrainer(int trainerid)
    {
        var (success, message) = await _trainerService.DeleteAsync(trainerid);

        if (!success)
        {
            return BadRequest(new { message = message ?? "Не удалось удалить тренера" });
        }

        return NoContent();
    }
}

public class TrainerRoleDto
{
    public int WorkoutId { get; set; }
    public string Role { get; set; } = null!;
}
