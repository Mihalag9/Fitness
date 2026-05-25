using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fitness.Models;

namespace Fitness.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PurchasesController : ControllerBase
    {
        private readonly FitnessContext _context;

        public PurchasesController(FitnessContext context)
        {
            _context = context;
        }

        // GET: api/Purchases
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Purchase>>> GetPurchases()
        {
            return await _context.Purchases.ToListAsync();
        }

        // GET: api/Purchases/5/10/2024-01-15
        [HttpGet("{clientid}/{abonnementid}/{purchasedate:date}")]
        public async Task<ActionResult<Purchase>> GetPurchase(int clientid, int abonnementid, DateOnly purchasedate)
        {
            var purchase = await _context.Purchases.FindAsync(clientid, abonnementid, purchasedate);

            if (purchase == null)
            {
                return NotFound();
            }

            return purchase;
        }

        // PUT: api/Purchases/5/10/2024-01-15
        [HttpPut("{clientid}/{abonnementid}/{purchasedate:date}")]
        public async Task<IActionResult> PutPurchase(int clientid, int abonnementid, DateOnly purchasedate, Purchase purchase)
        {
            if (clientid != purchase.ClientId || abonnementid != purchase.AbonnementId || purchasedate != purchase.PurchaseDate)
            {
                return BadRequest();
            }

            _context.Entry(purchase).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PurchaseExists(clientid, abonnementid, purchasedate))
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

        // POST: api/Purchases
        [HttpPost]
        public async Task<ActionResult<Purchase>> PostPurchase(Purchase purchase)
        {
            _context.Purchases.Add(purchase);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPurchase),new { clientid = purchase.ClientId, abonnementid = purchase.AbonnementId, purchasedate = purchase.PurchaseDate }, purchase);
        }

        // DELETE: api/Purchases/5/10/2024-01-15
        [HttpDelete("{clientid}/{abonnementid}/{purchasedate:date}")]
        public async Task<IActionResult> DeletePurchase(int clientid, int abonnementid, DateOnly purchasedate)
        {
            var purchase = await _context.Purchases.FindAsync(clientid, abonnementid, purchasedate);
            if (purchase == null)
            {
                return NotFound();
            }

            _context.Purchases.Remove(purchase);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PurchaseExists(int clientid, int abonnementid, DateOnly purchasedate)
        {
            return _context.Purchases.Any(e => e.ClientId == clientid && e.AbonnementId == abonnementid && e.PurchaseDate == purchasedate);
        }
    }
}
