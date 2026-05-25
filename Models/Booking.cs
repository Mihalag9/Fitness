using System;
using System.Collections.Generic;

namespace Fitness.Models;

public partial class Booking
{
    public int ClientId { get; set; }

    public int ScheduleId { get; set; }

    public DateTime BookedAt { get; set; }

    public bool? Attended { get; set; }

    public virtual Client Client { get; set; } = null!;

    public virtual Schedule Schedule { get; set; } = null!;
}
