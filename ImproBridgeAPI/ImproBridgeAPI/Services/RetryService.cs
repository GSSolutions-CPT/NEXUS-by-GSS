using ImproBridgeAPI.Models;

namespace ImproBridgeAPI.Services
{
    public class RetryService : BackgroundService
    {
        private static readonly Queue<VisitorRequest> _retryQueue = new Queue<VisitorRequest>();
        private readonly ILogger<RetryService> _logger;
        private readonly IServiceProvider _serviceProvider;

        public RetryService(ILogger<RetryService> logger, IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        public static void EnqueueFailedRequest(VisitorRequest request)
        {
            _retryQueue.Enqueue(request);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                if (_retryQueue.Count > 0)
                {
                    var request = _retryQueue.Dequeue();
                    _logger.LogInformation($"[Retry Queue] Attempting to process queued request for {request.FirstName} {request.LastName}...");
                    
                    try
                    {
                        using (var scope = _serviceProvider.CreateScope())
                        {
                            var improService = scope.ServiceProvider.GetRequiredService<IImproCommandService>();
                            // Try syncing again
                            var success = improService.SyncUser(request, "background-token");
                            if (!success)
                            {
                                 _logger.LogWarning($"[Retry Queue] Processing failed again. Re-queueing.");
                                 _retryQueue.Enqueue(request);
                            }
                            else
                            {
                                 _logger.LogInformation($"[Retry Queue] Successfully processed offline request!");
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "[Retry Queue] Exception encountered");
                        _retryQueue.Enqueue(request); // Re-queue on terminal logic fail
                    }
                }

                // Poll every 30 seconds
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
        }
    }
}
