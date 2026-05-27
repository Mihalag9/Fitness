using Microsoft.AspNetCore.Mvc;
using Fitness.Models;
using Fitness.Services;

namespace Fitness.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TrainerRolesController : ControllerBase
    {
        private readonly TrainerService _trainerService;

        public TrainerRolesController(TrainerService trainerService)
        {
            _trainerService = trainerService;
        }

        // GET: api/TrainerRoles
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TrainerRole>>> GetTrainerRoles()
        {
            var roles = await _trainerService.GetAllRolesAsync();
            return Ok(roles);
        }
    }
}
