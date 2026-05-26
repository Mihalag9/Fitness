using Fitness.Models;
using Microsoft.EntityFrameworkCore;

namespace Fitness.Services
{
    public class ClientService
    {
        private readonly FitnessContext _context;

        public ClientService(FitnessContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Client>> GetAllAsync(string? fullName, string? phone, DateOnly? birthDateFrom, DateOnly? birthDateTo)
        {
            IQueryable<Client> query = _context.Clients;

            if (!string.IsNullOrWhiteSpace(fullName))
            {
                query = query.Where(c => c.FullName.ToLower().Contains(fullName.ToLower()));
            }

            if (!string.IsNullOrWhiteSpace(phone))
            {
                query = query.Where(c => c.Phone != null && c.Phone.Contains(phone));
            }

            if (birthDateFrom.HasValue)
            {
                query = query.Where(c => c.BirthDate >= birthDateFrom.Value);
            }

            if (birthDateTo.HasValue)
            {
                query = query.Where(c => c.BirthDate <= birthDateTo.Value);
            }

            return await query.ToListAsync();
        }

        public async Task<Client?> GetByIdAsync(int id)
        {
            return await _context.Clients.FindAsync(id);
        }

        public async Task<Client> CreateAsync(Client client)
        {
            _context.Clients.Add(client);
            await _context.SaveChangesAsync();
            return client;
        }

        public async Task<bool> UpdateAsync(int id, Client client)
        {
            if (id != client.ClientId)
            {
                return false;
            }

            _context.Entry(client).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ClientExists(id))
                {
                    return false;
                }
                else
                {
                    throw;
                }
            }
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null)
            {
                return false;
            }

            _context.Clients.Remove(client);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<ClientStatistics> GetStatisticsAsync()
        {
            var totalClients = await _context.Clients.CountAsync();
            
            var activeAbonnements = await _context.Purchases
                .Where(p => p.Status == "активен")
                .Select(p => p.ClientId)
                .Distinct()
                .CountAsync();

            return new ClientStatistics
            {
                TotalClients = totalClients,
                ActiveAbonnements = activeAbonnements
            };
        }

        private bool ClientExists(int id)
        {
            return _context.Clients.Any(e => e.ClientId == id);
        }

        public class ClientStatistics
        {
            public int TotalClients { get; set; }
            public int ActiveAbonnements { get; set; }
        }
    }
}
