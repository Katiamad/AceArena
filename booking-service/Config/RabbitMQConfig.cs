using RabbitMQ.Client;
using System;
using System.Threading;

namespace booking_service.Config;

public class RabbitMQSettings
{
    public string Host { get; set; } = "rabbitmq";
    public int Port { get; set; } = 5672;
    public string Username { get; set; } = "guest";
    public string Password { get; set; } = "guest";
    public string VirtualHost { get; set; } = "/";
    public ExchangeSettings Exchanges { get; set; } = new();
    public QueueSettings Queues { get; set; } = new();
    public RoutingKeySettings RoutingKeys { get; set; } = new();
}

public class ExchangeSettings
{
    public string BookingExchange { get; set; } = "booking.exchange";
    public string PaymentExchange { get; set; } = "payment.exchange";
    public string MatchExchange { get; set; } = "match.exchange";
}

public class QueueSettings
{
    public string BookingToPayment { get; set; } = "booking.to.payment.queue";
    public string BookingToMatch { get; set; } = "booking.to.match.queue";
    public string PaymentToBooking { get; set; } = "payment.to.booking.queue";
    public string MatchToBooking { get; set; } = "match.to.booking.queue";
}

public class RoutingKeySettings
{
    public string PaymentRequest { get; set; } = "booking.payment.request";
    public string MatchDelegate { get; set; } = "booking.match.delegate";
    public string PaymentStatus { get; set; } = "payment.booking.status";
    public string MatchPaid { get; set; } = "match.booking.paid";
}

// ─── Factory RabbitMQ (singleton) ────────────────────────────────────────────
public class RabbitMQConnectionFactory : IDisposable
{
    private readonly IConnection _connection;
    private readonly RabbitMQSettings _settings;

    public RabbitMQConnectionFactory(RabbitMQSettings settings)
    {
        _settings = settings;

        var factory = new ConnectionFactory
        {
            HostName = settings.Host,
            Port = settings.Port,
            UserName = settings.Username,
            Password = settings.Password,
            VirtualHost = settings.VirtualHost,
            DispatchConsumersAsync = true,
            // Reconnexion automatique si la connexion est coupée
            AutomaticRecoveryEnabled = true,
            NetworkRecoveryInterval = TimeSpan.FromSeconds(5)
        };

        // ── Retry avec backoff ────────────────────────────────────────────────
        // RabbitMQ peut mettre du temps à être vraiment prêt même après
        // que Docker le marque "healthy"
        const int maxAttempts = 15;
        for (int attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                _connection = factory.CreateConnection("booking-service");
                Console.WriteLine($"[RabbitMQ] ✅ Connecté à {settings.Host}:{settings.Port}");
                break;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[RabbitMQ] ⏳ Tentative {attempt}/{maxAttempts} échouée : {ex.Message}");
                if (attempt == maxAttempts)
                {
                    Console.WriteLine("[RabbitMQ] ❌ Impossible de se connecter après toutes les tentatives.");
                    throw;
                }
                // Backoff progressif : 5s, 5s, 5s... jusqu'à 75s total
                Thread.Sleep(5000);
            }
        }

        DeclareTopology();
    }

    public IModel CreateChannel() => _connection.CreateModel();

    private void DeclareTopology()
    {
        using var channel = _connection.CreateModel();

        // ── Exchanges ─────────────────────────────────────────────────────────
        channel.ExchangeDeclare(_settings.Exchanges.BookingExchange, ExchangeType.Topic, durable: true);
        channel.ExchangeDeclare(_settings.Exchanges.PaymentExchange, ExchangeType.Topic, durable: true);
        channel.ExchangeDeclare(_settings.Exchanges.MatchExchange, ExchangeType.Topic, durable: true);

        // ── Queues ────────────────────────────────────────────────────────────
        var queueArgs = new Dictionary<string, object>(); // pas de TTL/DLQ pour l'instant
        channel.QueueDeclare(_settings.Queues.BookingToPayment, durable: true, exclusive: false, autoDelete: false, queueArgs);
        channel.QueueDeclare(_settings.Queues.BookingToMatch, durable: true, exclusive: false, autoDelete: false, queueArgs);
        channel.QueueDeclare(_settings.Queues.PaymentToBooking, durable: true, exclusive: false, autoDelete: false, queueArgs);
        channel.QueueDeclare(_settings.Queues.MatchToBooking, durable: true, exclusive: false, autoDelete: false, queueArgs);

        // ── Bindings ──────────────────────────────────────────────────────────
        channel.QueueBind(_settings.Queues.BookingToPayment, _settings.Exchanges.BookingExchange, _settings.RoutingKeys.PaymentRequest);
        channel.QueueBind(_settings.Queues.BookingToMatch, _settings.Exchanges.BookingExchange, _settings.RoutingKeys.MatchDelegate);
        channel.QueueBind(_settings.Queues.PaymentToBooking, _settings.Exchanges.PaymentExchange, _settings.RoutingKeys.PaymentStatus);
        channel.QueueBind(_settings.Queues.MatchToBooking, _settings.Exchanges.MatchExchange, _settings.RoutingKeys.MatchPaid);

        Console.WriteLine("[RabbitMQ] ✅ Topology déclarée (exchanges, queues, bindings)");
    }

    public void Dispose() => _connection?.Dispose();
}