# ECC Standardized Knowledge — OAuth 2.0 Flow for Client Credentials Grant

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | http-client-api-consumption |
| Knowledge Unit ID | ku-05 |
| Knowledge Unit | OAuth 2.0 Flow for Client Credentials Grant |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K001, K004, K016 |

## Overview (Engineering Value)
The OAuth 2.0 Client Credentials grant allows services to authenticate to each other without user involvement. The client exchanges its credentials (client_id + client_secret) for an access token, which is then sent as a Bearer token on subsequent requests. This is the standard M2M pattern for Laravel API integrations.

## Core Concepts
- **Client Credentials Grant**: `grant_type=client_credentials` token endpoint exchange
- **Access Token**: Short-lived bearer token (typically 3600s)
- **Refresh Token**: Long-lived token to obtain new access tokens without re-authenticating
- **Bearer Token**: `Authorization: Bearer <token>` header on each request
- **Token Endpoint**: URL that accepts credentials and returns tokens
- **Scope**: Space-delimited string specifying requested permissions
- **JWT**: Optionally signed JSON token containing claims about the client

## When To Use
- Server-to-server API authentication
- Internal microservice communication
- Third-party API access where user delegation is unnecessary
- Machine-to-machine integrations

## When NOT To Use
- User-facing apps needing delegated auth (use Authorization Code grant)
- Public client apps that can't protect secrets (use PKCE)
- Simple static API keys (overkill)
- When upstream only supports basic auth or custom signing

## Best Practices
- Obtain token lazily (on first request) or eagerly (pre-fetch before expiration)
- Cache tokens with cache stampede protection
- Implement proactive token refresh before expiry (at 50% TTL)
- Store client_id/client_secret in vault, not .env
- Include scope parameter even if not required by upstream
- Handle 401 responses gracefully by retrying once with fresh token

## Architecture Guidelines
- Single token service class per upstream, injected via container
- Token caching with `Cache::remember()` and lock mechanism to prevent race conditions
- Token refresh as middleware in the handler stack
- Separate credentials per environment and per upstream
- Monitor token refresh failures via alerts

## Performance Considerations
- Token request adds one round-trip per authentication
- Token caching eliminates repeated auth requests
- Decode JWT locally to inspect expiry without API call
- Lock-based cache stampede protection adds ~1ms per lock acquisition

## Common Mistakes
- Fetching token on every request (missing cache)
- Cache stampede when multiple concurrent requests all fetch at expiry
- Not handling expired 401 responses in middleware
- Storing secrets in version control or plain .env
- Ignoring scope differences between environments

## Related Topics
- **Prerequisites**: HTTP basics, client credentials concept
- **Closely Related**: HMAC signing, service class pattern
- **Advanced**: OAuth 2.0 Authorization Code grant, PKCE, JWT validation
- **Cross-Domain**: Identity and access management, secret management

## Verification
- [ ] Token cached with TTL relative to token expiry
- [ ] Cache stampede protection (lock/mutex)
- [ ] Proactive refresh at 50% TTL
- [ ] 401 response triggers single retry with fresh token
- [ ] Secrets stored in vault, not source code
- [ ] Token service injected as singleton per upstream
