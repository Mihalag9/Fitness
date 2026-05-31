using Microsoft.AspNetCore.Mvc;
using Fitness.Models;
using Fitness.Services;

[Route("api/[controller]")]
[ApiController]
public class SchedulesController : ControllerBase
{
    private readonly ScheduleService _scheduleService;
    private readonly BookingService _bookingService;

    public SchedulesController(ScheduleService scheduleService, BookingService bookingService)
    {
        _scheduleService = scheduleService;
        _bookingService = bookingService;
    }

    // ==================== РАСПИСАНИЕ ====================

    // GET: api/Schedules/page-data
    [HttpGet("page-data")]
    public async Task<ActionResult> GetPageData(
        [FromQuery] string? trainerName,
        [FromQuery] string? gymName,
        [FromQuery] string? workoutName,
        [FromQuery] int? workoutTypeId,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] string? clientName)
    {
        if (trainerName?.Length > 50) return BadRequest(new { message = "ФИО тренера не должно превышать 50 символов" });
        if (gymName?.Length > 50) return BadRequest(new { message = "Название зала не должно превышать 50 символов" });
        if (workoutName?.Length > 50) return BadRequest(new { message = "Название тренировки не должно превышать 50 символов" });
        if (clientName?.Length > 50) return BadRequest(new { message = "Имя клиента не должно превышать 50 символов" });

        var pageData = await _scheduleService.GetPageDataAsync(trainerName, gymName, workoutName, workoutTypeId, dateFrom, dateTo, clientName);
        var clients = await _bookingService.GetClientsDictionaryAsync();

        return Ok(new
        {
            pageData.Items,
            pageData.Statistics,
            pageData.Trainers,
            pageData.Workouts,
            pageData.Gyms,
            pageData.WorkoutTypes,
            Clients = clients
        });
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

        var (entity, message) = await _scheduleService.CreateAsync(dto);
        if (entity == null) return BadRequest(new { message });
        return Ok(new { message, entity });
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

        var (success, message) = await _scheduleService.UpdateAsync(scheduleid, dto);
        if (!success) return BadRequest(new { message });
        return Ok(new { message });
    }

    // DELETE: api/Schedules/5
    [HttpDelete("{scheduleid}")]
    public async Task<IActionResult> DeleteSchedule(int scheduleid)
    {
        var (success, message) = await _scheduleService.DeleteAsync(scheduleid);
        if (!success) return BadRequest(new { message });
        return Ok(new { message });
    }

    // ==================== ЗАПИСИ НА ЗАНЯТИЯ ====================

    // GET: api/Schedules/5/bookings
    [HttpGet("{scheduleid}/bookings")]
    public async Task<ActionResult> GetBookings(
        int scheduleid,
        [FromQuery] string? clientName,
        [FromQuery] bool? attended)
    {
        if (clientName?.Length > 50) return BadRequest(new { message = "Имя клиента не должно превышать 50 символов" });

        var bookings = await _bookingService.GetBookingsByScheduleAsync(scheduleid, clientName, attended);
        var stats = await _bookingService.GetBookingStatsAsync(scheduleid);
        return Ok(new { items = bookings, stats });
    }

    // POST: api/Schedules/5/bookings
    [HttpPost("{scheduleid}/bookings")]
    public async Task<IActionResult> PostBooking(int scheduleid, [FromBody] BookingDto dto)
    {
        if (dto == null || dto.ClientId <= 0)
            return BadRequest(new { message = "Не указан клиент" });

        var (success, message) = await _bookingService.CreateAsync(dto.ClientId, scheduleid);
        if (!success) return BadRequest(new { message });
        return Ok(new { message });
    }

    // DELETE: api/Schedules/5/bookings/3
    [HttpDelete("{scheduleid}/bookings/{clientid}")]
    public async Task<IActionResult> DeleteBooking(int scheduleid, int clientid)
    {
        var (success, message) = await _bookingService.DeleteAsync(clientid, scheduleid);
        if (!success) return BadRequest(new { message });
        return Ok(new { message });
    }

    // PUT: api/Schedules/5/bookings/3/attended
    [HttpPut("{scheduleid}/bookings/{clientid}/attended")]
    public async Task<IActionResult> ToggleAttended(int scheduleid, int clientid)
    {
        var (success, message) = await _bookingService.ToggleAttendedAsync(clientid, scheduleid);
        if (!success) return BadRequest(new { message });
        return Ok(new { message });
    }
}

public class BookingDto
{
    public int ClientId { get; set; }
}
