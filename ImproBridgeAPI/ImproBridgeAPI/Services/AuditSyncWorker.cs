using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using ImproBridgeAPI.Models;

namespace ImproBridgeAPI.Services
{
    /// <summary>
    /// Background worker that periodically polls the Impro hardware for door scan
    /// transactions and pushes them up to the Supabase `audit_logs` table.
    /// This gives the cloud dashboard near real-time visibility into physical events.
    /// </summary>
    public class AuditSyncWorker : BackgroundService
    {
        private readonly ILogger<AuditSyncWorker> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        // Track the last sync timestamp so we only pull new events each cycle
        private DateTime _lastSyncTimestamp = DateTime.UtcNow.AddHours(-1); // Start by pulling the last hour

        public AuditSyncWorker(
            ILogger<AuditSyncWorker> logger,
            IServiceProvider serviceProvider,
            IConfiguration configuration,
            HttpClient httpClient)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
            _configuration = configuration;
            _httpClient = httpClient;

            var supabaseUrl = _configuration["SupabaseUrl"];
            var serviceRoleKey = _configuration["SupabaseServiceRoleKey"];

            _httpClient.BaseAddress = new Uri(supabaseUrl!);
            _httpClient.DefaultRequestHeaders.Add("apikey", serviceRoleKey);
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", serviceRoleKey);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Audit Sync Worker is starting. Will poll hardware logs every 30 seconds.");

            // Wait 10 seconds on startup to let the Impro SDK initialize
            await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

            // Fallback polling loop with exponential backoff on failures
            int consecutiveFailures = 0;
            const int baseDelaySeconds = 30;
            const int maxDelaySeconds = 300; // 5 minutes cap

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await SyncAuditLogsAsync(stoppingToken);
                    consecutiveFailures = 0; // Reset on success
                }
                catch (Exception ex)
                {
                    consecutiveFailures++;
                    var backoffSeconds = Math.Min(baseDelaySeconds * (int)Math.Pow(2, consecutiveFailures - 1), maxDelaySeconds);
                    _logger.LogError(ex, "Audit sync failed (attempt {Attempt}). Next retry in {Delay}s.", consecutiveFailures, backoffSeconds);
                    await Task.Delay(TimeSpan.FromSeconds(backoffSeconds), stoppingToken);
                    continue; // Skip the normal delay below
                }

                // Normal polling interval
                await Task.Delay(TimeSpan.FromSeconds(baseDelaySeconds), stoppingToken);
            }

            _logger.LogInformation("Audit Sync Worker is stopping.");
        }

        private async Task SyncAuditLogsAsync(CancellationToken stoppingToken)
        {
            // 1. Pull transactions from the physical Impro hardware via the SDK
            using var scope = _serviceProvider.CreateScope();
            var improService = scope.ServiceProvider.GetRequiredService<IImproCommandService>();

            string internalToken = "worker-service-token";
            var transactions = improService.GetTransactions(_lastSyncTimestamp, internalToken);

            if (transactions == null || transactions.Count == 0)
            {
                return; // No new hardware events
            }

            _logger.LogInformation($"Found {transactions.Count} new hardware transaction(s) to push to Supabase.");

            // 2. Transform hardware transactions into Supabase audit_logs payloads
            var auditPayloads = new List<AuditLogPayload>();

            foreach (var txn in transactions)
            {
                // Try to find the visitor associated with this tag code
                string? visitorId = null;
                string? unitId = null;

                if (!string.IsNullOrEmpty(txn.TagCode))
                {
                    try
                    {
                        var lookupUrl = $"/rest/v1/visitors?pin_code=eq.{txn.TagCode}&select=id,unit_id&limit=1";
                        var lookupResponse = await _httpClient.GetAsync(lookupUrl, stoppingToken);

                        if (lookupResponse.IsSuccessStatusCode)
                        {
                            var lookupContent = await lookupResponse.Content.ReadAsStringAsync(stoppingToken);
                            var visitors = JsonSerializer.Deserialize<List<VisitorLookup>>(lookupContent);

                            if (visitors != null && visitors.Count > 0)
                            {
                                visitorId = visitors[0].Id;
                                unitId = visitors[0].UnitId;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, $"Failed to lookup visitor for tag {txn.TagCode}. Audit log will be orphaned.");
                    }
                }

                var actionDescription = $"{txn.EventType}: {txn.MasterName} at {txn.DoorName}";

                auditPayloads.Add(new AuditLogPayload
                {
                    Action = actionDescription,
                    Timestamp = txn.Timestamp.ToString("o"), // ISO 8601 for Postgres TIMESTAMPTZ
                    VisitorId = visitorId,
                    UnitId = unitId
                });
            }

            // 3. Batch insert into Supabase audit_logs table
            if (auditPayloads.Count > 0)
            {
                var jsonBody = new StringContent(
                    JsonSerializer.Serialize(auditPayloads),
                    Encoding.UTF8,
                    "application/json"
                );

                var insertUrl = "/rest/v1/audit_logs";
                var insertResponse = await _httpClient.PostAsync(insertUrl, jsonBody, stoppingToken);

                if (insertResponse.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"Successfully pushed {auditPayloads.Count} audit log(s) to Supabase.");

                    // Update the watermark to the latest transaction timestamp
                    _lastSyncTimestamp = transactions.Max(t => t.Timestamp);
                }
                else
                {
                    var errorBody = await insertResponse.Content.ReadAsStringAsync(stoppingToken);
                    _logger.LogError($"Failed to insert audit logs into Supabase. Status: {insertResponse.StatusCode}. Body: {errorBody}");
                }
            }
        }
    }

    /// <summary>
    /// Lightweight model for looking up a visitor by their PIN code.
    /// </summary>
    internal class VisitorLookup
    {
        [System.Text.Json.Serialization.JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("unit_id")]
        public string UnitId { get; set; } = string.Empty;
    }
}
