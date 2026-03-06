using System.Text.Json.Serialization;

namespace ImproBridgeAPI.Models
{
    /// <summary>
    /// Represents a single transaction/event from the Impro hardware.
    /// Maps to the fields returned by the PortalAPI getTransactions HQL query.
    /// </summary>
    public class HardwareTransaction
    {
        public int Id { get; set; }
        public string TagCode { get; set; } = string.Empty;
        public string MasterName { get; set; } = string.Empty;
        public string DoorName { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty; // e.g., "ACCESS_GRANTED", "ACCESS_DENIED", "DOOR_OPENED"
        public DateTime Timestamp { get; set; }
    }

    /// <summary>
    /// Payload for inserting an audit log into Supabase.
    /// Must match the `audit_logs` table schema exactly.
    /// </summary>
    public class AuditLogPayload
    {
        [JsonPropertyName("action")]
        public string Action { get; set; } = string.Empty;

        [JsonPropertyName("timestamp")]
        public string Timestamp { get; set; } = string.Empty;

        [JsonPropertyName("visitor_id")]
        public string? VisitorId { get; set; }

        [JsonPropertyName("unit_id")]
        public string? UnitId { get; set; }
    }
}
