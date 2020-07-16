using System;
using System.Collections.Generic;
using System.Diagnostics;
using Helixbase.Foundation.Logging.Repositories;
using Helixbase.Foundation.WebAPI.Models;
using Helixbase.Foundation.WebAPI.Services;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using RestSharp;

namespace Helixbase.Foundation.WebAPI.Repositories
{
    public class AccessTokenRepository : IAccessTokenRepository
    {
        private static readonly object Lock = new object();

        private readonly IRestService _restService;
        private readonly ILogRepository _logRepository;

        private string _accessToken;
        private string _refreshToken;
        private string _tokenType;

        private int _expiresInSeconds = Constants.OAuthApi.DefaultTokenTimeout;

        /// <summary>
        /// Last refresh call time
        /// </summary>
        private DateTime _lastRefreshTime;

        /// <summary>
        /// Last received token response
        /// </summary>
        private AccessTokenResponse _lastAccessTokenResponse;

        //TODO: Refactor the business logic into a service
        public AccessTokenRepository(IRestService restService, ILogRepository logRepository)
        {
            _restService = restService;
            _logRepository = logRepository;
        }

        public void RefreshAccessToken(Method method, OAuthRequest oauthRequest, KeyValuePair<string, string>[] headerKeys)
        {
            _logRepository.Info("Refreshing Access Token");

            var stopWatch = new Stopwatch();
            stopWatch.Start();

            // var headerKeys = new[]
            //{
            //      new KeyValuePair<string, string>("granttype", oauthRequest.GrantType),
            //     new KeyValuePair<string, string>("clientid", oauthRequest.ClientId),
            //     new KeyValuePair<string, string>("clientsecret", oauthRequest.ClientSecret),
            //     new KeyValuePair<string, string>("scope", oauthRequest.Scope)
            //     //new KeyValuePair<string, string>("username", oauthRequest.Username),
            //     //new KeyValuePair<string, string>("password", oauthRequest.Password)
            // };

            //var jsonBody = JsonConvert.SerializeObject(oauthRequest);
            var jsonSerialiser = new JsonSerializer { NullValueHandling = NullValueHandling.Ignore };
            var jsonBody = JObject.FromObject(oauthRequest, jsonSerialiser).ToString();

            //OauthHost e.g. to https://dm-upload3.basichosting.co.uk
            _restService.Configure(oauthRequest.OauthHost);

            //OauthEndPoint e.g. /vouch/connect/token
            var response = _restService.Execute<AccessTokenResponse>(method, oauthRequest.OauthEndPoint, jsonBody, null, headerKeys);

            stopWatch.Stop();
            _logRepository.Info($"Refreshed Access Token in {stopWatch.ElapsedMilliseconds}ms");
            _logRepository.Info($"Refreshed Access Token Content in: {response.Content}");

            _lastAccessTokenResponse = response.Data;

            if (_lastAccessTokenResponse != null && string.IsNullOrEmpty(_lastAccessTokenResponse.Error))
            {
                _accessToken = $"{_lastAccessTokenResponse.TokenType} {_lastAccessTokenResponse.AccessToken}";
                _refreshToken = _lastAccessTokenResponse.RefreshToken;
                _tokenType = _lastAccessTokenResponse.TokenType;
                int.TryParse(_lastAccessTokenResponse.ExpiresIn, out _expiresInSeconds);
                _expiresInSeconds = _expiresInSeconds - 5; //No point taking the tokens validity to the wire.

                _lastRefreshTime = DateTime.Now;
            }

            else if (_lastAccessTokenResponse != null)
            {
                switch (_lastAccessTokenResponse.Error)
                {
                    case Constants.OAuthApi.Errors.AccessDenied:
                        _logRepository.Error($"OAuth: Access denied for specified credentials ({oauthRequest.Username} / {oauthRequest.Password})");
                        break;

                    case Constants.OAuthApi.Errors.InvalidClient:
                        _logRepository.Error($"OAuth: Specified clientsecret is invalid ({oauthRequest.ClientSecret}) : {_lastAccessTokenResponse.ErrorDescription}");
                        break;

                    case Constants.OAuthApi.Errors.UnauthorizedClient:
                        _logRepository.Error($"OAuth: Specified clientid is unauthorized ({oauthRequest.ClientSecret}) : {_lastAccessTokenResponse.ErrorDescription}");
                        break;

                    case Constants.OAuthApi.Errors.UnsupportedGrantType:
                        _logRepository.Error($"OAuth: Specified granttype is unsupported ({oauthRequest.ClientSecret}) : {_lastAccessTokenResponse.ErrorDescription}");
                        break;
                }
            }

            else
            {
                _logRepository.Error("OAuth: Error occured while accessing API");
            }

        }

        /// <summary>
        /// Returns up to date access token
        /// </summary>
        /// <returns>Access token</returns>
        public string GetAccessToken(Method method, OAuthRequest oauthRequest = null, KeyValuePair<string, string>[] headerKeys = null, bool forceRefresh = false)
        {
            if (forceRefresh || string.IsNullOrEmpty(_accessToken) || DateTime.Compare(_lastRefreshTime.AddSeconds(_expiresInSeconds), DateTime.Now) <= 0)
            {
                lock (Lock)
                {
                    if (forceRefresh || string.IsNullOrEmpty(_accessToken) || DateTime.Compare(_lastRefreshTime.AddSeconds(_expiresInSeconds), DateTime.Now) <= 0)
                    {
                        RefreshAccessToken(method, oauthRequest, headerKeys);
                    }
                }
            }

            return _accessToken;
        }
    }
}