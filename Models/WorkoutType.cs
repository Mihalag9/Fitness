using System;
using System.Collections.Generic;

namespace Fitness.Models;

public partial class WorkoutType
{
    public int WorkoutTypeId { get; set; }

    public string TypeName { get; set; } = null!;

    public virtual ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
}
