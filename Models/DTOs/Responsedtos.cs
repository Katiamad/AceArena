namespace booking_service.Models.DTOs.Response;

public class CourtResponse
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal PricePerHour { get; set; }
    public string? Surface { get; set; }
    public string? ImageUrl { get; set; }
    public string? Location { get; set; }
    public bool IsAvailable { get; set; }
    public List<TimeSlotResponse> TimeSlots { get; set; } = new();
}

public class TimeSlotResponse
{
    public long Id { get; set; }
    public long CourtId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public bool IsBooked { get; set; }
}

public class BookingResponse
{
    public long Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public long CourtId { get; set; }
    public string CourtName { get; set; } = string.Empty;
    public DateTime SlotStartTime { get; set; }
    public DateTime SlotEndTime { get; set; }
    public int DurationHours { get; set; }
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Mode { get; set; } = string.Empty;
    public long? MatchId { get; set; }
    public DateTime CreatedAt { get; set; }
}