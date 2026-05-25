using System;
using System.Collections.Generic;

namespace Fitness.Models;

public partial class Review
{
    public int ClientId { get; set; }

    public int TrainerId { get; set; }

    public DateTime CreatedAt { get; set; }

    public string? ReviewText { get; set; }

    public int? Rating { get; set; }

    public virtual Client Client { get; set; } = null!;

    public virtual Trainer Trainer { get; set; } = null!;
}
