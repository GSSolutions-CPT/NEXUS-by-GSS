using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using ImproBridgeAPI.Models;
using Portal.Api;

namespace ImproBridgeAPI.Services
{
    public class AuditSyncWorker : BackgroundService, TransackListener
    {
        private readonly ILogger<AuditSyncWorker> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        
        private PortalAPI? _api;

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
            _logger.LogInformation("[AUDIT-SYNC] Audit Sync Worker is starting with Real-time Event Stream Listener.");

            // Wait until Impro SDK is able to login by checking our impro service first
            await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

            var serverUrl = _configuration["ImproServerUrl"] ?? "127.0.0.1";
            var serverPort = int.TryParse(_configuration["ImproServerPort"], out var p) ? p : 10010;
            var username = _configuration["ImproUsername"] ?? "sysdba";
            var password = _configuration["ImproPassword"] ?? "masterkey";

            int consecutiveFailures = 0;
            const int maxDelaySeconds = 60;

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    if (_api == null || !_api.socket.isConnected())
                    {
                        _logger.LogWarning("[AUDIT-SYNC] Connecting to Real-time API Stream...");
                        _api = new PortalAPI("AuditSyncWorker", true, true, true);
                        if (_api.connect(serverUrl, serverPort, 5000))
                        {
                            _logger.LogInformation("[AUDIT-SYNC] Logged in to stream...");
                            _api.login(username, Encoding.UTF8.GetBytes(password));
                            
                            _api.registerListener(this);
                            string key = "filter";
                            string value = "eventType.etName='Allowed'"; // Cannot be empty, otherwise Java backend crashes!
                            _api.sendCommand("1", "22", key, value, true);

                            _logger.LogInformation("[AUDIT-SYNC] Real-time Listener registered successfully.");
                            consecutiveFailures = 0;
                        }
                        else
                        {
                            _logger.LogError("[AUDIT-SYNC] Stream connection failed.");
                            throw new Exception("Connection to stream failed.");
                        }
                    }
                }
                catch (Exception ex)
                {
                    consecutiveFailures++;
                    var backoffSeconds = Math.Min(5 * consecutiveFailures, maxDelaySeconds);
                    _logger.LogError(ex, "[AUDIT-SYNC] Reconnection failed (attempt {Attempt}). Retry in {Delay}s.", consecutiveFailures, backoffSeconds);
                    await Task.Delay(TimeSpan.FromSeconds(backoffSeconds), stoppingToken);
                }

                await Task.Delay(5000, stoppingToken);
            }

            _logger.LogInformation("Audit Sync Worker is stopping.");
            
            try
            {
                if (_api != null)
                {
                    _api.disconnect();
                    if (_api.socket != null && _api.socket.isConnected())
                        _api.socket.disconnect();
                }
            } 
            catch { }
        }

        public void onConnectionLost()
        {
            _logger.LogWarning("[AUDIT-SYNC] Stream connection lost! Will attempt reconnect on next loop cycle.");
        }

        public void onTransackReceived(transack transaction)
        {
            _logger.LogInformation("[AUDIT-SYNC] Received real-time transaction event!");
            try 
            {
                // We must run the async Supabase sync on a background task so we don't block the socket thread
                Task.Run(() => ProcessTransactionAsync(transaction));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[AUDIT-SYNC] Error handling incoming transaction event.");
            }
        }

        private async Task ProcessTransactionAsync(transack txn)
        {
            try
            {
                string tagCode = txn.trtagcode ?? "";
                string masterName = txn.master != null ? $"{txn.master.firstName} {txn.master.lastName}" : "Unknown Person";

                string doorName = txn.trlocname ?? "Unknown Door";
                if (txn.terminal != null)
                {
                    doorName = txn.terminal.name;
                    try
                    {
                        var prop = txn.terminal.GetType().GetProperty("nameOriginal");
                        if (prop != null) doorName = prop.GetValue(txn.terminal)?.ToString() ?? txn.terminal.name;
                    }
                    catch { }
                }

                string eventType = "Scan Event";
                if (txn.@event != null)
                {
                    eventType = txn.@event.name;
                    try
                    {
                        var prop = txn.@event.GetType().GetProperty("nameOriginal");
                        if (prop != null) eventType = prop.GetValue(txn.@event)?.ToString() ?? txn.@event.name;
                    }
                    catch { }
                }

                DateTime timestamp = DateTime.TryParse(txn.datetimeutc, out var parsedDt) ? parsedDt : DateTime.UtcNow;

                _logger.LogInformation($"[AUDIT-SYNC] Pushing: {eventType} - {masterName} at {doorName}");

                string? visitorId = null;
                string? unitId = null;

                if (!string.IsNullOrEmpty(tagCode))
                {
                    try
                    {
                        var lookupUrl = $"/rest/v1/visitors?pin_code=eq.{tagCode}&select=id,unit_id&limit=1";
                        var lookupResponse = await _httpClient.GetAsync(lookupUrl);

                        if (lookupResponse.IsSuccessStatusCode)
                        {
                            var lookupContent = await lookupResponse.Content.ReadAsStringAsync();
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
                        _logger.LogWarning(ex, $"Failed to lookup visitor for tag {tagCode}. Audit log will be orphaned.");
                    }
                }

                var actionDescription = $"{eventType}: {masterName} at {doorName}";

                var payload = new AuditLogPayload
                {
                    Action = actionDescription,
                    Timestamp = timestamp.ToString("o"), 
                    VisitorId = visitorId,
                    UnitId = unitId
                };

                var payloadList = new List<AuditLogPayload> { payload };
                var jsonBody = new StringContent(
                    JsonSerializer.Serialize(payloadList),
                    Encoding.UTF8,
                    "application/json"
                );

                var insertUrl = "/rest/v1/audit_logs";
                var insertResponse = await _httpClient.PostAsync(insertUrl, jsonBody);

                if (!insertResponse.IsSuccessStatusCode)
                {
                    var errorBody = await insertResponse.Content.ReadAsStringAsync();
                    _logger.LogError($"Failed to insert audit log into Supabase. Status: {insertResponse.StatusCode}. Body: {errorBody}");
                }
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "[AUDIT-SYNC] Critical error in ProcessTransactionAsync");
            }
        }
    }

    internal class VisitorLookup
    {
        [System.Text.Json.Serialization.JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("unit_id")]
        public string UnitId { get; set; } = string.Empty;
    }
}
