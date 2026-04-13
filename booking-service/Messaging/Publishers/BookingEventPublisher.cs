using booking_service.Config;
using booking_service.Models.Events;
using RabbitMQ.Client;
using System;
using System.Text;
using System.Text.Json;

namespace booking_service.Messaging.Publishers;

public interface IBookingEventPublisher
{
    void PublishPaymentRequest(BookingPaymentRequestEvent evt);
    void PublishMatchDelegate(BookingMatchDelegateEvent evt);
    void PublishBookingNotification(BookingNotificationEvent evt);
}

public class BookingEventPublisher : IBookingEventPublisher
{
    private readonly RabbitMQConnectionFactory _factory;
    private readonly RabbitMQSettings _settings;
    private readonly ILogger<BookingEventPublisher> _logger;

    public BookingEventPublisher(
        RabbitMQConnectionFactory factory,
        RabbitMQSettings settings,
        ILogger<BookingEventPublisher> logger)
    {
        _factory = factory;
        _settings = settings;
        _logger = logger;
    }

    /// <summary>
    /// Booking -> Payment  |  routing key: booking.payment.request
    /// </summary>
    public void PublishPaymentRequest(BookingPaymentRequestEvent evt)
    {
        Publish(_settings.Exchanges.BookingExchange, _settings.RoutingKeys.PaymentRequest, evt);
        _logger.LogInformation(
            "[RabbitMQ] PaymentRequest publie -> bookingId={BookingId}, montant={Amount}",
            evt.BookingId, evt.TotalPrice);
    }

    /// <summary>
    /// Booking -> Match  |  routing key: booking.match.delegate
    /// </summary>
    public void PublishMatchDelegate(BookingMatchDelegateEvent evt)
    {
        Publish(_settings.Exchanges.BookingExchange, _settings.RoutingKeys.MatchDelegate, evt);
        _logger.LogInformation(
            "[RabbitMQ] MatchDelegate publie -> bookingId={BookingId}",
            evt.BookingId);
    }

    /// <summary>
    /// Booking -> Notification  |  queue directe: booking.event.queue
    /// </summary>
    public void PublishBookingNotification(BookingNotificationEvent evt)
    {
        PublishDirect("booking.event.queue", evt);
        _logger.LogInformation(
            "[RabbitMQ] BookingNotification publie -> bookingId={BookingId}, status={Status}",
            evt.BookingId, evt.Status);
    }

    private static readonly JsonSerializerOptions CamelCaseOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private void Publish<T>(string exchange, string routingKey, T message)
    {
        using var channel = _factory.CreateChannel();

        var props = channel.CreateBasicProperties();
        props.Persistent = true;
        props.ContentType = "application/json";
        props.MessageId = Guid.NewGuid().ToString();
        props.Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds());

        var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message, CamelCaseOptions));
        channel.BasicPublish(exchange, routingKey, props, body);
    }

    private void PublishDirect<T>(string queue, T message)
    {
        using var channel = _factory.CreateChannel();
        channel.QueueDeclare(queue, durable: true, exclusive: false, autoDelete: false);

        var props = channel.CreateBasicProperties();
        props.Persistent = true;
        props.ContentType = "application/json";
        props.MessageId = Guid.NewGuid().ToString();
        props.Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds());

        var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
        channel.BasicPublish("", queue, props, body);
    }
}
