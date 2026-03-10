using ImproBridgeAPI.Models;
using ImproBridgeAPI.Services;
using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;

namespace ImproBridgeAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImproController : ControllerBase
    {
        private readonly IImproCommandService _improService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ImproController> _logger;

        public ImproController(IImproCommandService improService, IConfiguration configuration, ILogger<ImproController> logger)
        {
            _improService = improService;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Validates an HMAC-SHA256 signature to authenticate the caller.
        /// The caller must include:
        ///   X-Bridge-Timestamp: Unix timestamp (seconds, UTC)
        ///   X-Bridge-Signature: HMAC-SHA256(secret, "{timestamp}:{endpoint}")
        /// Signatures older than 5 minutes are rejected to prevent replay attacks.
        /// </summary>
        private bool ValidateHmac(string endpoint)
        {
            var secret = _configuration["SupabaseSharedSecret"];
            if (string.IsNullOrEmpty(secret)) return false;

            if (!Request.Headers.TryGetValue("X-Bridge-Timestamp", out var tsHeader) ||
                !Request.Headers.TryGetValue("X-Bridge-Signature", out var sigHeader))
                return false;

            if (!long.TryParse(tsHeader, out long timestamp)) return false;

            // Reject requests older than 5 minutes (replay protection)
            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            if (Math.Abs(now - timestamp) > 300)
            {
                _logger.LogWarning("HMAC timestamp too old or too far in future. Possible replay attack. ts={ts}", timestamp);
                return false;
            }

            var message = $"{timestamp}:{endpoint}";
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
            var expectedSig = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(message))).ToLowerInvariant();
            var providedSig = sigHeader.ToString().ToLowerInvariant();

            // Constant-time comparison to prevent timing attacks
            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(expectedSig),
                Encoding.UTF8.GetBytes(providedSig)
            );
        }

        [HttpPost("auth")]
        public IActionResult Authenticate()
        {
            if (!ValidateHmac("auth"))
            {
                _logger.LogWarning("Authentication failed — invalid or expired HMAC signature.");
                return Unauthorized(new { Message = "Invalid or expired request signature" });
            }

            _logger.LogInformation("Successfully authenticated incoming request via HMAC.");
            return Ok(new AuthResponse { Token = "mock-hardware-token", Message = "Authenticated with Server" });
        }

        [HttpGet("access-groups")]
        public IActionResult GetAccessGroups([FromHeader(Name = "Authorization")] string token)
        {
            try 
            {
                _logger.LogInformation("Fetching access groups from Impro Hardware.");
                var result = _improService.GetAccessGroups(token);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch access groups.");
                return StatusCode(500, "Internal Server Error");
            }
        }

        [HttpPost("visitor")]
        public IActionResult CreateVisitor([FromBody] VisitorRequest request, [FromHeader(Name = "Authorization")] string token)
        {
            try 
            {
                _logger.LogInformation($"Attempting to sync visitor: {request.FirstName} {request.LastName}");

                // Sync the user to hardware first
                var userSynced = _improService.SyncUser(request, token);
                if (!userSynced) 
                {
                    _logger.LogError("Failed to sync user to hardware.");
                    return StatusCode(500, "Failed to sync user to hardware.");
                }

                // Then map their access groups
                foreach (var groupId in request.AccessGroupIds)
                {
                    _logger.LogInformation($"Assigning Access Group {groupId} to PIN {request.PinCode}");
                    _improService.AssignAccessGroup(request.PinCode, groupId, token);
                }

                // Finally, Build the XML payload modeled exactly after the Postman "insertMasterWithTag" example for final tag linkage
                string xmlPayload = $@"<?xml version=""1.0"" encoding=""UTF-8"" standalone=""yes""?>
                <protocol id=""82945242"" version=""1.0"">
                  <dbupdate>
                    <Master id=""0"" current=""1"" firstName=""{request.FirstName}"" lastName=""{request.LastName}"">
                     <tag id=""0"" tagCode=""{request.PinCode}"" expiryDate=""{request.ExpiryDateTime.Substring(0, 8)}"" expiryTime=""{request.ExpiryDateTime.Substring(8, 6)}"" />
                    </Master>
                    <withClause>tags</withClause>
                  </dbupdate>
                </protocol>";

                var success = _improService.PerformAction(xmlPayload, token);

                if (success) {
                    _logger.LogInformation("Successfully pushed Visitor to Hardware");
                    return Ok(new { Message = "Successfully pushed Visitor to Hardware" });
                }

                _logger.LogError("Failed to push XML payload to Impro API");
                return StatusCode(500, "Failed to push to Impro API");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Exception occurred while processing CreateVisitor for {request.FirstName} {request.LastName}");
                return StatusCode(500, "Internal Server Error");
            }
        }
        
        [HttpDelete("visitor/{tagCode}")]
        public IActionResult RevokeVisitor(string tagCode, [FromHeader(Name = "Authorization")] string token)
        {
            try
            {
                _logger.LogInformation($"Attempting to revoke Visitor Tag: {tagCode}");
                var success = _improService.RevokeVisitor(tagCode, token);
                if (success) {
                    _logger.LogInformation($"Successfully revoked Visitor Tag {tagCode}.");
                    return Ok(new { Message = $"Visitor Tag {tagCode} revoked." });
                }
                
                _logger.LogError($"Failed to revoke tag {tagCode}");
                return StatusCode(500, "Failed to revoke tag.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Exception occurred while revoking visitor tag {tagCode}");
                return StatusCode(500, "Internal Server Error");
            }
        }

        [HttpPost("door/open")]
        public IActionResult OpenDoor([FromBody] Models.DoorRequest request, [FromHeader(Name = "Authorization")] string token)
        {
            try
            {
                 _logger.LogInformation($"Attempting to send OpenDoor command for Relay ID: {request.RelayId}");
                 // Build the <iprxmessage command="OPEN_DOOR"> payload
                 var success = _improService.OpenDoor(request.RelayId, token);
                 if (success) {
                     _logger.LogInformation($"Hardware command sent successfully for Relay {request.RelayId}.");
                     return Ok(new { Message = $"Hardware command sent for Relay {request.RelayId}."});
                 }
                 
                 _logger.LogError($"Failed to trigger hardware relay for Relay ID: {request.RelayId}");
                 return StatusCode(500, "Failed to trigger hardware relay.");
            }
             catch (Exception ex)
            {
                _logger.LogError(ex, $"Exception occurred while attempting to open door relay {request.RelayId}");
                return StatusCode(500, "Internal Server Error");
            }
        }
    }
}
