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
    public async Task<ActionResult<Client>> PostClient(Client client)
    {
        var createdClient = await _clientService.CreateAsync(client);
        return CreatedAtAction(nameof(GetClient), new { clientid = createdClient.ClientId }, createdClient);
    }

    // PUT: api/Clients/5
    [HttpPut("{clientid}")]
    public async Task<IActionResult> PutClient(int clientid, Client client)
    {
        var success = await _clientService.UpdateAsync(clientid, client);

        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }

    // DELETE: api/Clients/5
    [HttpDelete("{clientid}")]
    public async Task<IActionResult> DeleteClient(int clientid)
    {
        var success = await _clientService.DeleteAsync(clientid);

        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }
}
