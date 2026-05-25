using System;
using System.Collections.Generic;

namespace Fitness.Models;

public partial class Inventory
{
    public int EquipmentId { get; set; }

    public int GymId { get; set; }

    public int Quantity { get; set; }

    public virtual Equipment Equipment { get; set; } = null!;

    public virtual Gym Gym { get; set; } = null!;
}
