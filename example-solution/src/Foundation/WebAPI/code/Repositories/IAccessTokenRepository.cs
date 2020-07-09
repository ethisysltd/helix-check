using System.Collections.Generic;
using Helixbase.Foundation.WebAPI.Models;
using RestSharp;

namespace Helixbase.Foundation.WebAPI.Repositories
{
    public interface IAccessTokenRepository
    {
        string GetAccessToken(Method method, OAuthRequest oauthRequest = null,
            KeyValuePair<string, string>[] headerKeys = null, bool forceRefresh = false);
    }
}
