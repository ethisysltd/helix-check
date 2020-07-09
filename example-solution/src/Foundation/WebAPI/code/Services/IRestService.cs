using System.Collections.Generic;
using RestSharp;

namespace Helixbase.Foundation.WebAPI.Services
{
    public interface IRestService
    {
        IRestClient Client { get; set; }

        IRestRequest Create(Method method, string url, string jsonBody = null, KeyValuePair<string, string>[] segments = null, KeyValuePair<string, string>[] headers = null);

        IRestRequest Create(string url, KeyValuePair<string, string>[] segments = null, KeyValuePair<string, string>[] headers = null);

        IRestResponse<T> Execute<T>(Method method, string url, string jsonBody = null, KeyValuePair<string, string>[] segments = null, KeyValuePair<string, string>[] headers = null) where T : new();

        IRestResponse<T> Execute<T>(IRestRequest request) where T : new();

        void Configure(string baseUrl, string userName = null, string password = null);

        void SetCredentials(string userName, string password);

    }
}
