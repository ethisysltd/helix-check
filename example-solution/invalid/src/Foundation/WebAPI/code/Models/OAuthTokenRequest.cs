namespace Helixbase.Foundation.WebAPI.Models
{
    public class OAuthTokenRequest
    {
        public string ClientId { get; set; }
        public string ClientSecret { get; set; }
        public string GrantType { get; set; }
        public string Scope { get; set; }
    }
}