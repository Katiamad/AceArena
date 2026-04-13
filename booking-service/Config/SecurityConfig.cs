using System.Security.Cryptography;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace booking_service.Config;

public static class SecurityConfig
{
    public static IServiceCollection AddJwtRsaSecurity(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var publicKeyPath = configuration["Jwt:PublicKeyPath"]
            ?? throw new InvalidOperationException("Jwt:PublicKeyPath manquant dans appsettings.json");

        var publicKeyPem = File.ReadAllText(publicKeyPath);
        var rsa = RSA.Create();
        rsa.ImportFromPem(publicKeyPem);
        var rsaSecurityKey = new RsaSecurityKey(rsa);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey         = rsaSecurityKey,
                ValidateIssuer           = false,
                ValidateAudience         = false,
                ValidateLifetime         = true,
                ClockSkew                = TimeSpan.Zero,
                RoleClaimType            = ClaimTypes.Role
            };

            options.Events = new JwtBearerEvents
            {
                OnTokenValidated = ctx =>
                {
                    var identity = ctx.Principal?.Identity as ClaimsIdentity;
                    if (identity is null) return Task.CompletedTask;

                    // scope claim contient "ROLE_ADMIN", "ROLE_USER", etc.
                    // On mappe vers ClaimTypes.Role en retirant le prefixe "ROLE_"
                    var scopeClaims = identity.FindAll("scope").ToList();
                    foreach (var claim in scopeClaims)
                    {
                        var role = claim.Value.StartsWith("ROLE_")
                            ? claim.Value.Substring(5)
                            : claim.Value;
                        identity.AddClaim(new Claim(ClaimTypes.Role, role));
                    }

                    Console.WriteLine($"[JWT] Token valide - roles: {string.Join(", ", identity.FindAll(ClaimTypes.Role).Select(c => c.Value))}");
                    return Task.CompletedTask;
                },
                OnAuthenticationFailed = ctx =>
                {
                    Console.WriteLine($"[JWT] Auth failed: {ctx.Exception.Message}");
                    return Task.CompletedTask;
                }
            };
        });

        services.AddAuthorization();
        return services;
    }
}
