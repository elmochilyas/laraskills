# Metadata
Domain: API Integration Engineering
Subdomain: HTTP Client & API Consumption Patterns
Knowledge Unit: OAuth2 Client Credentials Flow for Server-to-Server Auth
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
The OAuth2 Client Credentials grant is the standard authentication mechanism for server-to-server API communication, where an application (client) authenticates directly to an authorization server without user involvement. In the Laravel ecosystem, this flow is implemented via SaloonPHP's OAuth2 plugin, Laravel's HTTP client with manual token management, or vendor-specific SDKs. The pattern involves obtaining a short-lived access token (typically 1 hour) using client ID and secret, then presenting the token in subsequent API requests.

## Core Concepts
- **Client Credentials Grant** (RFC 6749 §4.4): Client authenticates using its own credentials, no user delegation
- **Access Token**: Short-lived bearer credential presented in `Authorization: Bearer <token>` header
- **Token Expiry**: Tokens expire (typically 3600 seconds); clients must refresh before expiry
- **Scope**: Permission boundaries requested from the authorization server
- **Client ID + Secret**: Static credentials used to obtain tokens, stored as environment variables
- **Token Endpoint**: Server URL (`/oauth/token` or `/token`) where tokens are obtained

## Mental Models
- **API Key Replacement**: Client credentials replace persistent API keys with time-limited tokens
- **Two-Phase Handshake**: Phase 1 (authenticate + get token), Phase 2 (use token for API calls)
- **Lease Pattern**: The token is a time-limited lease that must be periodically renewed

## Internal Mechanics
- Token request: `POST /token` with `grant_type=client_credentials`, `client_id`, `client_secret`, `scope`
- Token response: JSON with `access_token`, `token_type` (bearer), `expires_in` (seconds), optional `scope`
- Token refreshing: Same endpoint with same parameters; server returns new token (may invalidate old one)
- Token injection: Every API request includes `Authorization: Bearer <access_token>` header
- Saloon's OAuth2 plugin manages this lifecycle automatically with a `Token` object storing value + expiry

## Patterns
- **Automatic Token Refresh**: Cache the token and refresh transparently before expiry
- **Token Storage in Cache**: Store tokens in Redis/Database to persist across requests and workers
- **Retry with Refresh**: On 401 response, refresh token and retry the request once before failing
- **Scope as Configuration**: Request minimum scopes needed; avoid over-scoping
- **Client Credentials Per Environment**: Separate client ID/secret pairs for development, staging, production

## Architectural Decisions
- Use SaloonPHP OAuth2 plugin for automatic token management rather than manual implementation
- Cache tokens (Redis or Database) to avoid obtaining a new token per worker/job
- Refresh tokens before expiry, not after (use a safety margin of 5-10% of TTL)
- Use PKCE only for authorization code flows (user delegation), not client credentials
- Rotate client secrets periodically and support multiple active secrets during transition

## Tradeoffs
- Client credentials grant provides no user-specific context; use authorization code grant when user delegation is needed
- Short token TTLs increase security but also increase token request frequency and latency
- Caching tokens adds complexity but is essential for performance at scale
- Saloon OAuth2 plugin adds dependency but eliminates manual token management code

## Performance Considerations
- Token endpoint call adds 50-200ms latency before the first API call; cache eliminates this for subsequent calls
- Token refresh during API call processing adds latency variability; pre-warm caches on worker boot
- Concurrent token refresh requests create thundering herd; use `Cache::lock()` to prevent
- Memory cache (array) per request avoids repeated Redis calls within same request lifecycle

## Production Considerations
- Never log `client_secret` or `access_token` values; redact in all log outputs
- Set up monitoring for token endpoint failures and 401 responses (indicating token issues)
- Use separate OAuth2 credentials per environment with appropriate scope restrictions
- Implement automatic retry with token refresh on 401 responses (tokens may expire between cache check and use)
- Store refresh configuration per service to handle different TTLs and endpoint URLs

## Common Mistakes
- Assuming tokens never expire and not handling 401 responses gracefully
- Making a token request for every API call, defeating the purpose of token-based auth
- Exposing client credentials in code, logs, or error responses
- Requesting excessive scopes that could be exploited if tokens are compromised
- Not handling token endpoint rate limiting (some providers rate-limit token requests)

## Failure Modes
- Token endpoint is down; all API calls fail until token cache expires and refreshing is required
- Clock skew between servers causes token validation failures (timestamps compared)
- Token stored in distributed cache may be corrupted or serialized differently between application versions
- Client secret rotated without updating environment variables causes silent authentication failures
- Provider revokes tokens mid-TTL without notification (security event, account issue)

## Ecosystem Usage
- Stripe API uses OAuth2 with client credentials for platform accounts
- GitHub API supports OAuth2 with application tokens and installation access tokens
- Google APIs require OAuth2 (client credentials for server-to-server, often with JWT bearer assertion)
- Microsoft Graph API uses OAuth2 client credentials for application permissions
- SaloonPHP OAuth2 plugin supports client credentials, authorization code, and custom grants
- Laravel Socialite primarily handles user-facing OAuth2; Pulse/Telescope use it differently

## Related Knowledge Units
- K001: Laravel Http Facade API (transport for token requests and authenticated API calls)
- K010: SaloonPHP Connector/Request/Response Pattern (OAuth2 plugin context)
- K002: Guzzle HTTP Client Internals (transport layer for OAuth2 flows)

## Research Notes
- OAuth2 RFC 6749 §4.4 defines the client credentials grant; it is the simplest OAuth2 flow
- PKCE (RFC 7636) is for authorization code flows only, not client credentials
- Token introspection (RFC 7662) allows validating tokens without making API calls
- JWT bearer token exchange (RFC 7523) is an alternative pattern using signed assertions instead of client secrets
