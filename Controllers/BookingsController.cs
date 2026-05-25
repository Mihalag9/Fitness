using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fitness.Models;

namespace Fitness.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookingsController : ControllerBase
    {
        private readonly FitnessContext _context;

        public BookingsController(FitnessContext context)
        {
            _context = context;
        }

        // GET: api/Bookings
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Booking>>> GetBookings()
        {
            return await _context.Bookings.ToListAsync();
        }

        // GET: api/Bookings/5/10
        [HttpGet("{clientid}/{scheduleid}")]
        public async Task<ActionResult<Booking>> GetBooking(int clientid, int scheduleid)
        {
            var booking = await _context.Bookings.FindAsync(clientid, scheduleid);

            if (booking == null)
            {
                return NotFound();
            }

            return booking;
        }

        // PUT: api/Bookings/5/10
        [HttpPut("{clientid}/{scheduleid}")]
        public async Task<IActionResult> PutBooking(int clientid, int scheduleid, Booking booking)
        {
            if (clientid != booking.ClientId || scheduleid != booking.ScheduleId)
            {
                return BadRequest();
            }

            _context.Entry(booking).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BookingExists(clientid, scheduleid))
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

        // POST: api/Bookings
        [HttpPost]
        public async Task<ActionResult<Booking>> PostBooking(Booking booking)
        {
            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBooking),new { clientid = booking.ClientId, scheduleid = booking.ScheduleId }, booking);
        }

        // DELETE: api/Bookings/5/10
        [HttpDelete("{clientid}/{scheduleid}")]
        public async Task<IActionResult> DeleteBooking(int clientid, int scheduleid)
        {
            var booking = await _context.Bookings.FindAsync(clientid, scheduleid);
            if (booking == null)
            {
                return NotFound();
            }

            _context.Bookings.Remove(booking);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool BookingExists(int clientid, int scheduleid)
        {
            return _context.Bookings.Any(e => e.ClientId == clientid && e.ScheduleId == scheduleid);
        }
    }
}
