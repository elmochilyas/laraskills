# Skill: Implement OAuth2 Client Credentials Flow for M2M Authentication

## Purpose
Authenticate to external APIs using the OAuth2 Client Credentials grant for server-to-server communication, managing token acquisition, caching, and refresh.

## When To Use
- Server-to-server API authentication where no user context is needed
- Backend services communicating with each other
- API integrations requiring OAuth2 client credentials

## When NOT To Use
- User delegation scenarios (use Authorization Code grant)
- Simple API key authentication (prefer API keys)

## Prerequisites
- OAuth2 provider credentials (client ID, client secret)
- Token endpoint URL

## Workflow
1. Store client credentials securely in `.env` (not hardcoded)
2. Request access token: POST to token endpoint with `grant_type=client_credentials`
3. Cache token in cache driver with TTL matching token expiry
4. Attach token to API requests: `Authorization: Bearer {token}`
5. Implement automatic token refresh when expired
6. Handle token endpoint errors with retry logic
7. Use SaloonPHP OAuth2 plugin or custom connector for token management
8. Log token acquisition and refresh events

## Validation Checklist
- [ ] Client credentials stored securely in `.env`
- [ ] Token cached with expiry-based invalidation
- [ ] Automatic token refresh on expiry
- [ ] Token endpoint errors handled with retry
- [ ] No credentials in version control
- [ ] Token acquisition logged for audit
