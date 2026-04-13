using booking_service.Config;
using booking_service.Messaging.Publishers;
using booking_service.Models.DTOs.Request;
using booking_service.Models.DTOs.Response;
using booking_service.Models.Entities;
using booking_service.Models.Events;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace booking_service.Services;

// ══════════════════════════════════════════════════════════════════════════════
//  COURT SERVICE
// ══════════════════════════════════════════════════════════════════════════════

public interface ICourtService
{
	Task<List<CourtResponse>> GetAllCourtsAsync();
	Task<CourtResponse?> GetCourtByIdAsync(long id);
	Task<CourtResponse> CreateCourtAsync(CreateCourtRequest req);
	Task<CourtResponse?> UpdateCourtAsync(long id, UpdateCourtRequest req);
	Task<bool> DeleteCourtAsync(long id);
}

public class CourtService : ICourtService
{
	private readonly BookingDbContext _db;
	public CourtService(BookingDbContext db) => _db = db;

	public async Task<List<CourtResponse>> GetAllCourtsAsync() =>
		await _db.Courts
			.Include(c => c.TimeSlots.Where(ts => !ts.IsBooked && ts.StartTime > DateTime.UtcNow))
			.Select(c => MapToResponse(c))
			.ToListAsync();

	public async Task<CourtResponse?> GetCourtByIdAsync(long id)
	{
		var court = await _db.Courts.Include(c => c.TimeSlots).FirstOrDefaultAsync(c => c.Id == id);
		return court is null ? null : MapToResponse(court);
	}

	public async Task<CourtResponse> CreateCourtAsync(CreateCourtRequest req)
	{
		var court = new Court
		{
			Name = req.Name,
			Description = req.Description,
			PricePerHour = req.PricePerHour,
			Surface = req.Surface,
			ImageUrl = req.ImageUrl,
			Location = req.Location,
			IsAvailable = true,
			CreatedAt = DateTime.UtcNow
		};
		_db.Courts.Add(court);
		await _db.SaveChangesAsync();
		return MapToResponse(court);
	}

	public async Task<CourtResponse?> UpdateCourtAsync(long id, UpdateCourtRequest req)
	{
		var court = await _db.Courts.FindAsync(id);
		if (court is null) return null;
		if (req.Name is not null) court.Name = req.Name;
		if (req.Description is not null) court.Description = req.Description;
		if (req.Surface is not null) court.Surface = req.Surface;
		if (req.ImageUrl is not null) court.ImageUrl = req.ImageUrl;
		if (req.Location is not null) court.Location = req.Location;
		if (req.PricePerHour.HasValue) court.PricePerHour = req.PricePerHour.Value;
		if (req.IsAvailable.HasValue) court.IsAvailable = req.IsAvailable.Value;
		await _db.SaveChangesAsync();
		return MapToResponse(court);
	}

	public async Task<bool> DeleteCourtAsync(long id)
	{
		var court = await _db.Courts.FindAsync(id);
		if (court is null) return false;
		_db.Courts.Remove(court);
		await _db.SaveChangesAsync();
		return true;
	}

	private static CourtResponse MapToResponse(Court c) => new()
	{
		Id = c.Id,
		Name = c.Name,
		Description = c.Description,
		PricePerHour = c.PricePerHour,
		Surface = c.Surface,
		ImageUrl = c.ImageUrl,
		Location = c.Location,
		IsAvailable = c.IsAvailable,
		TimeSlots = c.TimeSlots?.Select(ts => new TimeSlotResponse
		{
			Id = ts.Id,
			CourtId = ts.CourtId,
			StartTime = ts.StartTime,
			EndTime = ts.EndTime,
			IsBooked = ts.IsBooked
		}).ToList() ?? new()
	};
}

// ══════════════════════════════════════════════════════════════════════════════
//  SLOT SERVICE
// ══════════════════════════════════════════════════════════════════════════════

public interface ISlotService
{
	Task<TimeSlotResponse> CreateSlotAsync(CreateTimeSlotRequest req);
	Task<List<TimeSlotResponse>> GetSlotsByCourtAsync(long courtId);
	Task<bool> DeleteSlotAsync(long slotId);
}

public class SlotService : ISlotService
{
	private readonly BookingDbContext _db;
	public SlotService(BookingDbContext db) => _db = db;

	public async Task<TimeSlotResponse> CreateSlotAsync(CreateTimeSlotRequest req)
	{
		var slot = new TimeSlot
		{
			CourtId = req.CourtId,
			StartTime = req.StartTime,
			EndTime = req.EndTime,
			CreatedAt = DateTime.UtcNow
		};
		_db.TimeSlots.Add(slot);
		await _db.SaveChangesAsync();
		return MapToResponse(slot);
	}

	public async Task<List<TimeSlotResponse>> GetSlotsByCourtAsync(long courtId) =>
		await _db.TimeSlots
			.Where(ts => ts.CourtId == courtId && !ts.IsBooked && ts.StartTime > DateTime.UtcNow)
			.Select(ts => MapToResponse(ts))
			.ToListAsync();

	public async Task<bool> DeleteSlotAsync(long slotId)
	{
		var slot = await _db.TimeSlots.FindAsync(slotId);
		if (slot is null) return false;
		_db.TimeSlots.Remove(slot);
		await _db.SaveChangesAsync();
		return true;
	}

	private static TimeSlotResponse MapToResponse(TimeSlot ts) => new()
	{
		Id = ts.Id,
		CourtId = ts.CourtId,
		StartTime = ts.StartTime,
		EndTime = ts.EndTime,
		IsBooked = ts.IsBooked
	};
}

// ══════════════════════════════════════════════════════════════════════════════
//  BOOKING SERVICE
// ══════════════════════════════════════════════════════════════════════════════

