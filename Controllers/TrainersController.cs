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

    // GET: api/Trainers?fullName=...&noExperience=...
    [HttpGet]
    public async Task<ActionResult<object>> GetTrainers(
        [FromQuery] string? fullName,
        [FromQuery] string? experienceSort,
        [FromQuery] bool? noExperience)
    {
        if (fullName?.Length > 50) return BadRequest(new { message = "ФИО не должно превышать 50 символов" });

        var trainers = await _trainerService.GetAllAsync(fullName, experienceSort, noExperience);
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

    // POST: api/Trainers
    [HttpPost]
    public async Task<ActionResult<Trainer>> PostTrainer(Trainer trainer)
    {
        var createdTrainer = await _trainerService.CreateAsync(trainer);
        return CreatedAtAction(nameof(GetTrainer), new { trainerid = createdTrainer.TrainerId }, createdTrainer);
    }

    // PUT: api/Trainers/5
    [HttpPut("{trainerid}")]
    public async Task<IActionResult> PutTrainer(int trainerid, Trainer trainer)
    {
        var success = await _trainerService.UpdateAsync(trainerid, trainer);

        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }

    // DELETE: api/Trainers/5
    [HttpDelete("{trainerid}")]
    public async Task<IActionResult> DeleteTrainer(int trainerid)
    {
        var success = await _trainerService.DeleteAsync(trainerid);

        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }
}
