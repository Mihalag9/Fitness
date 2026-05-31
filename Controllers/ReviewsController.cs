using Microsoft.AspNetCore.Mvc;
using Fitness.Models;
using Fitness.Services;

namespace Fitness.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly ReviewService _reviewService;

        public ReviewsController(ReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        // GET: api/Reviews
        [HttpGet]
        public async Task<ActionResult<object>> GetReviews(
            [FromQuery] string? clientName,
            [FromQuery] string? trainerName,
            [FromQuery] DateOnly? dateFrom,
            [FromQuery] DateOnly? dateTo,
            [FromQuery] string? ratingSort)
        {
            if (clientName?.Length > 50) return BadRequest(new { message = "Имя клиента не должно превышать 50 символов" });
            if (trainerName?.Length > 50) return BadRequest(new { message = "Имя тренера не должно превышать 50 символов" });

            var items = await _reviewService.GetAllAsync(clientName, trainerName, dateFrom, dateTo, ratingSort);
            var stats = await _reviewService.GetStatisticsAsync();
            return Ok(new { Items = items, Statistics = stats });
        }

        // GET: api/Reviews/page-data
        [HttpGet("page-data")]
        public async Task<ActionResult<object>> GetPageData(
            [FromQuery] string? clientName,
            [FromQuery] string? trainerName,
            [FromQuery] DateOnly? dateFrom,
            [FromQuery] DateOnly? dateTo,
            [FromQuery] string? ratingSort)
        {
            if (clientName?.Length > 50) return BadRequest(new { message = "Имя клиента не должно превышать 50 символов" });
            if (trainerName?.Length > 50) return BadRequest(new { message = "Имя тренера не должно превышать 50 символов" });

            var data = await _reviewService.GetPageDataAsync(clientName, trainerName, dateFrom, dateTo, ratingSort);
            return Ok(data);
        }

        // POST: api/Reviews
        [HttpPost]
        public async Task<IActionResult> PostReview([FromBody] ReviewCreateDto dto)
        {
            var (success, message) = await _reviewService.CreateAsync(dto.ClientId, dto.TrainerId, dto.ReviewText, dto.Rating);
            if (!success) return BadRequest(new { message });
            return Ok(new { message });
        }

        // PUT: api/Reviews
        [HttpPut]
        public async Task<IActionResult> PutReview([FromBody] ReviewUpdateDto dto)
        {
            var (success, message) = await _reviewService.UpdateAsync(dto.ClientId, dto.TrainerId, dto.ReviewText, dto.Rating);
            if (!success) return BadRequest(new { message });
            return Ok(new { message });
        }

        // DELETE: api/Reviews
        [HttpDelete]
        public async Task<IActionResult> DeleteReview([FromBody] ReviewDeleteDto dto)
        {
            var (success, message) = await _reviewService.DeleteAsync(dto.ClientId, dto.TrainerId);
            if (!success) return BadRequest(new { message });
            return Ok(new { message });
        }

        // GET: api/Reviews/clients
        [HttpGet("clients")]
        public async Task<ActionResult<IEnumerable<ReviewService.ClientView>>> GetClientsDictionary()
        {
            var clients = await _reviewService.GetClientsDictionaryAsync();
            return Ok(clients);
        }

        // GET: api/Reviews/trainers
        [HttpGet("trainers")]
        public async Task<ActionResult<IEnumerable<ReviewService.TrainerView>>> GetTrainersDictionary()
        {
            var trainers = await _reviewService.GetTrainersDictionaryAsync();
            return Ok(trainers);
        }
    }

    public class ReviewCreateDto
    {
        public int ClientId { get; set; }
        public int TrainerId { get; set; }
        public string? ReviewText { get; set; }
        public int Rating { get; set; }
    }

    public class ReviewUpdateDto
    {
        public int ClientId { get; set; }
        public int TrainerId { get; set; }
        public string? ReviewText { get; set; }
        public int Rating { get; set; }
    }

    public class ReviewDeleteDto
    {
        public int ClientId { get; set; }
        public int TrainerId { get; set; }
    }
}
