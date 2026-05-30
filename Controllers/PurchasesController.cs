using Microsoft.AspNetCore.Mvc;
using Fitness.Models;
using Fitness.Services;

namespace Fitness.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PurchasesController : ControllerBase
    {
        private readonly PurchaseService _purchaseService;

        public PurchasesController(PurchaseService purchaseService)
        {
            _purchaseService = purchaseService;
        }

        // GET: api/Purchases
        [HttpGet]
        public async Task<ActionResult<object>> GetPurchases(
            [FromQuery] string? clientName,
            [FromQuery] string? abonnementType,
            [FromQuery] string? status,
            [FromQuery] DateOnly? dateFrom,
            [FromQuery] DateOnly? dateTo)
        {
            if (clientName?.Length > 50) return BadRequest(new { message = "Имя клиента не должно превышать 50 символов" });
            if (abonnementType?.Length > 50) return BadRequest(new { message = "Название абонемента не должно превышать 50 символов" });

            var items = await _purchaseService.GetAllAsync(clientName, abonnementType, status, dateFrom, dateTo);
            var stats = await _purchaseService.GetStatisticsAsync();
            return Ok(new { Items = items, Statistics = stats });
        }

        // POST: api/Purchases
        [HttpPost]
        public async Task<IActionResult> PostPurchase([FromBody] PurchaseCreateDto dto)
        {
            var (success, error) = await _purchaseService.CreateAsync(dto.ClientId, dto.AbonnementId, dto.PurchaseDate);
            if (error != null) return BadRequest(new { message = error });
            return Ok();
        }

        // PUT: api/Purchases
        [HttpPut]
        public async Task<IActionResult> PutPurchase([FromBody] PurchaseUpdateDto dto)
        {
            var (success, error) = await _purchaseService.UpdateAsync(dto.ClientId, dto.AbonnementId, dto.PurchaseDate, dto.Status);
            if (error != null) return BadRequest(new { message = error });
            if (!success) return NotFound();
            return NoContent();
        }

        // DELETE: api/Purchases
        [HttpDelete]
        public async Task<IActionResult> DeletePurchase([FromBody] PurchaseDeleteDto dto)
        {
            var (success, error) = await _purchaseService.DeleteAsync(dto.ClientId, dto.AbonnementId, dto.PurchaseDate);
            if (error != null) return BadRequest(new { message = error });
            if (!success) return NotFound();
            return NoContent();
        }

        // GET: api/Purchases/clients
        [HttpGet("clients")]
        public async Task<ActionResult<IEnumerable<PurchaseService.ClientView>>> GetClientsDictionary()
        {
            var clients = await _purchaseService.GetClientsDictionaryAsync();
            return Ok(clients);
        }

        // GET: api/Purchases/abonnements
        [HttpGet("abonnements")]
        public async Task<ActionResult<IEnumerable<PurchaseService.AbonnementView>>> GetAbonnementsDictionary()
        {
            var abonnements = await _purchaseService.GetAbonnementsDictionaryAsync();
            return Ok(abonnements);
        }
    }

    public class PurchaseCreateDto
    {
        public int ClientId { get; set; }
        public int AbonnementId { get; set; }
        public DateOnly PurchaseDate { get; set; }
    }

    public class PurchaseUpdateDto
    {
        public int ClientId { get; set; }
        public int AbonnementId { get; set; }
        public DateOnly PurchaseDate { get; set; }
        public string Status { get; set; } = null!;
    }

    public class PurchaseDeleteDto
    {
        public int ClientId { get; set; }
        public int AbonnementId { get; set; }
        public DateOnly PurchaseDate { get; set; }
    }
}
