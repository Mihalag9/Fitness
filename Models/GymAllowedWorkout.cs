using System;
using System.Collections.Generic;

namespace Fitness.Models;

public partial class GymAllowedWorkout
{
    public int GymId { get; set; }

    public int WorkoutId { get; set; }

    public virtual Gym Gym { get; set; } = null!;

    public virtual Workout Workout { get; set; } = null!;
}
