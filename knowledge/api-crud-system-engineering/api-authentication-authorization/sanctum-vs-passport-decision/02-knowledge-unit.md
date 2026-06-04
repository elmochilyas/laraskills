# Sanctum vs Passport Decision

## Metadata (Domain: API & CRUD System Engineering, Subdomain: API Authentication & Authorization, Last Updated: 2026-06-02)

## Executive Summary
Laravel provides two first-party API authentication packages: Sanctum and Passport. Sanctum is a lightweight, token-based system designed for SPAs, mobile apps, and simple token APIs. Passport is a full OAuth2.0 server implementation suitable for third-party client applications, scoped access, and complex authorization flows. Choosing between them depends on client type, authentication flow requirements, and organizational complexity tolerance.

## Core Concepts
- **Sanctum**: Stateless token authentication using Laravel's built-in cookie/session system for SPAs and simple API tokens for external consumers. No OAuth2 overhead.
- **Passport**: Full OAuth2.0 server (built on League OAuth2 Server) supporting authorization code grant, client credentials grant, password grant, and personal access tokens.
- **Token vs OAuth2**: Sanctum issues bearer tokens directly; Passport issues access tokens (and optionally refresh tokens) within the OAuth2 framework.
- **First-party vs Third-party**: Sanctum is optimized for first-party clients (your own SPA, your own mobile app). Passport handles third-party integrations where users authorize external apps.

## Mental Models
- **Sanctum = "Your app, your tokens"**: Think of Sanctum as a lockbox only your applications can open. You control the frontend, you control the token issuance.
- **Passport = "OAuth2 highway"**: Think of Passport as a standardized intersection where multiple clients (yours and third-party) request access through defined protocols (grants).
- **SPA Cookie = Sanctum's session mode**: The SPA authenticates via Laravel's session cookies (same-domain or subdomain), not tokens. Tokens are only for external API consumers.

## Internal Mechanics
- Sanctum stores tokens in a `personal_access_tokens` table, hashes the token secret with SHA-256, and stores only the hash + last four characters. On request, it extracts the token from the `Authorization: Bearer` header, hashes the provided value, and looks up the hash.
- Passport stores multiple OAuth2 entities: `oauth_clients`, `oauth_access_tokens`, `oauth_auth_codes`, `oauth_refresh_tokens`, `oauth_personal_access_clients`. It uses PKCE for the authorization code grant to prevent interception attacks.
- Sanctum's SPA mode relies on Laravel's `auth:sanctum` guard which checks the session cookie; the SPA must first hit `/sanctum/csrf-cookie` to get a CSRF token, then login via POST to `/login` (or similar) to establish the session.
- Passport issues JWT-like tokens (they are actually opaque strings referencing database records, not JWTs by default) and can issue refresh tokens with configurable TTL.

## Patterns
- **SPA + Sanctum**: Use Sanctum's cookie-based SPA authentication. Set `SESSION_DRIVER=cookie`, `SANCTUM_STATEFUL_DOMAINS` to your SPA domain, and CORS to allow credentials. The SPA fetches `/sanctum/csrf-cookie`, then POSTs credentials to `/login`.
- **Mobile App + Sanctum**: Issue an API token at login, store it securely on the device, send via `Authorization: Bearer`. No CSRF needed. No refresh tokens — issue long-lived tokens or implement custom rotation.
- **Third-party API + Passport**: Use OAuth2 authorization code grant with PKCE. The third-party app redirects the user to your authorization endpoint, the user approves, and an authorization code is exchanged for tokens.
- **Machine-to-Machine + Passport**: Use OAuth2 client credentials grant. No user context. The client authenticates with its ID and secret to receive a token scoped to the client's permissions.
- **Internal Microservice + Sanctum**: Use Sanctum API tokens with token abilities for service-to-service communication. Simpler than Passport when both services are under your control.

## Architectural Decisions
1. **Use Sanctum when**: All API consumers are your own first-party applications (SPA, mobile app, internal services). You want minimal configuration and maintenance overhead.
2. **Use Passport when**: Third-party developers need to integrate with your API, you need standard OAuth2 compliance, or you need granular token scopes that clients manage themselves.
3. **Sanctum + Passport hybrid**: Both can coexist in the same application. Sanctum for first-party tokens and SPA sessions; Passport for third-party OAuth2 flows. Route them through different guards.

## Tradeoffs (table)
| Aspect | Sanctum | Passport |
|--------|---------|----------|
| Setup complexity | Low (migration + trait) | High (migration, keys, config, routes) |
| Token standard | Proprietary bearer token | OAuth2 (standardized) |
| Refresh tokens | Not built-in | Built-in (configurable TTL) |
| Token scopes | Abilities (simple string array) | Scopes (formal OAuth2 scopes) |
| Client management | None (tokens per user) | Full (oauth_clients table) |
| Third-party support | Manual | Native OAuth2 grants |
| SPA support | Native (cookie/session) | Possible but awkward |
| Database tables | 1 (personal_access_tokens) | 5+ (clients, tokens, codes, etc.) |
| Performance | Lower overhead | Higher overhead (more DB queries) |
| Token revocation | Mark revoked = true | Expire TTL or revoke token record |
| Community adoption | Growing (Laravel default) | Mature, widely documented |

