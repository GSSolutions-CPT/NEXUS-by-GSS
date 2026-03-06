using System.Text.Json.Serialization;

namespace ImproBridgeAPI.Models
{
    public class PendingVisitor
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("unit_id")]
        public string UnitId { get; set; } = string.Empty;

        [JsonPropertyName("first_name")]
        public string FirstName { get; set; } = string.Empty;

        [JsonPropertyName("last_name")]
        public string LastName { get; set; } = string.Empty;

        [JsonPropertyName("phone")]
        public string Phone { get; set; } = string.Empty;

        [JsonPropertyName("pin_code")]
        public string PinCode { get; set; } = string.Empty;

        // FIXED: Maps to actual Supabase DB schema column
        [JsonPropertyName("start_time")]
        public DateTime StartTime { get; set; }

        // FIXED: Maps to actual Supabase DB schema column
        [JsonPropertyName("expiry_time")]
        public DateTime ExpiryTime { get; set; }

        [JsonPropertyName("needs_parking")]
        public bool NeedsParking { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;
    }

    public class UnitAccessGroup
    {
        [JsonPropertyName("access_group_id")]
        public int AccessGroupId { get; set; }
    }
}
