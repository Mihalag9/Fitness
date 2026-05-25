using System;
using System.Collections.Generic;

namespace Fitness.Models;

public partial class TrainerRole
{
    public int TrainerId { get; set; }

    public int WorkoutId { get; set; }

    public string TRole { get; set; } = null!;

    public virtual Trainer Trainer { get; set; } = null!;

    public virtual Workout Workout { get; set; } = null!;
}
