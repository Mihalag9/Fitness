using Microsoft.AspNetCore.Mvc;
using Fitness.Models;
using Fitness.Services;

[Route("api/[controller]")]
[ApiController]
public class ClientsController : ControllerBase
{
    private readonly ClientService _clientService;

    public ClientsController(ClientService clientService)
    {
        _clientService = clientService;
    }

    // GET: api/Clients?fullName=...&phone=...&birthDateFrom=...&birthDateTo=...
    [HttpGet]
    public async Task<ActionResult<object>> GetClients(
        [FromQuery] string? fullName,
        [FromQuery] string? phone,
        [FromQuery] DateOnly? birthDateFrom,
        [FromQuery] DateOnly? birthDateTo)
    {
        if (fullName?.Length > 50) return BadRequest(new { message = "ФИО не должно превышать 50 символов" });
        if (phone?.Length > 20) return BadRequest(new { message = "Телефон не должен превышать 20 символов" });

        var clients = await _clientService.GetAllAsync(fullName, phone, birthDateFrom, birthDateTo);
        var stats = await _clientService.GetStatisticsAsync();
        return Ok(new { Items = clients, Statistics = stats });
    }

    // GET: api/Clients/5
    [HttpGet("{clientid}")]
    public async Task<ActionResult<Client>> GetClient(int clientid)
    {
        var client = await _clientService.GetByIdAsync(clientid);

        if (client == null)
        {
            return NotFound();
        }

        return client;
    }

    // GET: api/Clients/statistics
    [HttpGet("statistics")]
    public async Task<ActionResult<ClientService.ClientStatistics>> GetStatistics()
    {
        var stats = await _clientService.GetStatisticsAsync();
        return Ok(stats);
    }

    // POST: api/Clients
    [HttpPost]
    public async Task<ActionResult> PostClient(Client client)
    {
        var (entity, message) = await _clientService.CreateAsync(client);
        if (entity == null) return BadRequest(new { message });
        return Ok(new { message, entity });
    }

    // PUT: api/Clients/5
    [HttpPut("{clientid}")]
    public async Task<IActionResult> PutClient(int clientid, Client client)
    {
        var (success, message) = await _clientService.UpdateAsync(clientid, client);
        if (!success) return BadRequest(new { message });
        return Ok(new { message });
    }

    // DELETE: api/Clients/5
    [HttpDelete("{clientid}")]
    public async Task<IActionResult> DeleteClient(int clientid)
    {
        var (success, message) = await _clientService.DeleteAsync(clientid);
        if (!success) return BadRequest(new { message });
        return Ok(new { message });
    }
}
