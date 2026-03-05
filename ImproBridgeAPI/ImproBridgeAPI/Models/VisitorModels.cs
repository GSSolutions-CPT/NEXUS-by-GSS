namespace ImproBridgeAPI.Models
{
    public class VisitorRequest
    {
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PinCode { get; set; } = string.Empty; 
        public string StartDateTime { get; set; } = string.Empty; // Format: yyyyMMddHHmmss
        public string ExpiryDateTime { get; set; } = string.Empty; // Format: yyyyMMddHHmmss
        public int[] AccessGroupIds { get; set; } = Array.Empty<int>();
    }
}
