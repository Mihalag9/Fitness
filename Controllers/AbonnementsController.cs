using Microsoft.AspNetCore.Mvc;
using Fitness.Models;
using Fitness.Services;

[Route("api/[controller]")]
[ApiController]
public class AbonnementsController : ControllerBase
{
    private readonly AbonnementService _abonnementService;

    public AbonnementsController(AbonnementService abonnementService)
    {
        _abonnementService = abonnementService;
    }

    // GET: api/Abonnements
    [HttpGet]
    public async Task<ActionResult<object>> GetAbonnements(
        [FromQuery] string? abonnementType,
        [FromQuery] bool? weekdayAccess,
        [FromQuery] bool? weekendAccess,
        [FromQuery] decimal? priceMin,
        [FromQuery] decimal? priceMax,
        [FromQuery] string? sortField,
        [FromQuery] string? sortDirection)
    {
        if (abonnementType?.Length > 30) return BadRequest(new { message = "Название не должно превышать 30 символов" });

        var abonnements = await _abonnementService.GetAllAsync(abonnementType, weekdayAccess, weekendAccess, priceMin, priceMax, sortField, sortDirection);
        var stats = await _abonnementService.GetStatisticsAsync();
        return Ok(new { Items = abonnements, Statistics = stats });
    }

    // GET: api/Abonnements/5
    [HttpGet("{abonnementid}")]
    public async Task<ActionResult<Abonnement>> GetAbonnement(int abonnementid)
    {
        var abonnement = await _abonnementService.GetByIdAsync(abonnementid);

        if (abonnement == null)
        {
            return NotFound();
        }

        return abonnement;
    }

    // GET: api/Abonnements/statistics
    [HttpGet("statistics")]
    public async Task<ActionResult<AbonnementService.AbonnementStatistics>> GetStatistics()
    {
        var stats = await _abonnementService.GetStatisticsAsync();
        return Ok(stats);
    }

    // POST: api/Abonnements
    [HttpPost]
    public async Task<ActionResult> PostAbonnement(Abonnement abonnement)
    {
        var (entity, message) = await _abonnementService.CreateAsync(abonnement);
        if (entity == null) return BadRequest(new { message });
        return Ok(new { message, entity });
    }

    // PUT: api/Abonnements/5
    [HttpPut("{abonnementid}")]
    public async Task<IActionResult> PutAbonnement(int abonnementid, Abonnement abonnement)
    {
        var (success, message) = await _abonnementService.UpdateAsync(abonnementid, abonnement);
        if (!success) return BadRequest(new { message });
        return Ok(new { message });
    }

    // DELETE: api/Abonnements/5
    [HttpDelete("{abonnementid}")]
    public async Task<IActionResult> DeleteAbonnement(int abonnementid)
    {
        var (success, message) = await _abonnementService.DeleteAsync(abonnementid);
        if (!success) return BadRequest(new { message });
        return Ok(new { message });
    }
}
