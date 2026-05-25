using System;
using System.Collections.Generic;

namespace Fitness.Models;

public partial class Abonnement
{
    public int AbonnementId { get; set; }

    public string AbonnementType { get; set; } = null!;

    public decimal Price { get; set; }

    public int DurationMonths { get; set; }

    public TimeOnly AccessStartTime { get; set; }

    public TimeOnly AccessEndTime { get; set; }

    public bool WeekdayAccess { get; set; }

    public bool WeekendAccess { get; set; }

    public virtual ICollection<Purchase> Purchases { get; set; } = new List<Purchase>();
}
