# ECC Standardized Knowledge — Sanctum vs Passport Decision

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Authentication & Authorization |
| Knowledge Unit | Sanctum vs Passport Decision |
| Difficulty | Intermediate |
| Category | Authentication / Decision |
| Last Updated | 2026-06-02 |

## Overview

Laravel provides two first-party API authentication packages: Sanctum (lightweight, for first-party apps) and Passport (full OAuth2.0, for third-party integrations). The choice determines auth complexity, token management, client registration, and OAuth2 compliance. Sanctum is the correct default for 90%+ of projects. Passport is needed only when third-party OAuth2 is explicitly required.

## Core Concepts

- **Sanctum**: Stateless token auth + SPA cookie auth. No OAuth2 overhead. Simple abilities (scopes). Pre-installed in Laravel 11.
- **Passport**: Full OAuth2.0 server (League OAuth2 Server). Supports authorization code, client credentials, password grants. Requires separate installation.
- **First-party vs Third-party**: Sanctum for your own apps (SPA, mobile, internal). Passport for external developers integrating with your API.
- **Hybrid approach**: Both can coexist — Sanctum for first-party, Passport for third-party, using different auth guards.

## When To Use Sanctum

- All API consumers are your own first-party applications
- SPA on same domain or subdomain (cookie auth)
- Mobile app authentication (token auth)
- Internal microservice communication
- Simple token-based API access
- Startups and MVPs where quick setup matters

## When To Use Passport

- Third-party developers need to integrate with your API
- OAuth2 compliance is required (authorization code grant with PKCE)
- You need formal scopes managed by client applications
- Your API will be consumed by multiple external organizations
- You need standard refresh token flows

## When NOT To Use Either

- Session-based web authentication (use Laravel's built-in session auth)
- Machine-to-machine without user context (consider API key pattern)
- HMAC signed request patterns (more appropriate for webhook verification)
- When using a third-party auth provider (Auth0, Firebase, Okta)

## Best Practices

- **Start with Sanctum**: It scales further than commonly assumed. Migrate to Passport only when third-party OAuth2 is explicitly required.
- **Use hybrid when needed**: Sanctum for first-party + Passport for third-party via different guards and route groups.
- **Sanctum SPA mode requires cookie session driver**: Not compatible with API-only setups. Use token mode for cross-origin.
- **Passport key management**: Store `oauth-private.key` outside document root. Never commit to version control.
- **Both require HTTPS in production**: Sanctum SPA mode specifically requires same-origin HTTPS.

## Architecture Guidelines

- Sanctum: 1 DB table (`personal_access_tokens`), 1 route (`/sanctum/csrf-cookie`), minimal config.
- Passport: 5+ DB tables, key generation (php artisan passport:keys), multiple routes, service provider registration.
- Sanctum uses `auth:sanctum` guard. Passport uses `auth:api` guard with passport driver.
- For hybrid, route first-party endpoints through Sanctum guard and third-party through Passport guard.

## Performance Considerations

- Sanctum: 1 DB query per request (token lookup by ID via `ID|secret` format).
- Passport: 2-3 queries per request (client lookup, token validation, scope resolution).
- Sanctum's O(1) token lookup outperforms Passport for high-throughput APIs.
- Both benefit from database indexing. Sanctum needs index on `token` column; Passport needs indexes on client and token tables.

## Security Considerations

- Sanctum lacks built-in refresh tokens — implement custom rotation for sensitive scopes.
- Passport supports token expiration, refresh token rotation, and client secret hashing.
- Sanctum SPA cookies are HTTP-only (immune to XSS). Passport tokens in localStorage are XSS-vulnerable.
- Passport supports PKCE for authorization code flow (prevents authorization code interception).
- Both require database cleanup: `sanctum:prune-expired` for Sanctum; custom commands for Passport.

## Common Mistakes

- **Passport when Sanctum suffices**: Unnecessary OAuth2 complexity adds maintenance burden.
- **Sanctum SPA cross-domain**: Cookies not sent across top-level domains. Use token mode.
- **Forgetting `php artisan passport:keys`**: Passport fails without key files.
- **`SANCTUM_STATEFUL_DOMAINS` misconfiguration**: SPA requests appear unauthenticated.
- **Passport keys in version control**: Private key leaked to all developers with repo access.
- **Mixing Sanctum and web guards**: Understand middleware group precedence.

## Anti-Patterns

- **Sanctum for third-party OAuth2**: Does not implement OAuth2 spec. Third-party developers cannot use standard OAuth2 libraries.
- **Passport for simple mobile API**: Massive overkill. Sanctum token auth is simpler and sufficient.
- **Both packages without clear separation**: Mixed auth guards cause confusion. Use different route groups.

## Examples

- Sanctum selection: "All consumers are our own apps (SPA + mobile + CI/CD)." → Sanctum.
- Passport selection: "We are building an API marketplace where external developers register apps." → Passport.
- Hybrid: Sanctum for SPA + mobile; Passport for third-party integrations via `oauth/` prefix routes.

## Related Topics

- **Prerequisites**: Laravel authentication basics, HTTP cookie mechanics, CORS
- **Closely Related**: Sanctum SPA Cookie Auth, Sanctum Token Auth, Token Ability Design, API Key Pattern
- **Advanced**: OAuth2.0 spec (RFC 6749), PKCE (RFC 7636), JWT vs opaque tokens
- **Cross-Domain**: Security & Identity Engineering

## AI Agent Notes

When choosing auth approach: default to Sanctum for first-party apps, use Passport only for third-party OAuth2 requirements, consider hybrid for mixed consumer types, never use Sanctum for OAuth2 compliance.

## Verification

Sources: Laravel Sanctum docs, Laravel Passport docs, League OAuth2 Server docs, domain-analysis.md.
