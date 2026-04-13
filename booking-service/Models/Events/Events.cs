using System;

namespace booking_service.Models.Events;

public class BookingPaymentRequestEvent
{
    public long BookingId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public long CourtId { get; set; }
    public string CourtName { get; set; } = string.Empty;
    public DateTime SlotStartTime { get; set; }
    public DateTime SlotEndTime { get; set; }
    public int DurationHours { get; set; }
    public decimal TotalPrice { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class BookingMatchDelegateEvent
{
    public long BookingId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public long CourtId { get; set; }
    public string CourtName { get; set; } = string.Empty;
    public long TimeSlotId { get; set; }
    public DateTime SlotStartTime { get; set; }
    public DateTime SlotEndTime { get; set; }
    public int DurationHours { get; set; }
    public decimal TotalPrice { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class PaymentStatusEvent
{
    public long BookingId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public bool IsPaid { get; set; }
    public string? FailureReason { get; set; }
    public decimal AmountPaid { get; set; }
    public DateTime ProcessedAt { get; set; }
}

public class MatchBookingPaidEvent
{
    public long BookingId { get; set; }
    public long MatchId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public bool IsPaid { get; set; }
    public decimal AmountPaid { get; set; }
    public DateTime ProcessedAt { get; set; }
}

public class BookingNotificationEvent
{
    public long BookingId { get; set; }
    public long UserId { get; set; }
    public string? CourtName { get; set; }
    public string Status { get; set; } = string.Empty;  // CONFIRMED, CANCELLED
    public string? Message { get; set; }
}
