# ECC Standardized Knowledge — Sanctum Token Auth

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Authentication & Authorization |
| Knowledge Unit | Sanctum Token Auth |
| Difficulty | Intermediate |
| Category | Authentication |
| Last Updated | 2026-06-02 |

## Overview

Sanctum token authentication provides lightweight, stateless API authentication for first-party external consumers — mobile apps, JavaScript frontends on different domains, and M2M communication. Tokens are issued per-user with arbitrary abilities (scopes), stored hashed in the database, and presented via `Authorization: Bearer` header. Unlike Passport, Sanctum has no OAuth2 overhead, no client registration, and no refresh token infrastructure.

## Core Concepts

- **API Token**: Plain-text bearer token shown once at creation. Only the SHA-256 hash and last four characters are stored.
- **Token Abilities**: Arbitrary string identifiers (`'posts:read'`, `'posts:create'`) assigned to tokens, checked at the endpoint level.
- **Token Creation**: `$user->createToken('name', ['ability1', 'ability2'])` returns `NewAccessToken` with `plainTextToken`.
- **Token Revocation**: `$user->tokens()->delete()` revokes all; `$token->delete()` revokes one.
- **`ID|secret` format**: Sanctum prepends the database ID to the token, enabling O(1) lookup without scanning all hashed values.

## When To Use

- Mobile app authentication (iOS, Android, Flutter, React Native)
- JavaScript frontends on different origins than the API
- Simple token-based API access for first-party applications
- CI/CD integration tokens
- API testing and development tokens

## When NOT To Use

- Third-party OAuth2 client requirements (use Passport)
- SPA on the same domain (use Sanctum SPA cookie auth — simpler and more secure)
- Machine-to-machine with replay protection needs (use signed request pattern)
- High-security scenarios requiring refresh token rotation (implement custom layer)
- When OAuth2 spec compliance is mandatory

## Best Practices

- **Token displayed once**: Capture and store plain-text token immediately upon creation. Never log or store the plain text.
- **Meaningful token names**: Include environment in names ("Production CI", "Staging Deploy") for audit clarity.
- **Enforce token limits**: Maximum 10 tokens per user prevents runaway creation.
- **Schedule cleanup**: Run `sanctum:prune-expired --hours=24` to remove expired tokens.
- **Audit token lifecycle**: Log creation and revocation events with IP and user agent.
- **Provide revocation UI**: Users should see all active tokens and revoke individual ones.

## Architecture Guidelines

- Sanctum is pre-installed in Laravel 11+. No additional installation needed.
- The `personal_access_tokens` table needs indexes on `tokenable_id`, `tokenable_type`, and `token`.
- For millions of tokens, consider partitioning by `tokenable_type`.
- Sanctum's `ID|secret` format enables efficient lookup — do not modify the storage format.
- Token abilities are checked via `$user->tokenCan('ability')` or the `abilities` middleware.

## Performance Considerations

- Token lookup by ID is an integer primary key query — O(1), very fast.
- `in_array()` ability check on a small JSON array is sub-millisecond.
- `last_used_at` updates on every request. For high-traffic APIs, debounce to every Nth request.
- Token cleanup via `sanctum:prune-expired` prevents table bloat.

## Security Considerations

- **Token in logs**: A single debug log of headers can leak the plain-text token. Implement log scrubbing for `Authorization` headers.
- **Token limits**: Unbounded token creation enables credential stuffing. Enforce per-user limits.
- **Revoke on breach**: Provide `/api/revoke-all-tokens` endpoint for users to invalidate all sessions.
- **No built-in expiration**: Sanctum does not check `expires_at`. Implement custom middleware for TTL enforcement.
- **`tokenCan()` returns false for no abilities**: Always assign at least one ability to avoid confusing 403 responses.

## Common Mistakes

- **Logging `plainTextToken`**: Security leak. Never log the raw token.
- **Storing plain-text token alongside hash**: Redundant and insecure.
- **Tokens without abilities**: All `tokenCan()` calls return false — confusing 403 errors.
- **Not scheduling `prune-expired`**: Accumulated revoked tokens slow queries over time.
- **Tokens as session substitute**: Token auth is stateless — different from session-based web auth.

## Anti-Patterns

- **Using Sanctum for OAuth2 flows**: Sanctum does not implement OAuth2. Use Passport.
- **Same token for all user devices**: No per-device revocation capability. Issue separate tokens per device.
- **No token rotation**: Long-lived static tokens increase breach exposure window. Implement rotation for sensitive scopes.

## Examples

- Mobile login: POST credentials → receive `plainTextToken` → store in `flutter_secure_storage` → send as `Authorization: Bearer <token>`.
- Token revocation: `$token = $user->tokens()->where('id', $request->token_id)->first(); $token->delete();`.

## Related Topics

- **Prerequisites**: Laravel authentication guards, HTTP Authorization header standard
- **Closely Related**: Sanctum SPA Cookie Auth, Token Ability Design, Token Expiration & Rotation, API Key Pattern
- **Advanced**: Custom token driver on top of Sanctum, multi-tenancy token isolation
- **Cross-Domain**: Laravel Core Application Engineering, Security & Identity Engineering

## AI Agent Notes

When generating Sanctum token auth code: use `createToken` with abilities, display plain-text token once, never log it, enforce token limits, schedule `prune-expired`, implement custom `expires_at` checking middleware for TTL, provide revocation UI.

## Verification

Sources: `HasApiTokens` trait source, Sanctum `Guard` source, Laravel Sanctum documentation, domain-analysis.md.
