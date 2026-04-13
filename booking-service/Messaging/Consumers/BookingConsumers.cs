using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using booking_service.Config;
using booking_service.Messaging.Publishers;
using booking_service.Models.Entities;
using booking_service.Models.Events;
using Microsoft.EntityFrameworkCore;

namespace booking_service.Messaging.Consumers;

// ── Options JSON partagees (Java envoie en camelCase) ────────────────────────
static class JsonOpts
{
    public static readonly JsonSerializerOptions CamelCase = new()
    {
        PropertyNameCaseInsensitive = true
    };
}

// ══════════════════════════════════════════════════════════════════════════════
//  CONSUMER 1 : Payment → Booking  (reponse paiement SIMPLE)
// ══════════════════════════════════════════════════════════════════════════════

public class PaymentStatusConsumer : BackgroundService
{
    private readonly RabbitMQConnectionFactory _factory;
    private readonly RabbitMQSettings _settings;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PaymentStatusConsumer> _logger;
    private IModel? _channel;

    public PaymentStatusConsumer(RabbitMQConnectionFactory factory, RabbitMQSettings settings,
        IServiceScopeFactory scopeFactory, ILogger<PaymentStatusConsumer> logger)
    { _factory = factory; _settings = settings; _scopeFactory = scopeFactory; _logger = logger; }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _channel = _factory.CreateChannel();
        _channel.BasicQos(0, 1, false);
        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.Received += async (_, ea) =>
        {
            try
            {
                var json = Encoding.UTF8.GetString(ea.Body.ToArray());
                _logger.LogInformation("[PaymentConsumer] Message recu : {Json}", json);

                var evt = JsonSerializer.Deserialize<PaymentStatusEvent>(json, JsonOpts.CamelCase);
                if (evt is null) { _channel.BasicNack(ea.DeliveryTag, false, false); return; }

                _logger.LogInformation("[PaymentConsumer] BookingId={BookingId}, IsPaid={IsPaid}",
                    evt.BookingId, evt.IsPaid);

                await HandleAsync(evt);
                _channel.BasicAck(ea.DeliveryTag, false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[PaymentConsumer] Erreur traitement");
                _channel.BasicNack(ea.DeliveryTag, false, true);
            }
        };
        _channel.BasicConsume(_settings.Queues.PaymentToBooking, autoAck: false, consumer);
        _logger.LogInformation("[PaymentConsumer] En ecoute sur {Queue}", _settings.Queues.PaymentToBooking);
        return Task.CompletedTask;
    }

    private async Task HandleAsync(PaymentStatusEvent evt)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
        var publisher = scope.ServiceProvider.GetRequiredService<IBookingEventPublisher>();

        var booking = await db.Bookings
            .Include(b => b.Court)
            .FirstOrDefaultAsync(b => b.Id == evt.BookingId);

        if (booking is null)
        {
            _logger.LogWarning("[PaymentConsumer] Booking #{Id} introuvable", evt.BookingId);
            return;
        }

        if (evt.IsPaid)
        {
            booking.Status = BookingStatus.CONFIRMED;
            booking.UpdatedAt = DateTime.UtcNow;

            var slot = await db.TimeSlots.FindAsync(booking.TimeSlotId);
            if (slot is not null) slot.IsBooked = true;

            _logger.LogInformation("[PaymentConsumer] Booking #{Id} -> CONFIRMED", evt.BookingId);

            // Publier notification
            publisher.PublishBookingNotification(new BookingNotificationEvent
            {
                BookingId = booking.Id,
                UserId = long.TryParse(booking.UserId, out var uid) ? uid : 0,
                CourtName = booking.Court?.Name,
                Status = "CONFIRMED",
                Message = "Votre reservation sur " + (booking.Court?.Name ?? "le terrain") + " est confirmee !"
            });
        }
        else
        {
            booking.Status = BookingStatus.CANCELLED;
            booking.UpdatedAt = DateTime.UtcNow;
            _logger.LogInformation("[PaymentConsumer] Booking #{Id} -> CANCELLED", evt.BookingId);

            publisher.PublishBookingNotification(new BookingNotificationEvent
            {
                BookingId = booking.Id,
                UserId = long.TryParse(booking.UserId, out var uid) ? uid : 0,
                CourtName = booking.Court?.Name,
                Status = "CANCELLED",
                Message = "Le paiement pour votre reservation a echoue."
            });
        }

