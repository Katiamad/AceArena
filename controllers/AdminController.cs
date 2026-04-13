using booking_service.Models.DTOs.Request;
using booking_service.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace booking_service.Controllers;

/// <summary>
/// Controller ADMIN
/// Routes exposées : /api/admin/** (après StripPrefix=1 du Gateway → /admin/**)
/// Nécessite le rôle "ADMIN"
/// </summary>
[ApiController]
[Route("api/admin")]
[Authorize(Roles = "ADMIN")]
public class AdminController : ControllerBase
{
    private readonly ICourtService _courtService;
    private readonly ISlotService _slotService;
    private readonly IBookingService _bookingService;

    public AdminController(
        ICourtService courtService,
        ISlotService slotService,
        IBookingService bookingService)
    {
        _courtService = courtService;
        _slotService = slotService;
        _bookingService = bookingService;
    }

    // ─── Terrains ──────────────────────────────────────────────────────────────

    /// <summary>GET /api/admin/courts — Liste tous les terrains</summary>
    [HttpGet("courts")]
    public async Task<IActionResult> GetAllCourts()
    {
        var courts = await _courtService.GetAllCourtsAsync();
        return Ok(courts);
    }

    /// <summary>POST /api/admin/courts — Ajouter un terrain</summary>
    [HttpPost("courts")]
    public async Task<IActionResult> CreateCourt([FromBody] CreateCourtRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var court = await _courtService.CreateCourtAsync(req);
        return CreatedAtAction(nameof(GetCourtById), new { id = court.Id }, court);
    }

    /// <summary>GET /api/admin/courts/{id} — Détail d'un terrain</summary>
    [HttpGet("courts/{id:long}")]
    public async Task<IActionResult> GetCourtById(long id)
    {
        var court = await _courtService.GetCourtByIdAsync(id);
        return court is null ? NotFound() : Ok(court);
    }

    /// <summary>PUT /api/admin/courts/{id} — Modifier un terrain</summary>
    [HttpPut("courts/{id:long}")]
    public async Task<IActionResult> UpdateCourt(long id, [FromBody] UpdateCourtRequest req)
    {
        var court = await _courtService.UpdateCourtAsync(id, req);
        return court is null ? NotFound() : Ok(court);
    }

    /// <summary>DELETE /api/admin/courts/{id} — Supprimer un terrain</summary>
    [HttpDelete("courts/{id:long}")]
    public async Task<IActionResult> DeleteCourt(long id)
    {
        var deleted = await _courtService.DeleteCourtAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    // ─── Créneaux ──────────────────────────────────────────────────────────────

    /// <summary>POST /api/admin/slots — Ajouter un créneau à un terrain</summary>
    [HttpPost("slots")]
    public async Task<IActionResult> CreateSlot([FromBody] CreateTimeSlotRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var slot = await _slotService.CreateSlotAsync(req);
        return Created($"/api/admin/slots/{slot.Id}", slot);
    }

    /// <summary>GET /api/admin/courts/{courtId}/slots — Créneaux d'un terrain</summary>
    [HttpGet("courts/{courtId:long}/slots")]
    public async Task<IActionResult> GetSlotsByCourt(long courtId)
    {
        var slots = await _slotService.GetSlotsByCourtAsync(courtId);
        return Ok(slots);
    }

    /// <summary>DELETE /api/admin/slots/{id} — Supprimer un créneau</summary>
    [HttpDelete("slots/{id:long}")]
    public async Task<IActionResult> DeleteSlot(long id)
    {
        var deleted = await _slotService.DeleteSlotAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    // ─── Réservations (vue admin) ──────────────────────────────────────────────

    /// <summary>GET /api/admin/bookings — Toutes les réservations + qui les a faites</summary>
    [HttpGet("bookings")]
    public async Task<IActionResult> GetAllBookings()
    {
        var bookings = await _bookingService.GetAllBookingsAsync();
        return Ok(bookings);
    }
}