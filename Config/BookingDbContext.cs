using Microsoft.EntityFrameworkCore;
using booking_service.Models.Entities;

namespace booking_service.Config;

public class BookingDbContext : DbContext
{
    public BookingDbContext(DbContextOptions<BookingDbContext> options) : base(options) { }

    public DbSet<Court> Courts => Set<Court>();
    public DbSet<TimeSlot> TimeSlots => Set<TimeSlot>();
    public DbSet<Booking> Bookings => Set<Booking>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. Court - FORCER LE NOM DE TABLE "courts"
        modelBuilder.Entity<Court>(e =>
        {
            e.ToTable("courts"); // <--- AJOUTE CECI
            e.HasKey(c => c.Id);
            e.Property(c => c.PricePerHour).HasPrecision(10, 2);
            e.HasMany(c => c.TimeSlots)
             .WithOne(ts => ts.Court)
             .HasForeignKey(ts => ts.CourtId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // 2. TimeSlot - FORCER LE NOM DE TABLE "time_slots"
        modelBuilder.Entity<TimeSlot>(e =>
        {
            e.ToTable("time_slots"); // <--- AJOUTE CECI
            e.HasKey(ts => ts.Id);
        });

        // 3. Booking - FORCER LE NOM DE TABLE "bookings"
        modelBuilder.Entity<Booking>(e =>
        {
            e.ToTable("bookings"); // <--- AJOUTE CECI
            e.HasKey(b => b.Id);
            e.Property(b => b.TotalPrice).HasPrecision(10, 2);
            e.Property(b => b.Status).HasConversion<string>();
            e.Property(b => b.Mode).HasConversion<string>();
        });
    }
}