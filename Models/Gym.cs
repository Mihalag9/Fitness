using System;
using System.Collections.Generic;

namespace Fitness.Models;

public partial class Gym
{
    public int GymId { get; set; }

    public string GymName { get; set; } = null!;

    public virtual ICollection<Inventory> Inventories { get; set; } = new List<Inventory>();

    public virtual ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();

    public virtual ICollection<GymAllowedWorkout> GymAllowedWorkouts { get; set; } = new List<GymAllowedWorkout>();
}
