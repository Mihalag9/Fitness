using System;
using System.Collections.Generic;

namespace Fitness.Models;

public partial class Purchase
{
    public int ClientId { get; set; }

    public int AbonnementId { get; set; }

    public DateOnly PurchaseDate { get; set; }

    public DateOnly ExpiryDate { get; set; }

    public string? Status { get; set; }

    public virtual Abonnement Abonnement { get; set; } = null!;

    public virtual Client Client { get; set; } = null!;
}
