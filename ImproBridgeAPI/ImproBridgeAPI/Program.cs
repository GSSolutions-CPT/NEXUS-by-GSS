using ImproBridgeAPI.Services;
using Polly;
using Polly.Extensions.Http;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register the custom Impro Bridge Service
builder.Services.AddScoped<IImproCommandService, ImproCommandService>();

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
app.UseAuthorization();
app.MapControllers();

app.Run();
