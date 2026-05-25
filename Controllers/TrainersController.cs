using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fitness.Models;

[Route("api/[controller]")]
[ApiController]
public class TrainersController : ControllerBase
{
    private readonly FitnessContext _context;
    public TrainersController(FitnessContext context)
    {
        _context = context;
    }

    // GET: api/Trainer
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Trainer>>> GetTrainer()
    {
        return await _context.Trainers.ToListAsync();
    }

    // GET: api/Trainer/5
    [HttpGet("{trainerid}")]
    public async Task<ActionResult<Trainer>> GetTrainer(int trainerid)
    {
        var trainer = await _context.Trainers.FindAsync(trainerid);

        if (trainer == null)
        {
            return NotFound();
        }

        return trainer;
    }

    // PUT: api/Trainer/5
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPut("{trainerid}")]
    public async Task<IActionResult> PutTrainer(int? trainerid, Trainer trainer)
    {
        if (trainerid != trainer.TrainerId)
        {
            return BadRequest();
        }

        _context.Entry(trainer).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!TrainerExists(trainerid))
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

    // POST: api/Trainer
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPost]
    public async Task<ActionResult<Trainer>> PostTrainer(Trainer trainer)
    {
        _context.Trainers.Add(trainer);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetTrainer", new { trainerid = trainer.TrainerId }, trainer);
    }

    // DELETE: api/Trainer/5
    [HttpDelete("{trainerid}")]
    public async Task<IActionResult> DeleteTrainer(int? trainerid)
    {
        var trainer = await _context.Trainers.FindAsync(trainerid);
        if (trainer == null)
        {
            return NotFound();
        }

        _context.Trainers.Remove(trainer);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool TrainerExists(int? trainerid)
    {
        return _context.Trainers.Any(e => e.TrainerId == trainerid);
    }
}
