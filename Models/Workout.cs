using System;
using System.Collections.Generic;

namespace Fitness.Models;

public partial class Workout
{
    public int WorkoutId { get; set; }

    public string WorkoutName { get; set; } = null!;

    public int DurationMinutes { get; set; }

    public int MaxParticipants { get; set; }

    public virtual ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();

    public virtual ICollection<TrainerRole> TrainerRoles { get; set; } = new List<TrainerRole>();

    public virtual ICollection<GymAllowedWorkout> GymAllowedWorkouts { get; set; } = new List<GymAllowedWorkout>();
}
