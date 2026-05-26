using Fitness.Models;
using Microsoft.EntityFrameworkCore;

namespace Fitness.Services
{
    public class TrainerService
    {
        private readonly FitnessContext _context;

        public TrainerService(FitnessContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Trainer>> GetAllAsync(string? fullName, string? experienceSort, bool? noExperience)
        {
            IQueryable<Trainer> query = _context.Trainers;

            if (!string.IsNullOrWhiteSpace(fullName))
            {
                query = query.Where(t => t.FullName.ToLower().Contains(fullName.ToLower()));
            }

            if (noExperience == true)
            {
                query = query.Where(t => t.Experience == null || t.Experience == 0);
            }

            // Сортировка по стажу
            if (!string.IsNullOrWhiteSpace(experienceSort))
            {
                if (experienceSort.ToLower() == "desc")
                {
                    query = query.OrderByDescending(t => t.Experience)
                                 .ThenBy(t => t.FullName);
                }
                else if (experienceSort.ToLower() == "asc")
                {
                    query = query.OrderBy(t => t.Experience)
                                 .ThenBy(t => t.FullName);
                }
            }
            else
            {
                // По умолчанию сортируем по имени
                query = query.OrderBy(t => t.FullName);
            }

            return await query.ToListAsync();
        }

        public async Task<Trainer?> GetByIdAsync(int id)
        {
            return await _context.Trainers.FindAsync(id);
        }

        public async Task<Trainer> CreateAsync(Trainer trainer)
        {
            _context.Trainers.Add(trainer);
            await _context.SaveChangesAsync();
            return trainer;
        }

        public async Task<bool> UpdateAsync(int id, Trainer trainer)
        {
            if (id != trainer.TrainerId)
            {
                return false;
            }

            _context.Entry(trainer).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TrainerExists(id))
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
            var trainer = await _context.Trainers.FindAsync(id);
            if (trainer == null)
            {
                return false;
            }

            _context.Trainers.Remove(trainer);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<TrainerStatistics> GetStatisticsAsync()
        {
            var totalTrainers = await _context.Trainers.CountAsync();
            var trainersWithExperience = await _context.Trainers.CountAsync(t => t.Experience > 2);
            var trainersWithoutExperience = await _context.Trainers.CountAsync(t => t.Experience == null || t.Experience == 0);

            return new TrainerStatistics
            {
                TotalTrainers = totalTrainers,
                TrainersWithExperience = trainersWithExperience,
                TrainersWithoutExperience = trainersWithoutExperience
            };
        }

        private bool TrainerExists(int id)
        {
            return _context.Trainers.Any(e => e.TrainerId == id);
        }

        public class TrainerStatistics
        {
            public int TotalTrainers { get; set; }
            public int TrainersWithExperience { get; set; }
            public int TrainersWithoutExperience { get; set; }
        }
    }
}