using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fitness.Models;

namespace Fitness.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly FitnessContext _context;

        public ReviewsController(FitnessContext context)
        {
            _context = context;
        }

        // GET: api/Reviews
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Review>>> GetReviews()
        {
            return await _context.Reviews.ToListAsync();
        }

        // GET: api/Reviews/5/10
        [HttpGet("{clientid}/{trainerid}")]
        public async Task<ActionResult<Review>> GetReview(int clientid, int trainerid)
        {
            var review = await _context.Reviews.FindAsync(clientid, trainerid);

            if (review == null)
            {
                return NotFound();
            }

            return review;
        }

        // PUT: api/Reviews/5/10
        [HttpPut("{clientid}/{trainerid}")]
        public async Task<IActionResult> PutReview(int clientid, int trainerid, Review review)
        {
            if (clientid != review.ClientId || trainerid != review.TrainerId)
            {
                return BadRequest();
            }

            _context.Entry(review).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ReviewExists(clientid, trainerid))
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

        // POST: api/Reviews
        [HttpPost]
        public async Task<ActionResult<Review>> PostReview(Review review)
        {
            _context.Reviews.Add(review);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return BadRequest(new { message = "Отзыв от этого клиента этому тренеру уже существует" });
            }

            return CreatedAtAction(nameof(GetReview), new { clientid = review.ClientId, trainerid = review.TrainerId }, review);
        }

        // DELETE: api/Reviews/5/10
        [HttpDelete("{clientid}/{trainerid}")]
        public async Task<IActionResult> DeleteReview(int clientid, int trainerid)
        {
            var review = await _context.Reviews.FindAsync(clientid, trainerid);
            if (review == null)
            {
                return NotFound();
            }

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ReviewExists(int clientid, int trainerid)
        {
            return _context.Reviews.Any(e => e.ClientId == clientid && e.TrainerId == trainerid);
        }
    }
}
