using System;
using System.Collections.Generic;

namespace Fitness.Models;

public partial class Schedule
{
    public int ScheduleId { get; set; }

    public int? TrainerId { get; set; }

    public int WorkoutId { get; set; }

    public int GymId { get; set; }

    public int WorkoutTypeId { get; set; }

    public DateOnly WorkDate { get; set; }

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    public virtual Gym Gym { get; set; } = null!;

    public virtual Trainer? Trainer { get; set; }

    public virtual Workout Workout { get; set; } = null!;

    public virtual WorkoutType WorkoutType { get; set; } = null!;
}
