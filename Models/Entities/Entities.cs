using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace booking_service.Models.Entities;

public enum BookingStatus
{
    PENDING_PAYMENT,
    PENDING_MATCH,
    CONFIRMED,
    MATCH_WAITING_PLAYERS,
    CANCELLED
}

public enum BookingMode
{
    SIMPLE,
    MATCH
}

// ─── Court ────────────────────────────────────────────────────────────────────
[Table("courts")]
public class Court
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Required]
    [Column("price_per_hour")]
    public decimal PricePerHour { get; set; }

    [Column("surface")]
    public string? Surface { get; set; }

    [Column("image_url")]
    public string? ImageUrl { get; set; }

    [Column("location")]
    public string? Location { get; set; }

    [Column("is_available")]
    public bool IsAvailable { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TimeSlot> TimeSlots { get; set; } = new List<TimeSlot>();
}

// ─── TimeSlot ─────────────────────────────────────────────────────────────────
[Table("time_slots")]
public class TimeSlot
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [ForeignKey("Court")]
    [Column("court_id")]
    public long CourtId { get; set; }

    public Court Court { get; set; } = null!;

    [Required]
    [Column("start_time")]
    public DateTime StartTime { get; set; }

    [Required]
    [Column("end_time")]
    public DateTime EndTime { get; set; }

    [Column("is_booked")]
    public bool IsBooked { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// ─── Booking ──────────────────────────────────────────────────────────────────
[Table("bookings")]
public class Booking
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("user_id")]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [ForeignKey("Court")]
    [Column("court_id")]
    public long CourtId { get; set; }

    public Court Court { get; set; } = null!;

    [Required]
    [ForeignKey("TimeSlot")]
    [Column("time_slot_id")]
    public long TimeSlotId { get; set; }

    public TimeSlot TimeSlot { get; set; } = null!;

    [Required]
    [Column("duration_hours")]
    public int DurationHours { get; set; }

    [Required]
    [Column("total_price")]
    public decimal TotalPrice { get; set; }

    [Required]
    [Column("status")]
    public BookingStatus Status { get; set; } = BookingStatus.PENDING_PAYMENT;

    [Required]
    [Column("mode")]
    public BookingMode Mode { get; set; } = BookingMode.SIMPLE;

    [Column("match_id")]
    public long? MatchId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}