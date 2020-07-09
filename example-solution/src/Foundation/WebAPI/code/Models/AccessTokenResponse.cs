using RestSharp.Deserializers;

namespace Helixbase.Foundation.WebAPI.Models
{
    public class AccessTokenResponse
    {
        [DeserializeAs(Name = "access_token")]
        public string AccessToken { get; set; }

        [DeserializeAs(Name = "refresh_token")]
        public string RefreshToken { get; set; }

        [DeserializeAs(Name = "token_type")]
        public string TokenType { get; set; }

        [DeserializeAs(Name = "expires_in")]
        public string ExpiresIn { get; set; }

        [DeserializeAs(Name = "error_description")]
        public string ErrorDescription { get; set; }

        [DeserializeAs(Name = "error")]
        public string Error { get; set; }
    }
}