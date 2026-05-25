using Fitness.Models;
using Microsoft.EntityFrameworkCore;

namespace Fitness.Services
{
    public class AbonnementService
    {
        private readonly FitnessContext _context;

        public AbonnementService(FitnessContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Abonnement>> GetAllAsync(
            string? abonnementType,
            bool? weekdayAccess,
            bool? weekendAccess,
            decimal? priceMin,
            decimal? priceMax,
            string? sortField,
            string? sortDirection)
        {
            IQueryable<Abonnement> query = _context.Abonnements;

            // Фильтр по названию
            if (!string.IsNullOrWhiteSpace(abonnementType))
            {
                query = query.Where(a => a.AbonnementType.ToLower().Contains(abonnementType.ToLower()));
            }

            // Фильтр по доступу в будни
            if (weekdayAccess.HasValue)
            {
                query = query.Where(a => a.WeekdayAccess == weekdayAccess.Value);
            }

            // Фильтр по доступу на выходные
            if (weekendAccess.HasValue)
            {
                query = query.Where(a => a.WeekendAccess == weekendAccess.Value);
            }

            // Фильтр по минимальной цене
            if (priceMin.HasValue)
            {
                query = query.Where(a => a.Price >= priceMin.Value);
            }

            // Фильтр по максимальной цене
            if (priceMax.HasValue)
            {
                query = query.Where(a => a.Price <= priceMax.Value);
            }

            // Сортировка
            if (!string.IsNullOrWhiteSpace(sortField))
            {
                bool isDesc = !string.IsNullOrWhiteSpace(sortDirection) && sortDirection.ToLower() == "desc";

                switch (sortField.ToLower())
                {
                    case "price":
                        query = isDesc ? query.OrderByDescending(a => a.Price) : query.OrderBy(a => a.Price);
                        break;
                    case "duration":
                        query = isDesc ? query.OrderByDescending(a => a.DurationMonths) : query.OrderBy(a => a.DurationMonths);
                        break;
                    default:
                        query = query.OrderBy(a => a.AbonnementType);
                        break;
                }
            }
            else
            {
                query = query.OrderBy(a => a.AbonnementType);
            }

            return await query.ToListAsync();
        }

        public async Task<Abonnement?> GetByIdAsync(int id)
        {
            return await _context.Abonnements.FindAsync(id);
        }

        public async Task<Abonnement> CreateAsync(Abonnement abonnement)
        {
            _context.Abonnements.Add(abonnement);
            await _context.SaveChangesAsync();
            return abonnement;
        }

        public async Task<bool> UpdateAsync(int id, Abonnement abonnement)
        {
            if (id != abonnement.AbonnementId)
            {
                return false;
            }

            _context.Entry(abonnement).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AbonnementExists(id))
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
            var abonnement = await _context.Abonnements.FindAsync(id);
            if (abonnement == null)
            {
                return false;
            }

            _context.Abonnements.Remove(abonnement);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<AbonnementStatistics> GetStatisticsAsync()
        {
            var totalAbonnements = await _context.Abonnements.CountAsync();
            var totalRevenue = await _context.Abonnements.SumAsync(a => a.Price);
            var averageDuration = await _context.Abonnements.AverageAsync(a => (double?)a.DurationMonths) ?? 0;

            return new AbonnementStatistics
            {
                TotalAbonnements = totalAbonnements,
                TotalRevenue = totalRevenue,
                AverageDuration = Math.Round(averageDuration, 2)
            };
        }

        private bool AbonnementExists(int id)
        {
            return _context.Abonnements.Any(e => e.AbonnementId == id);
        }

        public class AbonnementStatistics
        {
            public int TotalAbonnements { get; set; }
            public decimal TotalRevenue { get; set; }
            public double AverageDuration { get; set; }
        }
    }
}