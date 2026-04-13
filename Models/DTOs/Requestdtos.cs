using System.ComponentModel.DataAnnotations;
using booking_service.Models.Entities;

namespace booking_service.Models.DTOs.Request;

// ─── Admin ────────────────────────────────────────────────────────────────────

public class CreateCourtRequest
{
    [Required] public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    [Required][Range(0.01, 10000)] public decimal PricePerHour { get; set; }
    public string? Surface { get; set; }
    public string? ImageUrl { get; set; }
    public string? Location { get; set; }
}

public class UpdateCourtRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    [Range(0.01, 10000)] public decimal? PricePerHour { get; set; }
    public string? Surface { get; set; }
    public string? ImageUrl { get; set; }
    public string? Location { get; set; }
    public bool? IsAvailable { get; set; }
}

public class CreateTimeSlotRequest
{
    [Required] public long CourtId { get; set; }
    [Required] public DateTime StartTime { get; set; }
    [Required] public DateTime EndTime { get; set; }
}

// ─── User ─────────────────────────────────────────────────────────────────────

public class CreateBookingRequest
{
    [Required] public long CourtId { get; set; }
    [Required] public long TimeSlotId { get; set; }
    [Required][Range(1, 8)] public int DurationHours { get; set; }
    [Required] public BookingMode Mode { get; set; }
}