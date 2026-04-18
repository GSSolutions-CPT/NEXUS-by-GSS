using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using ImproBridgeAPI.Models;

namespace ImproBridgeAPI.Services
{
    public class VisitorSyncWorker : BackgroundService
    {
        private readonly ILogger<VisitorSyncWorker> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public VisitorSyncWorker(ILogger<VisitorSyncWorker> logger, IServiceProvider serviceProvider, IConfiguration configuration, HttpClient httpClient)
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
            _logger.LogInformation("Visitor Pull Sync Worker is starting. Using 30-second HTTP polling.");

            // Small startup delay to let the app fully initialize
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

            // Polling loop — check for pending visitors every 30 seconds
            int consecutiveFailures = 0;
            const int baseDelaySeconds = 30;
            const int maxDelaySeconds = 300;

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogWarning("[VISITOR-POLL] Starting poll cycle...");
                    await ProcessPendingVisitorsAsync(stoppingToken);
                    _logger.LogWarning("[VISITOR-POLL] Poll cycle complete. Next poll in {Delay}s.", baseDelaySeconds);
                    consecutiveFailures = 0;
                }
                catch (Exception ex)
                {
                    consecutiveFailures++;
                    var backoffSeconds = Math.Min(baseDelaySeconds * (int)Math.Pow(2, consecutiveFailures - 1), maxDelaySeconds);
                    _logger.LogError(ex, "[VISITOR-POLL] Polling FAILED (attempt {Attempt}). Next retry in {Delay}s.", consecutiveFailures, backoffSeconds);
                    await Task.Delay(TimeSpan.FromSeconds(backoffSeconds), stoppingToken);
                    continue;
                }

                await Task.Delay(TimeSpan.FromSeconds(baseDelaySeconds), stoppingToken);
            }

            _logger.LogInformation("Visitor Pull Sync Worker is stopping.");
        }

        private async Task ProcessPendingVisitorsAsync(CancellationToken stoppingToken)
        {
            _logger.LogWarning("[VISITOR-POLL] Calling Supabase RPC get_pending_visitors_for_sync...");
            var rpcUrl = "/rest/v1/rpc/get_pending_visitors_for_sync";
            var response = await _httpClient.PostAsync(rpcUrl, null, stoppingToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning($"[VISITOR-POLL] RPC FAILED. Status: {response.StatusCode}");
                return;
            }

            var content = await response.Content.ReadAsStringAsync(stoppingToken);
            _logger.LogWarning("[VISITOR-POLL] RPC response: {Content}", content?.Substring(0, Math.Min(content?.Length ?? 0, 500)));
            var pendingVisitors = JsonSerializer.Deserialize<List<PendingVisitor>>(content);

            if (pendingVisitors == null || !pendingVisitors.Any())
            {
                _logger.LogWarning("[VISITOR-POLL] No pending visitors found. Sleeping.");
                return; 
            }

            _logger.LogInformation($"Found {pendingVisitors.Count} pending visitor(s) to sync to physical hardware.");

            using var scope = _serviceProvider.CreateScope();
            var improService = scope.ServiceProvider.GetRequiredService<IImproCommandService>();

            foreach (var visitor in pendingVisitors)
            {
                bool syncSuccess = false;
                try
                {
                    _logger.LogInformation($"Processing Visitor {visitor.FirstName} {visitor.LastName} (PIN: {visitor.PinCode})");

                    // FIXED: Queried correct table 'unit_access_mapping' instead of 'unit_access_groups'
                    var groupsUrl = $"/rest/v1/unit_access_mapping?unit_id=eq.{visitor.UnitId}&select=access_group_id";
                    var groupsResponse = await _httpClient.GetAsync(groupsUrl, stoppingToken);
                    
                    // FIXED: Removed Mock Data fallback. Start empty.
                    var accessGroupIds = new List<int>(); 

                    if (groupsResponse.IsSuccessStatusCode)
                    {
                        var groupsContent = await groupsResponse.Content.ReadAsStringAsync(stoppingToken);
                        var groups = JsonSerializer.Deserialize<List<UnitAccessGroup>>(groupsContent);
                        if (groups != null && groups.Any())
                        {
                            accessGroupIds = groups.Select(g => g.AccessGroupId).ToList();
                        }
                    }

                    // SECURITY: Do not sync a user to hardware if they have no access mapped
                    if (!accessGroupIds.Any())
                    {
                        _logger.LogWarning($"Visitor {visitor.Id} has no physical access groups mapped to their unit. Aborting hardware sync.");
                        syncSuccess = false;
                    }
                    else
                    {
                        var visitorRequest = new VisitorRequest
                        {
                            FirstName = visitor.FirstName,
                            LastName = visitor.LastName,
                            Phone = visitor.Phone,
                            PinCode = visitor.PinCode,
                            // FIXED: Mapped to correct ExpiryTime variable
                            ExpiryDateTime = visitor.ExpiryTime.ToString("yyyyMMddHHmmss"),
                            AccessGroupIds = accessGroupIds.ToArray()
                        };

                        string internalToken = "worker-service-token";

                        var userSynced = improService.SyncUser(visitorRequest, internalToken);
                        
                        if (userSynced)
                        {
                            foreach (var groupId in visitorRequest.AccessGroupIds)
                            {
                                improService.AssignAccessGroup(visitorRequest.PinCode, groupId, internalToken);
                            }

                            string expiryDateStr = visitorRequest.ExpiryDateTime.Substring(0, 8);
                            string expiryTimeStr = visitorRequest.ExpiryDateTime.Substring(8, 6);

                            string safeFirstName = System.Security.SecurityElement.Escape(visitorRequest.FirstName);
                            string safeLastName = System.Security.SecurityElement.Escape(visitorRequest.LastName);
                            string safePinCode = System.Security.SecurityElement.Escape(visitorRequest.PinCode);

                            string xmlPayload = $@"<?xml version=""1.0"" encoding=""UTF-8"" standalone=""yes""?>
                            <protocol id=""82945242"" version=""1.0"">
                              <dbupdate>
                                <Master id=""0"" current=""1"" firstName=""{safeFirstName}"" lastName=""{safeLastName}"">
                                 <tag id=""0"" tagCode=""{safePinCode}"" expiryDate=""{expiryDateStr}"" expiryTime=""{expiryTimeStr}"" />
                                </Master>
                                <withClause>tags</withClause>
                              </dbupdate>
                            </protocol>";

                            syncSuccess = improService.PerformAction(xmlPayload, internalToken);
                        }
                        else
                        {
                            _logger.LogError($"Failed to sync Master record for visitor {visitor.Id}");
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Hardware synchronization failed completely for visitor {visitor.Id}");
                    syncSuccess = false;
                }

                // FIXED: Must match the CHECK constraint in the Postgres DB ('Active' or 'Revoked')
                // Previous values ("active", "sync_failed") would crash the database on update.
                var finalStatus = syncSuccess ? "Active" : "Revoked";
                _logger.LogInformation($"Updating Visitor {visitor.Id} status to {finalStatus} in Supabase.");

                var patchBody = new { status = finalStatus };
                var jsonBody = new StringContent(JsonSerializer.Serialize(patchBody), Encoding.UTF8, "application/json");
                
                var patchUrl = $"/rest/v1/visitors?id=eq.{visitor.Id}";
                var patchResponse = await _httpClient.PatchAsync(patchUrl, jsonBody, stoppingToken);

                if (!patchResponse.IsSuccessStatusCode)
                {
                    _logger.LogError($"Failed to update visitor status in cloud. Status Code: {patchResponse.StatusCode}");
                }
            }
        }
    }
}
