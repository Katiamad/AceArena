using Consul;
using Microsoft.EntityFrameworkCore;
using booking_service.Config;
using booking_service.Messaging.Consumers;
using booking_service.Messaging.Publishers;
using booking_service.Services;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

// ── Controllers + Swagger ─────────────────────────────────────────────────────
// ── Controllers + Swagger ─────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        // ✅ AJOUTE CES 2 LIGNES
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Booking Service", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Entrez votre token JWT"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ── PostgreSQL / EF Core ──────────────────────────────────────────────────────
builder.Services.AddDbContext<BookingDbContext>(options =>
    options.UseNpgsql(config.GetConnectionString("DefaultConnection")));

// ── JWT RSA Security ──────────────────────────────────────────────────────────
builder.Services.AddJwtRsaSecurity(config);

// ── RabbitMQ ──────────────────────────────────────────────────────────────────
var rabbitSettings = config.GetSection("RabbitMQ").Get<RabbitMQSettings>() ?? new RabbitMQSettings();
builder.Services.AddSingleton(rabbitSettings);
builder.Services.AddSingleton<RabbitMQConnectionFactory>();
builder.Services.AddScoped<IBookingEventPublisher, BookingEventPublisher>();
builder.Services.AddHostedService<PaymentStatusConsumer>();
builder.Services.AddHostedService<MatchBookingPaidConsumer>();

// ── Business Services ─────────────────────────────────────────────────────────
builder.Services.AddScoped<ICourtService, CourtService>();
builder.Services.AddScoped<ISlotService, SlotService>();
builder.Services.AddScoped<IBookingService, BookingBusinessService>();

// ── Consul (ton style existant, conservé tel quel) ────────────────────────────
builder.Services.AddSingleton<IConsulClient, ConsulClient>(p =>
    new ConsulClient(consulConfig =>
    {
        consulConfig.Address = new Uri("http://consul:8500");
    }));

// ══════════════════════════════════════════════════════════════════════════════
var app = builder.Build();

// ── Forcer l'init RabbitMQ au démarrage (connexion + topology) ────────────────
_ = app.Services.GetRequiredService<RabbitMQConnectionFactory>();

// ── Migrations automatiques ───────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
    try
    {
        // Option A : recréer les tables proprement si elles manquent
        //db.Database.EnsureCreated();

        // Option B (alternative si tu veux garder les migrations fonctionnelles) :
         db.Database.Migrate();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Erreur DB] : {ex.Message}");
    }
}

// ── Swagger ───────────────────────────────────────────────────────────────────
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "booking-service API v1");
    c.RoutePrefix = "swagger";
});

// ── Health check + hello (Consul check sur /health) ──────────────────────────
app.MapGet("/health", () => Results.Ok(new { status = "UP", service = "booking-service" }));
app.MapGet("/hello", () => "Hello from booking-service !");

// ── Auth ──────────────────────────────────────────────────────────────────────
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ── Consul : enregistrement (ton code existant conservé) ─────────────────────
var consulClient = app.Services.GetRequiredService<IConsulClient>();
var registration = new AgentServiceRegistration
{
    ID = "booking-service-1",
    Name = "booking-service",
    Address = "booking-service",
    Port = 8082,
    Check = new AgentServiceCheck
    {
        HTTP = "http://booking-service:8082/health",
        Interval = TimeSpan.FromSeconds(10)
    }
};

await consulClient.Agent.ServiceDeregister(registration.ID);
await consulClient.Agent.ServiceRegister(registration);

app.Lifetime.ApplicationStopping.Register(() =>
{
    consulClient.Agent.ServiceDeregister(registration.ID).Wait();
});

app.Run();