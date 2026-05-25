using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace Fitness.Models;

public partial class FitnessContext : DbContext
{
    public FitnessContext()
    {
    }

    public FitnessContext(DbContextOptions<FitnessContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Abonnement> Abonnements { get; set; }

    public virtual DbSet<Booking> Bookings { get; set; }

    public virtual DbSet<Client> Clients { get; set; }

    public virtual DbSet<Equipment> Equipment { get; set; }

    public virtual DbSet<Gym> Gyms { get; set; }

    public virtual DbSet<Inventory> Inventories { get; set; }

    public virtual DbSet<Purchase> Purchases { get; set; }

    public virtual DbSet<Review> Reviews { get; set; }

    public virtual DbSet<Schedule> Schedules { get; set; }

    public virtual DbSet<Trainer> Trainers { get; set; }

    public virtual DbSet<TrainerRole> TrainerRoles { get; set; }

    public virtual DbSet<Workout> Workouts { get; set; }

    public virtual DbSet<WorkoutType> WorkoutTypes { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=Fitness;Username=postgres;Password=123");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Abonnement>(entity =>
        {
            entity.HasKey(e => e.AbonnementId).HasName("Abonnement_pkey");

            entity.ToTable("Abonnement");

            entity.Property(e => e.AbonnementType).HasMaxLength(100);
            entity.Property(e => e.AccessEndTime).HasDefaultValueSql("'23:00:00'::time without time zone");
            entity.Property(e => e.AccessStartTime).HasDefaultValueSql("'08:00:00'::time without time zone");
            entity.Property(e => e.Price).HasPrecision(10, 2);
            entity.Property(e => e.WeekdayAccess).HasDefaultValue(true);
            entity.Property(e => e.WeekendAccess).HasDefaultValue(true);
        });

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(e => new { e.ClientId, e.ScheduleId }).HasName("Booking_pkey");

            entity.ToTable("Booking");

            entity.Property(e => e.Attended).HasDefaultValue(false);
            entity.Property(e => e.BookedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone");

            entity.HasOne(d => d.Client).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.ClientId)
                .HasConstraintName("Booking_ClientId_fkey");

            entity.HasOne(d => d.Schedule).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.ScheduleId)
                .HasConstraintName("Booking_ScheduleId_fkey");
        });

        modelBuilder.Entity<Client>(entity =>
        {
            entity.HasKey(e => e.ClientId).HasName("Client_pkey");

            entity.ToTable("Client");

            entity.Property(e => e.FullName).HasMaxLength(200);
            entity.Property(e => e.Phone).HasMaxLength(20);
        });

        modelBuilder.Entity<Equipment>(entity =>
        {
            entity.HasKey(e => e.EquipmentId).HasName("Equipment_pkey");

            entity.Property(e => e.Brand).HasMaxLength(100);
            entity.Property(e => e.EquipmentName).HasMaxLength(100);
            entity.Property(e => e.Model).HasMaxLength(100);
        });

        modelBuilder.Entity<Gym>(entity =>
        {
            entity.HasKey(e => e.GymId).HasName("Gym_pkey");

            entity.ToTable("Gym");

            entity.Property(e => e.GymName).HasMaxLength(100);
        });

        modelBuilder.Entity<Inventory>(entity =>
        {
            entity.HasKey(e => new { e.EquipmentId, e.GymId }).HasName("Inventory_pkey");

            entity.ToTable("Inventory");

            entity.Property(e => e.Quantity).HasDefaultValue(1);

            entity.HasOne(d => d.Equipment).WithMany(p => p.Inventories)
                .HasForeignKey(d => d.EquipmentId)
                .HasConstraintName("Inventory_EquipmentId_fkey");

            entity.HasOne(d => d.Gym).WithMany(p => p.Inventories)
                .HasForeignKey(d => d.GymId)
                .HasConstraintName("Inventory_GymId_fkey");
        });

        modelBuilder.Entity<Purchase>(entity =>
        {
            entity.HasKey(e => new { e.ClientId, e.AbonnementId, e.PurchaseDate }).HasName("Purchase_pkey");

            entity.ToTable("Purchase");

            entity.Property(e => e.PurchaseDate).HasDefaultValueSql("CURRENT_DATE");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'активен'::character varying");

            entity.HasOne(d => d.Abonnement).WithMany(p => p.Purchases)
                .HasForeignKey(d => d.AbonnementId)
                .HasConstraintName("Purchase_AbonnementId_fkey");

            entity.HasOne(d => d.Client).WithMany(p => p.Purchases)
                .HasForeignKey(d => d.ClientId)
                .HasConstraintName("Purchase_ClientId_fkey");
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => new { e.ClientId, e.TrainerId }).HasName("Review_pkey");

            entity.ToTable("Review");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone");

            entity.HasOne(d => d.Client).WithMany(p => p.Reviews)
                .HasForeignKey(d => d.ClientId)
                .HasConstraintName("Review_ClientId_fkey");

            entity.HasOne(d => d.Trainer).WithMany(p => p.Reviews)
                .HasForeignKey(d => d.TrainerId)
                .HasConstraintName("Review_TrainerId_fkey");
        });

        modelBuilder.Entity<Schedule>(entity =>
        {
            entity.HasKey(e => e.ScheduleId).HasName("Schedule_pkey");

            entity.ToTable("Schedule");

            entity.HasOne(d => d.Gym).WithMany(p => p.Schedules)
                .HasForeignKey(d => d.GymId)
                .HasConstraintName("Schedule_GymId_fkey");

            entity.HasOne(d => d.Trainer).WithMany(p => p.Schedules)
                .HasForeignKey(d => d.TrainerId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("Schedule_TrainerId_fkey");

            entity.HasOne(d => d.Workout).WithMany(p => p.Schedules)
                .HasForeignKey(d => d.WorkoutId)
                .HasConstraintName("Schedule_WorkoutId_fkey");

            entity.HasOne(d => d.WorkoutType).WithMany(p => p.Schedules)
                .HasForeignKey(d => d.WorkoutTypeId)
                .HasConstraintName("Schedule_WorkoutTypeId_fkey");
        });

        modelBuilder.Entity<Trainer>(entity =>
        {
            entity.HasKey(e => e.TrainerId).HasName("Trainer_pkey");

            entity.ToTable("Trainer");

            entity.Property(e => e.FullName).HasMaxLength(200);
        });

        modelBuilder.Entity<TrainerRole>(entity =>
        {
            entity.HasKey(e => new { e.TrainerId, e.WorkoutId }).HasName("TrainerRole_pkey");

            entity.ToTable("TrainerRole");

            entity.Property(e => e.TRole)
                .HasMaxLength(100)
                .HasDefaultValueSql("'стажер'::character varying");

            entity.HasOne(d => d.Trainer).WithMany(p => p.TrainerRoles)
                .HasForeignKey(d => d.TrainerId)
                .HasConstraintName("TrainerRole_TrainerId_fkey");

            entity.HasOne(d => d.Workout).WithMany(p => p.TrainerRoles)
                .HasForeignKey(d => d.WorkoutId)
                .HasConstraintName("TrainerRole_WorkoutId_fkey");
        });

        modelBuilder.Entity<Workout>(entity =>
        {
            entity.HasKey(e => e.WorkoutId).HasName("Workout_pkey");

            entity.ToTable("Workout");

            entity.Property(e => e.WorkoutName).HasMaxLength(200);
        });

        modelBuilder.Entity<WorkoutType>(entity =>
        {
            entity.HasKey(e => e.WorkoutTypeId).HasName("WorkoutType_pkey");

            entity.ToTable("WorkoutType");

            entity.HasIndex(e => e.TypeName, "WorkoutType_TypeName_key").IsUnique();

            entity.Property(e => e.TypeName).HasMaxLength(100);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
