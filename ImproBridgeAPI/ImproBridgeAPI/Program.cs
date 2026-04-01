using ImproBridgeAPI.Services;
using Polly;
using Polly.Extensions.Http;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseWindowsService();

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register the custom Impro Bridge Service
builder.Services.AddScoped<IImproCommandService, ImproCommandService>();

// JWT Authentication Configuration
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "Supabase",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "authenticated",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                builder.Configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("FATAL: 'Jwt:Key' is not configured. Cannot start without a signing key.")))
        };
    });

// Configure HttpClient with Polly Exponential Backoff (3 retries: 2s, 4s, 8s)
builder.Services.AddHttpClient<VisitorSyncWorker>()
    .AddPolicyHandler(GetRetryPolicy());
builder.Services.AddHttpClient<AuditSyncWorker>()
    .AddPolicyHandler(GetRetryPolicy());

static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
{
    return HttpPolicyExtensions
        .HandleTransientHttpError()
        .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));
}

builder.Services.AddHostedService<VisitorSyncWorker>();
builder.Services.AddHostedService<AuditSyncWorker>();
builder.Services.AddHostedService<RetryService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Health check endpoint for the admin dashboard bridge-health probe
app.MapGet("/health", () => Results.Ok(new { status = "online", timestamp = DateTime.UtcNow }));

// Deep health check that actually tests the Impro Portal SDK connection
app.MapGet("/health/impro", (IServiceProvider sp) =>
{
    try
    {
        using var scope = sp.CreateScope();
        var improService = scope.ServiceProvider.GetRequiredService<IImproCommandService>();
        var token = improService.Authenticate("", "");
        var isConnected = !string.IsNullOrEmpty(token);
        return Results.Ok(new
        {
            status = isConnected ? "connected" : "disconnected",
            portalServer = "127.0.0.1:10010",
            timestamp = DateTime.UtcNow
        });
    }
    catch (Exception ex)
    {
        return Results.Ok(new
        {
            status = "error",
            message = ex.Message,
            timestamp = DateTime.UtcNow
        });
    }
});

app.Run();
