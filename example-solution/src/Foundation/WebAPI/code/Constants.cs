namespace Helixbase.Foundation.WebAPI
{
    public class Constants
    {
        public struct OAuthApi
        {
            public const int DefaultTokenTimeout = 100;

            public struct Errors
            {
                public const string UnsupportedGrantType = "unsupported_grant_type";
                public const string UnauthorizedClient = "unauthorized_client";
                public const string InvalidClient = "invalid_client";
                public const string AccessDenied = "access_denied";
            }
        }
    }
}