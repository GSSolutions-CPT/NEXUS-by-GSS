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
            _logger.LogInformation("Visitor Pull Sync Worker is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessPendingVisitorsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An error occurred while attempting to poll for pending visitors.");
                }

                // Poll every 60 seconds
                await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);
            }

            _logger.LogInformation("Visitor Pull Sync Worker is stopping.");
        }

        private async Task ProcessPendingVisitorsAsync(CancellationToken stoppingToken)
        {
            // 1. Fetch pending visitors using Supabase REST API (PostgREST)
            var getTaskUrl = "/rest/v1/visitors?status=eq.pending_sync&select=*";
            var response = await _httpClient.GetAsync(getTaskUrl, stoppingToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning($"Failed to query Supabase for pending visitors. Status Code: {response.StatusCode}");
                return;
            }

            var content = await response.Content.ReadAsStringAsync(stoppingToken);
            var pendingVisitors = JsonSerializer.Deserialize<List<PendingVisitor>>(content);

            if (pendingVisitors == null || !pendingVisitors.Any())
            {
                return; // Nothing to do
            }

            _logger.LogInformation($"Found {pendingVisitors.Count} pending visitor(s) to sync to physical hardware.");

            // 2. We need a scoped IImproCommandService because this is a singleton hosted service
            using var scope = _serviceProvider.CreateScope();
            var improService = scope.ServiceProvider.GetRequiredService<IImproCommandService>();

            foreach (var visitor in pendingVisitors)
            {
                bool syncSuccess = false;
                try
                {
                    _logger.LogInformation($"Processing Visitor {visitor.FirstName} {visitor.LastName} (PIN: {visitor.PinCode})");

                    // 2a. Fetch their unit's allowed access groups
                    var groupsUrl = $"/rest/v1/unit_access_groups?unit_id=eq.{visitor.UnitId}&select=access_group_id";
                    var groupsResponse = await _httpClient.GetAsync(groupsUrl, stoppingToken);
                    var accessGroupIds = new List<int> { 1, 2 }; // Default fallbacks

                    if (groupsResponse.IsSuccessStatusCode)
                    {
                        var groupsContent = await groupsResponse.Content.ReadAsStringAsync(stoppingToken);
                        var groups = JsonSerializer.Deserialize<List<UnitAccessGroup>>(groupsContent);
                        if (groups != null && groups.Any())
                        {
                            accessGroupIds = groups.Select(g => g.AccessGroupId).ToList();
                        }
                    }

                    // 2b. Sync User to Hardware
                    var visitorRequest = new VisitorRequest
                    {
                        FirstName = visitor.FirstName,
                        LastName = visitor.LastName,
                        Phone = visitor.Phone,
                        PinCode = visitor.PinCode,
                        ExpiryDateTime = visitor.ValidUntil.ToString("yyyyMMddHHmmss"),
                        AccessGroupIds = accessGroupIds.ToArray()
                    };

                    // We use an internal fake token since we are initiating from the server itself. 
                    // In a highly secure real-world system, Impro API credentials would be directly used here.
                    string internalToken = "worker-service-token";

                    var userSynced = improService.SyncUser(visitorRequest, internalToken);
                    
                    if (userSynced)
                    {
                        // 2c. Map Access Groups
                        foreach (var groupId in visitorRequest.AccessGroupIds)
                        {
                            improService.AssignAccessGroup(visitorRequest.PinCode, groupId, internalToken);
                        }

                        // 2d. Construct XML payload for tag sync
                        string expiryDateStr = visitorRequest.ExpiryDateTime.Substring(0, 8);
                        string expiryTimeStr = visitorRequest.ExpiryDateTime.Substring(8, 6);

                        string xmlPayload = $@"<?xml version=""1.0"" encoding=""UTF-8"" standalone=""yes""?>
                        <protocol id=""82945242"" version=""1.0"">
                          <dbupdate>
                            <Master id=""0"" current=""1"" firstName=""{visitorRequest.FirstName}"" lastName=""{visitorRequest.LastName}"">
                             <tag id=""0"" tagCode=""{visitorRequest.PinCode}"" expiryDate=""{expiryDateStr}"" expiryTime=""{expiryTimeStr}"" />
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
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Hardware synchronization failed completely for visitor {visitor.Id}");
                    syncSuccess = false;
                }

                // 3. Status Callback to Supabase
                var finalStatus = syncSuccess ? "active" : "sync_failed";
                _logger.LogInformation($"Updating Visitor {visitor.Id} status to {finalStatus} in Supabase.");

                var patchBody = new { status = finalStatus };
                var jsonBody = new StringContent(JsonSerializer.Serialize(patchBody), Encoding.UTF8, "application/json");
                
                // PostgREST Patch requires a Preferences header to return representation or just nothing, default is fine.
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
