using booking_service.Models.DTOs.Request;
using booking_service.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace booking_service.Controllers;

/// <summary>
/// Controller USER
/// Routes exposées : /api/user/**
/// Nécessite n'importe quel JWT valide (USER ou ADMIN)
/// </summary>
[ApiController]
[Route("api/user")]
[Authorize] // scope USER ou ADMIN — tout JWT valide
public class UserController : ControllerBase
{
    private readonly ICourtService _courtService;
    private readonly IBookingService _bookingService;

    public UserController(ICourtService courtService, IBookingService bookingService)
    {
        _courtService = courtService;
        _bookingService = bookingService;
    }

    // ─── Helper : récupérer l'userId depuis le JWT ─────────────────────────────
    private string GetUserId()
    {
        // Le claim "sub" contient l'id utilisateur (défini par auth-service)
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("UserId introuvable dans le token");
    }

    // ─── Terrains disponibles ──────────────────────────────────────────────────

    /// <summary>
    /// GET /api/user/courts
    /// Retourne tous les terrains disponibles avec leurs créneaux libres
    /// </summary>
    [HttpGet("courts")]
    public async Task<IActionResult> GetAvailableCourts()
    {
        var courts = await _courtService.GetAllCourtsAsync();
        // Filtre uniquement les terrains disponibles
        var available = courts.Where(c => c.IsAvailable).ToList();
        return Ok(available);
    }

    /// <summary>
    /// GET /api/user/courts/{id}
    /// Détail d'un terrain avec ses créneaux disponibles
    /// </summary>
    [HttpGet("courts/{id:long}")]
    public async Task<IActionResult> GetCourtById(long id)
    {
        var court = await _courtService.GetCourtByIdAsync(id);
        if (court is null || !court.IsAvailable) return NotFound();
        return Ok(court);
    }

    // ─── Réservations ──────────────────────────────────────────────────────────

    /// <summary>
    /// POST /api/user/bookings
    /// Créer une réservation :
    ///   - Mode SIMPLE → event → Payment Service
    ///   - Mode MATCH  → event → Match Service (qui gère ensuite le paiement)
    /// Body: { courtId, timeSlotId, durationHours, mode: "SIMPLE"|"MATCH" }
    /// </summary>
    [HttpPost("bookings")]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var userId = GetUserId();
            var booking = await _bookingService.CreateBookingAsync(userId, req);
            return Created($"/api/user/bookings/{booking.Id}", booking);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/user/bookings/me
    /// Mes réservations (filtrées par userId du JWT)
    /// </summary>
    [HttpGet("bookings/me")]
    public async Task<IActionResult> GetMyBookings()
    {
        var userId = GetUserId();
        var bookings = await _bookingService.GetMyBookingsAsync(userId);
        return Ok(bookings);
    }

    /// <summary>
    /// DELETE /api/user/bookings/{id}
    /// Annuler sa propre réservation.
    /// Autorisé uniquement si statut = PENDING_PAYMENT ou PENDING_MATCH.
    /// 204 → annulé | 409 → statut incompatible | 404 → introuvable
    /// </summary>
    [HttpDelete("bookings/{id:long}")]
    public async Task<IActionResult> CancelBooking(long id)
    {
        var userId = GetUserId();
        var (found, allowed, booking) = await _bookingService.CancelBookingAsync(id, userId);

        if (!found)
            return NotFound(new { message = "Réservation introuvable ou ne vous appartient pas." });

        if (!allowed)
            return Conflict(new
            {
                message = "Cette réservation ne peut plus être annulée.",
                currentStatus = booking!.Status
            });

        return NoContent(); // 204
    }
}