        await db.SaveChangesAsync();
    }

    public override void Dispose() { _channel?.Dispose(); base.Dispose(); }
}

// ══════════════════════════════════════════════════════════════════════════════
//  CONSUMER 2 : Match → Booking  (tous les joueurs ont paye)
// ══════════════════════════════════════════════════════════════════════════════

public class MatchBookingPaidConsumer : BackgroundService
{
    private readonly RabbitMQConnectionFactory _factory;
    private readonly RabbitMQSettings _settings;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MatchBookingPaidConsumer> _logger;
    private IModel? _channel;

    public MatchBookingPaidConsumer(RabbitMQConnectionFactory factory, RabbitMQSettings settings,
        IServiceScopeFactory scopeFactory, ILogger<MatchBookingPaidConsumer> logger)
    { _factory = factory; _settings = settings; _scopeFactory = scopeFactory; _logger = logger; }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _channel = _factory.CreateChannel();
        _channel.BasicQos(0, 1, false);
        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.Received += async (_, ea) =>
        {
            try
            {
                var json = Encoding.UTF8.GetString(ea.Body.ToArray());
                _logger.LogInformation("[MatchConsumer] Message recu : {Json}", json);

                var evt = JsonSerializer.Deserialize<MatchBookingPaidEvent>(json, JsonOpts.CamelCase);
                if (evt is null) { _channel.BasicNack(ea.DeliveryTag, false, false); return; }

                _logger.LogInformation("[MatchConsumer] BookingId={BookingId}, MatchId={MatchId}, IsPaid={IsPaid}",
                    evt.BookingId, evt.MatchId, evt.IsPaid);

                await HandleAsync(evt);
                _channel.BasicAck(ea.DeliveryTag, false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[MatchConsumer] Erreur traitement");
                _channel.BasicNack(ea.DeliveryTag, false, true);
            }
        };
        _channel.BasicConsume(_settings.Queues.MatchToBooking, autoAck: false, consumer);
        _logger.LogInformation("[MatchConsumer] En ecoute sur {Queue}", _settings.Queues.MatchToBooking);
        return Task.CompletedTask;
    }

    private async Task HandleAsync(MatchBookingPaidEvent evt)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
        var publisher = scope.ServiceProvider.GetRequiredService<IBookingEventPublisher>();

        var booking = await db.Bookings
            .Include(b => b.Court)
            .FirstOrDefaultAsync(b => b.Id == evt.BookingId);

        if (booking is null)
        {
            _logger.LogWarning("[MatchConsumer] Booking #{Id} introuvable", evt.BookingId);
            return;
        }

        if (evt.IsPaid)
        {
            booking.Status = BookingStatus.CONFIRMED;
            booking.MatchId = evt.MatchId;
            booking.UpdatedAt = DateTime.UtcNow;

            var slot = await db.TimeSlots.FindAsync(booking.TimeSlotId);
            if (slot is not null) slot.IsBooked = true;

            _logger.LogInformation("[MatchConsumer] Booking #{Id} -> CONFIRMED (match #{MatchId})",
                evt.BookingId, evt.MatchId);

            publisher.PublishBookingNotification(new BookingNotificationEvent
            {
                BookingId = booking.Id,
                UserId = long.TryParse(booking.UserId, out var uid) ? uid : 0,
                CourtName = booking.Court?.Name,
                Status = "CONFIRMED",
                Message = "Tous les joueurs ont paye ! Match #" + evt.MatchId + " confirme sur " + (booking.Court?.Name ?? "le terrain") + "."
            });
        }
        else
        {
            booking.Status = BookingStatus.CANCELLED;
            booking.UpdatedAt = DateTime.UtcNow;
            _logger.LogInformation("[MatchConsumer] Booking #{Id} -> CANCELLED", evt.BookingId);

            publisher.PublishBookingNotification(new BookingNotificationEvent
            {
                BookingId = booking.Id,
                UserId = long.TryParse(booking.UserId, out var uid) ? uid : 0,
                CourtName = booking.Court?.Name,
                Status = "CANCELLED"
            });
        }

        await db.SaveChangesAsync();
    }

    public override void Dispose() { _channel?.Dispose(); base.Dispose(); }
}
