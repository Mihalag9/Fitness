using Microsoft.AspNetCore.Mvc;
using Fitness.Models;
using Fitness.Services;

[Route("api/[controller]")]
[ApiController]
public class SchedulesController : ControllerBase
{
    private readonly ScheduleService _scheduleService;

    public SchedulesController(ScheduleService scheduleService)
    {
        _scheduleService = scheduleService;
    }

    // GET: api/Schedules/page-data
    [HttpGet("page-data")]
    public async Task<ActionResult<ScheduleService.SchedulePageData>> GetPageData(
        [FromQuery] string? trainerName,
        [FromQuery] string? gymName,
        [FromQuery] string? workoutName,
        [FromQuery] int? workoutTypeId,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo)
    {
        if (trainerName?.Length > 50) return BadRequest(new { message = "ФИО тренера не должно превышать 50 символов" });
        if (gymName?.Length > 50) return BadRequest(new { message = "Название зала не должно превышать 50 символов" });
        if (workoutName?.Length > 50) return BadRequest(new { message = "Название тренировки не должно превышать 50 символов" });

        var pageData = await _scheduleService.GetPageDataAsync(trainerName, gymName, workoutName, workoutTypeId, dateFrom, dateTo);
        return Ok(pageData);
    }

    // GET: api/Schedules/5
    [HttpGet("{scheduleid}")]
    public async Task<ActionResult<ScheduleService.ScheduleView>> GetSchedule(int scheduleid)
    {
        var schedule = await _scheduleService.GetByIdAsync(scheduleid);
        if (schedule == null) return NotFound();
        return Ok(schedule);
    }

    // POST: api/Schedules
    [HttpPost]
    public async Task<ActionResult> PostSchedule([FromBody] ScheduleDto dto)
    {
        if (dto == null) return BadRequest(new { message = "Тело запроса обязательно" });
        if (dto.WorkoutId <= 0) return BadRequest(new { message = "Не указана тренировка" });
        if (dto.GymId <= 0) return BadRequest(new { message = "Не указан зал" });
        if (dto.WorkoutTypeId <= 0) return BadRequest(new { message = "Не указан тип тренировки" });
        if (string.IsNullOrWhiteSpace(dto.StartTime)) return BadRequest(new { message = "Не указано время начала" });

        var (entity, error) = await _scheduleService.CreateAsync(dto);
        if (error != null) return BadRequest(new { message = error });
        if (entity == null) return BadRequest(new { message = "Не удалось создать запись" });

        return Ok(entity);
    }

    // PUT: api/Schedules/5
    [HttpPut("{scheduleid}")]
    public async Task<IActionResult> PutSchedule(int scheduleid, [FromBody] ScheduleDto dto)
    {
        if (dto == null) return BadRequest(new { message = "Тело запроса обязательно" });
        if (dto.WorkoutId <= 0) return BadRequest(new { message = "Не указана тренировка" });
        if (dto.GymId <= 0) return BadRequest(new { message = "Не указан зал" });
        if (dto.WorkoutTypeId <= 0) return BadRequest(new { message = "Не указан тип тренировки" });
        if (string.IsNullOrWhiteSpace(dto.StartTime)) return BadRequest(new { message = "Не указано время начала" });

        var (success, error) = await _scheduleService.UpdateAsync(scheduleid, dto);
        if (error != null) return BadRequest(new { message = error });
        if (!success) return NotFound();

        return NoContent();
    }

    // DELETE: api/Schedules/5
    [HttpDelete("{scheduleid}")]
    public async Task<IActionResult> DeleteSchedule(int scheduleid)
    {
        var (success, error) = await _scheduleService.DeleteAsync(scheduleid);
        if (error != null) return BadRequest(new { message = error });
        if (!success) return NotFound();

        return NoContent();
    }
}
