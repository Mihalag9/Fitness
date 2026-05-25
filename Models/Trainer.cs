using System;
using System.Collections.Generic;

namespace Fitness.Models;

public partial class Trainer
{
    public int TrainerId { get; set; }

    public string FullName { get; set; } = null!;

    public int? Experience { get; set; }

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();

    public virtual ICollection<TrainerRole> TrainerRoles { get; set; } = new List<TrainerRole>();
}