public interface IBookingService
{
	Task<BookingResponse> CreateBookingAsync(string userId, CreateBookingRequest req);
	Task<List<BookingResponse>> GetMyBookingsAsync(string userId);
	Task<List<BookingResponse>> GetAllBookingsAsync();
	Task<(bool Found, bool Allowed, BookingResponse? Booking)> CancelBookingAsync(long bookingId, string userId);
}

public class BookingBusinessService : IBookingService
{
	private readonly BookingDbContext _db;
	private readonly IBookingEventPublisher _publisher;
	private readonly ILogger<BookingBusinessService> _logger;

	public BookingBusinessService(BookingDbContext db, IBookingEventPublisher publisher,
		ILogger<BookingBusinessService> logger)
	{ _db = db; _publisher = publisher; _logger = logger; }

	public async Task<BookingResponse> CreateBookingAsync(string userId, CreateBookingRequest req)
	{
		var court = await _db.Courts.FindAsync(req.CourtId)
			?? throw new InvalidOperationException("Terrain introuvable");
		if (!court.IsAvailable)
			throw new InvalidOperationException("Terrain non disponible");

		var slot = await _db.TimeSlots.FindAsync(req.TimeSlotId)
			?? throw new InvalidOperationException("Créneau introuvable");
		if (slot.IsBooked)
			throw new InvalidOperationException("Créneau déjà réservé");
		if (slot.CourtId != req.CourtId)
			throw new InvalidOperationException("Créneau invalide pour ce terrain");

		var totalPrice = court.PricePerHour * req.DurationHours;
		var booking = new Booking
		{
			UserId = userId,
			CourtId = req.CourtId,
			TimeSlotId = req.TimeSlotId,
			DurationHours = req.DurationHours,
			TotalPrice = totalPrice,
			Mode = req.Mode,
			Status = req.Mode == BookingMode.SIMPLE
				? BookingStatus.PENDING_PAYMENT
				: BookingStatus.PENDING_MATCH,
			CreatedAt = DateTime.UtcNow,
			UpdatedAt = DateTime.UtcNow
		};
		_db.Bookings.Add(booking);
		await _db.SaveChangesAsync();

		if (req.Mode == BookingMode.SIMPLE)
		{
			_publisher.PublishPaymentRequest(new BookingPaymentRequestEvent
			{
				BookingId = booking.Id,
				UserId = userId,
				CourtId = court.Id,
				CourtName = court.Name,
				SlotStartTime = slot.StartTime,
				SlotEndTime = slot.EndTime,
				DurationHours = req.DurationHours,
				TotalPrice = totalPrice
			});
		}
		else
		{
			_publisher.PublishMatchDelegate(new BookingMatchDelegateEvent
			{
				BookingId = booking.Id,
				UserId = userId,
				CourtId = court.Id,
				CourtName = court.Name,
				TimeSlotId = slot.Id,
				SlotStartTime = slot.StartTime,
				SlotEndTime = slot.EndTime,
				DurationHours = req.DurationHours,
				TotalPrice = totalPrice
			});
		}

		return MapToResponse(booking, court, slot);
	}

	public async Task<List<BookingResponse>> GetMyBookingsAsync(string userId) =>
		await _db.Bookings
			.Include(b => b.Court)
			.Include(b => b.TimeSlot)
			.Where(b => b.UserId == userId)
			.OrderByDescending(b => b.CreatedAt)
			.Select(b => MapToResponse(b, b.Court, b.TimeSlot))
			.ToListAsync();

	public async Task<List<BookingResponse>> GetAllBookingsAsync() =>
		await _db.Bookings
			.Include(b => b.Court)
			.Include(b => b.TimeSlot)
			.OrderByDescending(b => b.CreatedAt)
			.Select(b => MapToResponse(b, b.Court, b.TimeSlot))
			.ToListAsync();

	public async Task<(bool Found, bool Allowed, BookingResponse? Booking)> CancelBookingAsync(
		long bookingId, string userId)
	{
		var booking = await _db.Bookings
			.Include(b => b.Court)
			.Include(b => b.TimeSlot)
			.FirstOrDefaultAsync(b => b.Id == bookingId && b.UserId == userId);

		if (booking is null)
			return (Found: false, Allowed: false, Booking: null);

		var cancellable = new[] { BookingStatus.PENDING_PAYMENT, BookingStatus.PENDING_MATCH };
		if (!cancellable.Contains(booking.Status))
			return (Found: true, Allowed: false,
					Booking: MapToResponse(booking, booking.Court, booking.TimeSlot));

		var slot = await _db.TimeSlots.FindAsync(booking.TimeSlotId);
		if (slot is not null && slot.IsBooked)
			slot.IsBooked = false;

		booking.Status = BookingStatus.CANCELLED;
		booking.UpdatedAt = DateTime.UtcNow;
		await _db.SaveChangesAsync();

		_logger.LogInformation("[Booking] Annulé → id={Id}, userId={UserId}", booking.Id, userId);
		return (Found: true, Allowed: true,
				Booking: MapToResponse(booking, booking.Court, booking.TimeSlot));
	}

	private static BookingResponse MapToResponse(Booking b, Court c, TimeSlot ts) => new()
	{
		Id = b.Id,
		UserId = b.UserId,
		CourtId = b.CourtId,
		CourtName = c.Name,
		SlotStartTime = ts.StartTime,
		SlotEndTime = ts.EndTime,
		DurationHours = b.DurationHours,
		TotalPrice = b.TotalPrice,
		Status = b.Status.ToString(),
		Mode = b.Mode.ToString(),
		MatchId = b.MatchId,
		CreatedAt = b.CreatedAt
	};
}