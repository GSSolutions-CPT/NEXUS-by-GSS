using ImproBridgeAPI.Models;
using ImproBridgeAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace ImproBridgeAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImproController : ControllerBase
    {
        private readonly IImproCommandService _improService;
        private readonly IConfiguration _configuration;

        public ImproController(IImproCommandService improService, IConfiguration configuration)
        {
            _improService = improService;
            _configuration = configuration;
        }

        [HttpPost("auth")]
        public IActionResult Authenticate([FromBody] AuthRequest request)
        {
            // Security Check: Ensure only Supabase/Next.js can call this local bridge
            var sharedSecret = _configuration["SupabaseSharedSecret"];
            if (request.Password != sharedSecret) 
            {
                return Unauthorized(new { Message = "Invalid Bridge Secret" });
            }

            // In production, fetch the real hardware token via the SDK
            return Ok(new AuthResponse { Token = "mock-hardware-token", Message = "Authenticated with Server" });
        }

        [HttpGet("access-groups")]
        public IActionResult GetAccessGroups([FromHeader(Name = "Authorization")] string token)
        {
            var result = _improService.GetAccessGroups(token);
            return Ok(result);
        }

        [HttpPost("visitor")]
        public IActionResult CreateVisitor([FromBody] VisitorRequest request, [FromHeader(Name = "Authorization")] string token)
        {
            // Sync the user to hardware first
            var userSynced = _improService.SyncUser(request, token);
            if (!userSynced) return StatusCode(500, "Failed to sync user to hardware.");

            // Then map their access groups
            foreach (var groupId in request.AccessGroupIds)
            {
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
                return Ok(new { Message = "Successfully pushed Visitor to Hardware" });
            }
            return StatusCode(500, "Failed to push to Impro API");
        }
        
        [HttpDelete("visitor/{tagCode}")]
        public IActionResult RevokeVisitor(string tagCode, [FromHeader(Name = "Authorization")] string token)
        {
            var success = _improService.RevokeVisitor(tagCode, token);
            if (success) {
                return Ok(new { Message = $"Visitor Tag {tagCode} revoked." });
            }
            return StatusCode(500, "Failed to revoke tag.");
        }

        [HttpPost("door/open")]
        public IActionResult OpenDoor([FromBody] Models.DoorRequest request, [FromHeader(Name = "Authorization")] string token)
        {
             // Build the <iprxmessage command="OPEN_DOOR"> payload
             var success = _improService.OpenDoor(request.RelayId, token);
             if (success) {
                 return Ok(new { Message = $"Hardware command sent for Relay {request.RelayId}."});
             }
             return StatusCode(500, "Failed to trigger hardware relay.");
        }
    }
}
