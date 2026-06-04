# ECC Standardized Knowledge — Token Expiration & Rotation

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Authentication & Authorization |
| Knowledge Unit | Token Expiration & Rotation |
| Difficulty | Intermediate |
| Category | Authentication / Lifecycle |
| Last Updated | 2026-06-02 |

## Overview

Token expiration limits API token lifespan, reducing the exposure window if compromised. Sanctum does not enforce expiration natively — it must be implemented as a custom layer. Rotation issues a new token when the old one expires or is about to expire. Together, they form the lifecycle management balancing security (short-lived tokens) against UX (frequent re-authentication).

## Core Concepts

- **Token TTL**: Time-to-live. After this period, the token is rejected.
- **Expiration enforcement**: Middleware checking `expires_at` (exists in DB but not checked by Sanctum's default guard).
- **Token rotation**: Replace expiring/expired token with new one. Old token revoked; new token returned.
- **Refresh token**: Longer-lived token to obtain new access tokens. Sanctum has no built-in refresh token — custom implementation.
- **Grace period**: Short window after expiration where token is still accepted, preventing lockouts during rotation.

## When To Use

- Production APIs with Sanctum token auth (expiration is a security requirement)
- Mobile apps where token refresh improves UX vs re-login
- Machine tokens with long-lived access that needs periodic rotation
- High-security APIs where breach window must be minimized
- Any scenario where a leaked token would cause significant damage

## When NOT To Use

- Development/local environments (expiration adds friction without benefit)
- Short-lived tokens under 1 minute (impractical without automatic refresh)
- SPA cookie auth (sessions handle expiration natively)
- APIs where clients cannot implement refresh logic (legacy integrations)

## Best Practices

- **Custom expiration middleware**: Check `expires_at` on every request. Reject if past.
- **Set `expires_at` at creation**: `$token->accessToken->expires_at = now()->addDays(30)`.
- **Shorter TTL for sensitive abilities**: `admin:*` tokens expire in hours; `posts:read` tokens in weeks.
- **Rotation endpoint**: POST `/api/auth/refresh` — validate old, create new with same abilities, revoke old, return new.
- **Grace period of 5 minutes**: Allow requests within window and return `X-Token-Expiring: true` header.
- **Rate limit the refresh endpoint**: Prevent brute force on rotation.
- **Prune expired tokens**: Schedule `sanctum:prune-expired --hours=24`.

## Architecture Guidelines

- Sanctum's database schema includes `expires_at` but it's unchecked by default. Implement checking middleware.
- For refresh: create new token → revoke old token → return new plainTextToken. Atomic transaction recommended.
- Allow old and new tokens to coexist for 5-minute handover period to prevent race conditions.
- Log token creation and revocation for audit trail.
- Document TTL per token type in API reference.

## Performance Considerations

- Checking `expires_at` is one column comparison — negligible.
- Token rotation creates one DB record + deletes one — lightweight.
- Frequent rotation increases `personal_access_tokens` table size — batch cleanup essential.
- `last_used_at` updates on every request. Debounce to every Nth request for high-traffic APIs.

## Security Considerations

- **Sanctum ignores `expires_at`**: The column exists but is not checked. Implementation is on you.
- **Rotation without old token revocation**: Both tokens valid, creating double the exposure.
- **Clock skew**: Server A issues token with `expires_at=T+3600`. Server B (5 min ahead) rejects early. Use 30-second tolerance.
- **Refresh endpoint not rate-limited**: Attacker with valid token can hammer refresh.
- **Emergency revocation**: Provide endpoint/command to immediately expire all tokens for a user or globally.

## Common Mistakes

- **Assuming Sanctum checks `expires_at`**: It does not. Implement custom middleware.
- **Rotation without revoking old token**: Both tokens remain valid — security hole.
- **Extremely short TTLs (30 seconds) without auto-refresh**: Breaks legitimate clients.
- **Race condition on concurrent refresh**: Both requests receive new tokens. Use optimistic locking.
- **Logging new plainTextToken during rotation**: Defeats the purpose of rotation.
- **No rate limiting on refresh**: Allows brute force on a valid token.

## Anti-Patterns

- **No expiration at all**: Leaked token is permanently valid. Always set expiration.
- **Rotation endpoint without rate limiting**: Attackers can rotate tokens indefinitely with one valid token.
- **Forcing re-login instead of refresh**: Bad UX for mobile apps. Implement refresh.
- **Same TTL for all token types**: Admin tokens should expire faster than read-only tokens.

## Examples

- Expiration middleware: `$token = $request->user()->currentAccessToken(); if ($token->expires_at && $token->expires_at->isPast()) { $token->delete(); return response()->json(['message' => 'Token expired'], 401); }`.
- Rotation endpoint: validate → create new token with same abilities → revoke old → return new plainTextToken.

## Related Topics

- **Prerequisites**: Sanctum token authentication, database migrations
- **Closely Related**: Sanctum Token Auth, Token Ability Design
- **Advanced**: OAuth2 refresh token grant (RFC 6749), token binding, session vs token revocation
- **Cross-Domain**: Security & Identity Engineering

## AI Agent Notes

When generating token expiration/rotation: Sanctum does not enforce `expires_at` — implement custom middleware, create rotation endpoint with rate limiting, allow handover period, prune expired tokens, log creation/revocation, set shorter TTL for sensitive abilities.

## Verification

Sources: Sanctum `PersonalAccessToken` model source, `HasApiTokens` trait source, domain-analysis.md.
