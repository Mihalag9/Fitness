using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fitness.Models;

[Route("api/[controller]")]
[ApiController]
public class AbonnementsController : ControllerBase
{
    private readonly FitnessContext _context;
    public AbonnementsController(FitnessContext context)
    {
        _context = context;
    }

    // GET: api/Abonnement
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Abonnement>>> GetAbonnement()
    {
        return await _context.Abonnements.ToListAsync();
    }

    // GET: api/Abonnement/5
    [HttpGet("{abonnementid}")]
    public async Task<ActionResult<Abonnement>> GetAbonnement(int abonnementid)
    {
        var abonnement = await _context.Abonnements.FindAsync(abonnementid);

        if (abonnement == null)
        {
            return NotFound();
        }

        return abonnement;
    }

    // PUT: api/Abonnement/5
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPut("{abonnementid}")]
    public async Task<IActionResult> PutAbonnement(int? abonnementid, Abonnement abonnement)
    {
        if (abonnementid != abonnement.AbonnementId)
        {
            return BadRequest();
        }

        _context.Entry(abonnement).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!AbonnementExists(abonnementid))
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

    // POST: api/Abonnement
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPost]
    public async Task<ActionResult<Abonnement>> PostAbonnement(Abonnement abonnement)
    {
        _context.Abonnements.Add(abonnement);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetAbonnement", new { abonnementid = abonnement.AbonnementId }, abonnement);
    }

    // DELETE: api/Abonnement/5
    [HttpDelete("{abonnementid}")]
    public async Task<IActionResult> DeleteAbonnement(int? abonnementid)
    {
        var abonnement = await _context.Abonnements.FindAsync(abonnementid);
        if (abonnement == null)
        {
            return NotFound();
        }

        _context.Abonnements.Remove(abonnement);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool AbonnementExists(int? abonnementid)
    {
        return _context.Abonnements.Any(e => e.AbonnementId == abonnementid);
    }
}