## Performance Considerations
- Sanctum performs a single DB query per request (lookup by token hash). For high-throughput APIs, ensure the `personal_access_tokens` table is indexed on `token` column.
- Passport performs multiple queries per request (client lookup, token validation, scope resolution). Consider caching `oauth_clients` and using token expiration to limit active tokens.
- Both packages support token expiration. Short TTLs reduce the number of valid tokens in the database, improving lookup performance.
- For Passport, enable `hashClientSecrets` and `hashAccessTokens` in `PassportServiceProvider` to avoid storing secrets in plain text, but note that hashed tokens cannot be looked up by token value — only by ID.

## Production Considerations
- **Key management (Passport)**: Store `oauth-private.key` and `oauth-public.key` outside the document root. Use a secure key management service in production. Rotate keys periodically (and invalidate all existing tokens on rotation).
- **Token storage (Sanctum)**: Sanctum API tokens are shown only once at creation. Ensure the frontend captures and stores the plain-text token immediately. Provide a UI for users to revoke and regenerate tokens.
- **CSRF in SPA mode**: The SPA session cookie route (`/sanctum/csrf-cookie`) must be unauthenticated. Configure `stateful` domains in `sanctum.php` to match your SPA's exact domain.
- **Database cleanup**: Both packages accumulate old tokens. Schedule a command to prune expired/revoked tokens periodically: `sanctum:prune-expired` or custom cleanup for Passport.
- **HTTPS requirement**: Both require HTTPS in production. Sanctum SPA mode specifically requires same-domain or subdomain HTTPS.

## Common Mistakes
- Using Passport when Sanctum would suffice (unnecessary OAuth2 complexity).
- Using Sanctum's SPA cookie mode across different top-level domains (cookies won't be sent). Use token mode instead.
- Forgetting to run `php artisan passport:keys` before using Passport.
- Not configuring `SANCTUM_STATEFUL_DOMAINS` correctly in SPA mode — the request hits the API but cookies are not attached.
- Storing Passport private keys in version control.
- Mixing Sanctum token guard and web guard in the same middleware group without understanding the precedence.
- Exposing Passport authorization screens for machine-to-machine flows (use client credentials grant, not authorization code).

## Failure Modes
1. **CSRF token mismatch (SPA mode)**: The SPA's CSRF token expires or is not refreshed, causing all stateful requests to fail with 419. Solution: Refresh the CSRF cookie before each critical request or set a longer CSRF expiration.
2. **Cookie not sent (SPA mode)**: The SPA domain does not match `SANCTUM_STATEFUL_DOMAINS`, or CORS `Access-Control-Allow-Credentials` is not set to `true`. Solution: Verify domain config and CORS settings.
3. **Passport key file missing**: After server migration or deployment, `oauth-private.key` is missing, causing Passport to fail with "Key file does not exist". Solution: Include key generation in deployment scripts or use a KMS.
4. **Token hash collision**: Extremely unlikely with SHA-256, but if custom token generation produces duplicate tokens, Sanctum's lookup may return the wrong record. Solution: Ensure unique token generation.
5. **Passport scope escalation**: A client requests scopes beyond what was approved. Passport's middleware (`scopes:`) will block the request. Solution: Always validate scopes on the endpoint.

## Ecosystem Usage
- **Laravel Breeze + Sanctum**: Default API scaffolding uses Sanctum. Breeze provides starter kits for inertia/React SPAs with Sanctum authentication.
- **Laravel Jetstream + Sanctum**: Jetstream uses Sanctum for API token management. Teams and user profiles include token creation/revocation UIs.
- **Laravel Nova + Passport**: Nova's API uses this combination. Third-party Nova tools can authenticate via Passport tokens.
- **Laravel Spark + Passport**: Spark (billing portal) historically used Passport for API access during subscription management.

## Related Knowledge Units
### Prerequisites
- Laravel authentication basics (guards, providers, session)
- HTTP cookie mechanics and CORS

### Related Topics
- [sanctum-spa-cookie-auth](./phase-2/02-sanctum-spa-cookie-auth.md)
- [sanctum-token-auth](./phase-2/03-sanctum-token-auth.md)
- [token-ability-design](./phase-2/04-token-ability-design.md)
- [api-key-pattern](./phase-2/06-api-key-pattern.md)

### Advanced Follow-up Topics
- OAuth2.0 specification deep dive (RFC 6749)
- PKCE (RFC 7636) implementation details
- JWT vs opaque token performance benchmarks

## Research Notes
### Source Analysis
Official Laravel documentation: Sanctum (https://laravel.com/docs/sanctum) and Passport (https://laravel.com/docs/passport) are the primary references. The League OAuth2 Server (underlying Passport) documentation provides deeper OAuth2 mechanics.

### Key Insight
The Sanctum-vs-Passport decision is primarily about client ownership (first-party vs third-party) and OAuth2 compliance needs. Many teams choose Passport prematurely for "future-proofing" when Sanctum's ability system scales further than commonly assumed. Start with Sanctum; migrate to Passport only when third-party OAuth2 is explicitly required.

### Version-Specific Notes
- **Laravel 10+**: Sanctum is included by default. Passport requires `composer require laravel/passport`.
- **Laravel 11+**: Sanctum remains the default for API authentication. Passport received OAuth2 server updates.
- **Sanctum 3.x**: Introduced improved token hashing and SPA cookie improvements.

## Tradeoffs

**Benefit:** Centralized, consistent pattern. **Cost:** Additional abstraction layer, indirection. **Consequence:** Cleaner controllers but requires team discipline to maintain separation.