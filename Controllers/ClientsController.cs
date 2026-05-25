using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Fitness.Models;

[Route("api/[controller]")]
[ApiController]
public class ClientsController : ControllerBase
{
    private readonly FitnessContext _context;
    public ClientsController(FitnessContext context)
    {
        _context = context;
    }

    // GET: api/Client
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Client>>> GetClient()
    {
        return await _context.Clients.ToListAsync();
    }

    // GET: api/Client/5
    [HttpGet("{clientid}")]
    public async Task<ActionResult<Client>> GetClient(int clientid)
    {
        var client = await _context.Clients.FindAsync(clientid);

        if (client == null)
        {
            return NotFound();
        }

        return client;
    }

    // PUT: api/Client/5
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPut("{clientid}")]
    public async Task<IActionResult> PutClient(int? clientid, Client client)
    {
        if (clientid != client.ClientId)
        {
            return BadRequest();
        }

        _context.Entry(client).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!ClientExists(clientid))
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

    // POST: api/Client
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPost]
    public async Task<ActionResult<Client>> PostClient(Client client)
    {
        _context.Clients.Add(client);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetClient", new { clientid = client.ClientId }, client);
    }

    // DELETE: api/Client/5
    [HttpDelete("{clientid}")]
    public async Task<IActionResult> DeleteClient(int? clientid)
    {
        var client = await _context.Clients.FindAsync(clientid);
        if (client == null)
        {
            return NotFound();
        }

        _context.Clients.Remove(client);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool ClientExists(int? clientid)
    {
        return _context.Clients.Any(e => e.ClientId == clientid);
    }
}
