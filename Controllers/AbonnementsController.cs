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
    public async Task<ActionResult<IEnumerable<Abonnement>>> GetAbonnements(
        [FromQuery] string? abonnementType,
        [FromQuery] bool? weekdayAccess,
        [FromQuery] bool? weekendAccess,
        [FromQuery] decimal? priceMin,
        [FromQuery] decimal? priceMax)
    {
        var abonnements = await _abonnementService.GetAllAsync(abonnementType, weekdayAccess, weekendAccess, priceMin, priceMax);
        return Ok(abonnements);
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
    public async Task<ActionResult<Abonnement>> PostAbonnement(Abonnement abonnement)
    {
        var createdAbonnement = await _abonnementService.CreateAsync(abonnement);
        return CreatedAtAction(nameof(GetAbonnement), new { abonnementid = createdAbonnement.AbonnementId }, createdAbonnement);
    }

    // PUT: api/Abonnements/5
    [HttpPut("{abonnementid}")]
    public async Task<IActionResult> PutAbonnement(int abonnementid, Abonnement abonnement)
    {
        var success = await _abonnementService.UpdateAsync(abonnementid, abonnement);

        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }

    // DELETE: api/Abonnements/5
    [HttpDelete("{abonnementid}")]
    public async Task<IActionResult> DeleteAbonnement(int abonnementid)
    {
        var success = await _abonnementService.DeleteAsync(abonnementid);

        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }
}
