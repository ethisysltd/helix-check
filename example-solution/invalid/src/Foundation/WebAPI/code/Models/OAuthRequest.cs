namespace Helixbase.Foundation.WebAPI.Models
{
    public class OAuthRequest : OAuthTokenRequest
    {
        public string OauthHost { get; set; }
        public string OauthEndPoint { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
    }
}