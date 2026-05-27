using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fitness.Models;

namespace Fitness.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TrainerRolesController : ControllerBase
    {
        private readonly FitnessContext _context;

        public TrainerRolesController(FitnessContext context)
        {
            _context = context;
        }

        // GET: api/TrainerRoles
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetTrainerRoles()
        {
            return await _context.TrainerRoles
                .Include(tr => tr.Workout)
                .Include(tr => tr.Trainer)
                .Select(tr => new {
                    tr.TrainerId,
                    tr.WorkoutId,
                    tr.TRole,
                    WorkoutName = tr.Workout.WorkoutName,
                    TrainerName = tr.Trainer.FullName
                })
                .ToListAsync();
        }

        // GET: api/TrainerRoles/bytrainer/5
        [HttpGet("bytrainer/{trainerId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetTrainerRolesByTrainer(int trainerId)
        {
            return await _context.TrainerRoles
                .Where(tr => tr.TrainerId == trainerId)
                .Include(tr => tr.Workout)
                .Select(tr => new {
                    tr.TrainerId,
                    tr.WorkoutId,
                    tr.TRole,
                    WorkoutName = tr.Workout.WorkoutName
                })
                .ToListAsync();
        }

        // GET: api/TrainerRoles/5/10
        [HttpGet("{trainerid}/{workoutid}")]
        public async Task<ActionResult<TrainerRole>> GetTrainerRole(int trainerid, int workoutid)
        {
            var trainerRole = await _context.TrainerRoles.FindAsync(trainerid, workoutid);

            if (trainerRole == null)
            {
                return NotFound();
            }

            return trainerRole;
        }

        // PUT: api/TrainerRoles/5/10
        [HttpPut("{trainerid}/{workoutid}")]
        public async Task<IActionResult> PutTrainerRole(int trainerid, int workoutid, TrainerRole trainerRole)
        {
            if (trainerid != trainerRole.TrainerId || workoutid != trainerRole.WorkoutId)
            {
                return BadRequest();
            }

            _context.Entry(trainerRole).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TrainerRoleExists(trainerid, workoutid))
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

        // POST: api/TrainerRoles
        [HttpPost]
        public async Task<ActionResult<TrainerRole>> PostTrainerRole(TrainerRole trainerRole)
        {
            _context.TrainerRoles.Add(trainerRole);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTrainerRole), new { trainerid = trainerRole.TrainerId, workoutid = trainerRole.WorkoutId }, trainerRole);
        }

        // DELETE: api/TrainerRoles/5/10
        [HttpDelete("{trainerid}/{workoutid}")]
        public async Task<IActionResult> DeleteTrainerRole(int trainerid, int workoutid)
        {
            var trainerRole = await _context.TrainerRoles.FindAsync(trainerid, workoutid);
            if (trainerRole == null)
            {
                return NotFound();
            }

            _context.TrainerRoles.Remove(trainerRole);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool TrainerRoleExists(int trainerid, int workoutid)
        {
            return _context.TrainerRoles.Any(e => e.TrainerId == trainerid && e.WorkoutId == workoutid);
        }
    }
}
