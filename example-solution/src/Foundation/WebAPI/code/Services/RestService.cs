using System;
using System.Collections.Generic;
using System.Net;
using Helixbase.Foundation.WebAPI.Models;
using Newtonsoft.Json;
using RestSharp;
using RestSharp.Authenticators;

namespace Helixbase.Foundation.WebAPI.Services
{
    public class RestService : IRestService
    {
        public Uri BaseUrl { get; protected set; }

        private string _password;
        private string _username;

        private IRestClient _client;

        public RestService() { }
        
        public RestService(string baseUrl, string userName = null, string password = null)
        {
            BaseUrl = new Uri(baseUrl);

            _username = userName;
            _password = password;
        }

        public IRestClient Client
        {
            get
            {
                if (_client != null)
                    return _client;

                _client = new RestClient();

                return _client;
            }

            set { _client = value; }
        }

        /// <summary>
        /// Configures rest service
        /// </summary>
        /// <param name="baseUrl">Base url for API</param>
        /// <param name="userName">User name for HTTP basic authentication</param>
        /// <param name="password">Password for HTTP basic authentication</param>
        public void Configure(string baseUrl, string userName = null, string password = null)
        {
            BaseUrl = new Uri(baseUrl);
            Client.BaseUrl = BaseUrl;

            SetCredentials(userName, password);
        }

        public void SetCredentials(string userName, string password)
        {
            if (!string.IsNullOrEmpty(userName) && !string.IsNullOrEmpty(password))
            {
                _username = userName;
                _password = password;

                _client.Authenticator = new HttpBasicAuthenticator(_username, _password);
            }
        }

        public virtual IRestRequest Create(
            Method method,
            string url,
            string jsonBody = null,
            KeyValuePair<string, string>[] segments = null,
            KeyValuePair<string, string>[] headers = null
            )
        {
            var oAuthRequest = JsonConvert.DeserializeObject<OAuthTokenRequest>(jsonBody);
            var request = new RestRequest(url, method) { RequestFormat = DataFormat.Json };

            if (string.IsNullOrEmpty(jsonBody) || string.IsNullOrEmpty(oAuthRequest.ClientId) && string.IsNullOrEmpty(oAuthRequest.ClientSecret))
            {
                if (segments != null)
                    foreach (var segment in segments)
                        request.AddQueryParameter(segment.Key, segment.Value);

                if (!string.IsNullOrEmpty(jsonBody))
                {
                    request.AddParameter("application/json", jsonBody, ParameterType.RequestBody);
                }

                request.AddHeader("Content-Type", "application/json");
                request.AddHeader("Accept", "application/json");

                if (headers == null) return request;
                foreach (var header in headers)
                {
                    request.AddHeader(header.Key, header.Value);
                }
            }
            else
            {
                //TODO: Refactor these to individual params?
                var param = $"client_id={oAuthRequest.ClientId}&client_secret={oAuthRequest.ClientSecret}&grant_type={oAuthRequest.GrantType}&scope={oAuthRequest.Scope}";
                request.AddParameter("application/x-www-form-urlencoded", param, ParameterType.RequestBody);
            }

            return request;
        }

        public virtual IRestRequest Create(string url, KeyValuePair<string, string>[] segments, KeyValuePair<string, string>[] headers)
        {
            // TODO: refactor method into parameter
            return Create(Method.GET, url, string.Empty, segments, headers);
        }

        public virtual IRestResponse<T> Execute<T>(Method method, string url, string jsonBody = null,
            KeyValuePair<string, string>[] segments = null,
            KeyValuePair<string, string>[] headers = null) where T : new()
        {
            return Execute<T>(Create(method, url, jsonBody, segments, headers));
        }

        public virtual IRestResponse<T> Execute<T>(IRestRequest request) where T : new()
        {
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;

            var response = Client.Execute<T>(request);

            if (response.ResponseStatus != ResponseStatus.Completed)
                ThrowIncompleteResponseException(response);

            if (response.ErrorException != null)
                ThrowErrorException(response);

            return response;
        }

        #region Helpers

        //TODO: REFACTOR THESE
        protected static void ThrowIncompleteResponseException<T>(IRestResponse<T> response)
        {
            var message =
                $@"REST service failed to complete: ""{response.ErrorMessage}"", response status: {
                        response.ResponseStatus
                    }, HTTP status code: {response.StatusCode}.";

            throw new ApplicationException(message);
        }

        protected static void ThrowErrorException(IRestResponse response)
        {
            throw new ApplicationException("Error retrieving response. Check inner details for more info.",
                response.ErrorException);
        }

        #endregion
    }
}