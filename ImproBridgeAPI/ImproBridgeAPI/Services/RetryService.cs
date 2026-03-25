using System.Collections.Concurrent;
using ImproBridgeAPI.Models;

namespace ImproBridgeAPI.Services
{
    public class RetryService : BackgroundService
    {
        private static readonly ConcurrentQueue<(VisitorRequest Request, int Attempts)> _retryQueue = new();
        private const int MaxRetries = 5;
        private readonly ILogger<RetryService> _logger;
        private readonly IServiceProvider _serviceProvider;

        public RetryService(ILogger<RetryService> logger, IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        public static void EnqueueFailedRequest(VisitorRequest request)
        {
            _retryQueue.Enqueue((request, 0));
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                if (_retryQueue.TryDequeue(out var item))
                {
                    _logger.LogInformation("[Retry Queue] Attempt {A}/{M} for {N} {L}...",
                        item.Attempts + 1, MaxRetries, item.Request.FirstName, item.Request.LastName);
                    
                    try
                    {
                        using var scope = _serviceProvider.CreateScope();
                        var improService = scope.ServiceProvider.GetRequiredService<IImproCommandService>();
                        var success = improService.SyncUser(item.Request, "background-token");

                        if (success)
                        {
                            _logger.LogInformation("[Retry Queue] Successfully processed offline request for {N}.", item.Request.FirstName);
                        }
                        else if (item.Attempts + 1 < MaxRetries)
                        {
                            _logger.LogWarning("[Retry Queue] Attempt {A}/{M} failed. Re-queueing.", item.Attempts + 1, MaxRetries);
                            _retryQueue.Enqueue((item.Request, item.Attempts + 1));
                        }
                        else
                        {
                            _logger.LogError("[Retry Queue] Exhausted {M} retries for {N} {L}. Dropping request.",
                                MaxRetries, item.Request.FirstName, item.Request.LastName);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "[Retry Queue] Exception encountered");
                        if (item.Attempts + 1 < MaxRetries)
                        {
                            _retryQueue.Enqueue((item.Request, item.Attempts + 1));
                        }
                        else
                        {
                            _logger.LogError("[Retry Queue] Dropping request after {M} retries due to exception.", MaxRetries);
                        }
                    }
                }

                // Poll every 30 seconds
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
        }
    }
}
