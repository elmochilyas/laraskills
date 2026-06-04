# Token Expiration & Rotation

## Metadata (Domain: API & CRUD System Engineering, Subdomain: API Authentication & Authorization, Last Updated: 2026-06-02)

## Executive Summary
Token expiration limits the lifespan of API tokens, reducing the window of exposure if a token is compromised. Sanctum does not enforce expiration natively — it must be implemented as a custom layer on top of the token model. Rotation is the process of issuing a new token when the old one expires or is about to expire, typically via a refresh endpoint. Together, expiration and rotation form the lifecycle management of API tokens, balancing security (short-lived tokens) against user experience (frequent re-authentication).

## Core Concepts
- **Token TTL**: Time-to-live for a token. After this period, the token is considered expired and should be rejected.
- **Expiration enforcement**: Checking `expires_at` (a nullable datetime column) on each authenticated request and rejecting expired tokens.
- **Token rotation**: Replacing an expiring/expired token with a new one. The old token is revoked; the new token is returned.
- **Refresh token**: A longer-lived token used to obtain new access tokens. Sanctum does not have a built-in refresh token concept — it's a custom pattern.
- **Grace period**: A short window after expiration where the token is still accepted, allowing the client to rotate before being locked out.

## Mental Models
- **Token as rental car**: You return it (it expires) after a set period. You can rent another (rotation) or extend the rental. If stolen, the rental expires soon anyway.
- **Expiration as deadbolt**: After the TTL, the deadbolt clicks shut. Rotation is having a spare key (the refresh token) to open a new lock.
- **No expiration = unlocked door forever**: Without expiration, a leaked token is a permanent vulnerability.

## Internal Mechanics
- Sanctum stores tokens in `personal_access_tokens` with columns: `id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`.
- The `expires_at` column exists in the database but is not checked by Sanctum's default guard.
- To enforce expiration, add a global scope or middleware that checks `expires_at` against `now()`.
- Rotation involves: validate old token → create new token → revoke old token → return new token. This is a multi-step transaction.
- `last_used_at` is updated by Sanctum on each request (configurable via `ExpiresAt` in the config).

## Patterns
- **Custom Expiration Middleware**: Create middleware that extends Sanctum's auth guard to check `expires_at`:
  ```php
  // In middleware
  $token = $request->user()->currentAccessToken();
  if ($token->expires_at && $token->expires_at->isPast()) {
      $token->delete();
      return response()->json(['message' => 'Token expired'], 401);
  }
  ```
- **Rotation endpoint**: `POST /api/auth/refresh` — validate the current token, create a new token with the same abilities, revoke the old token, return the new `plainTextToken`.
- **Expiration at token creation**: Set `expires_at` at token creation time: `$token->accessToken->expires_at = now()->addDays(30);`.
- **Grace period check**: Instead of hard rejection at expiration, allow requests within a 5-minute grace period and return a `X-Token-Expiring: true` header.
- **Prune expired tokens**: Schedule `sanctum:prune-expired --hours=24` to clean up expired tokens from the database.
- **Check expiration before API call**: The client checks local token expiry and proactively refreshes. Requires the client to know the token's creation time/expiry.

## Architectural Decisions
1. **Expiration enforcement layer**: Sanctum middleware vs custom guard. Custom middleware is simpler and more transparent. A custom guard is cleaner but requires deeper understanding of Laravel's auth system.
2. **Refresh token vs re-login**: For mobile apps, implement a refresh mechanism to avoid forcing users to re-enter credentials. For CI/CD tokens, use long TTL (90-365 days) with manual rotation.
3. **Short TTL for sensitive actions**: Tokens with `admin:*` abilities should have shorter TTLs (hours) than `posts:read` tokens (weeks).
4. **Token rotation on revocation**: When a token is explicitly revoked (not expired), do NOT auto-rotate — force the client to re-authenticate.
5. **Simultaneous token validity**: Allow old and new tokens to coexist for a brief handover period (e.g., 5 minutes) to prevent race conditions during rotation.

## Tradeoffs (table)
| Aspect | Short TTL (minutes/hours) | Long TTL (days/months) | No Expiration |
|--------|--------------------------|------------------------|---------------|
| Security | High (narrow exposure window) | Medium | Low |
| UX friction | High (frequent refreshes) | Low | None |
| DB cleanup frequency | High | Low | Very low |
| Refresh implementation | Required | Optional | Not needed |
| Offline capability | Limited | Good | Full |
| Audit confidence | High (recent auth) | Medium | Low |

## Performance Considerations
- Checking `expires_at` adds one column comparison per request — negligible.
- Token rotation creates a new DB record and deletes the old one — lightweight.
- Frequent rotation generates DB writes and increases the `personal_access_tokens` table size. Batch cleanup is essential.
- `last_used_at` updates write to DB on every request. For high-traffic APIs, consider debouncing this update (update every N requests or every minute).

## Production Considerations
- **Clock skew**: Server clock drift can cause premature expiration or acceptance of expired tokens. Use NTP-synchronized clocks. Add a 30-second tolerance in expiration checks.
- **Refresh token rotation limit**: Limit the number of times a token can be rotated (e.g., 10 rotations) to prevent a compromised token from being refreshed indefinitely.
- **Expiration notification**: Send an email/push notification to the user when a token is about to expire, especially for long-lived machine tokens.
- **Token expiration in API docs**: Document the TTL for each token type (user token, service token, admin token) in the API reference.
- **Emergency token revocation**: Provide an endpoint or Artisan command to immediately expire all tokens for a user or all users. Use this after a security incident.
- **Expiration-aware caching**: When caching API responses, include the token expiration in the cache key to prevent serving cached data after token expiry.

## Common Mistakes
- Relying on Sanctum's `expires_at` column without actually checking it in middleware — the column stores the value but Sanctum ignores it.
- Implementing rotation without revoking the old token, leaving both valid and creating a security gap.
- Setting extremely short TTLs (30 seconds) without implementing automatic refresh, breaking legitimate clients.
- Not handling the race condition where a client's refresh request arrives after the old token was already rotated by another request.
- Forgetting to include `expires_at` when creating tokens programmatically in seeders or tests.
- Logging the new `plainTextToken` during rotation (defeats the purpose of rotation).
- Rotation endpoint not rate-limited — an attacker can hammer the refresh endpoint if they have a valid token.

## Failure Modes
1. **Token expired mid-request**: A long-running upload/export exceeds the token TTL. The request fails midway. Solution: Check expiration at request start only, or use a long-enough TTL for upload endpoints.
2. **Refresh loop**: The client's refresh token has also expired. The user is stuck in a login loop. Solution: Clear client credentials and redirect to login.
3. **Clock skew causing premature expiry**: Server A issues a token with `expires_at=T+3600`. Server B, whose clock is 5 minutes ahead, rejects it 5 minutes early. Solution: Use UTC and NTP; add tolerance.
4. **DB cleanup not running**: Expired tokens accumulate, slowing down token lookups. Solution: Schedule `sanctum:prune-expired` as a cron/daemon task.
5. **Rotation race condition**: Two concurrent requests try to refresh. Both see the old token as valid. Both receive new tokens. The old token is used by one of them. Solution: Implement optimistic locking on the token record.

## Ecosystem Usage
- **OAuth2 refresh tokens**: Passport implements the standard OAuth2 refresh flow. Sanctum can approximate this with custom code.
- **Firebase Custom Auth**: Uses short-lived ID tokens (1 hour) with long-lived refresh tokens. Similar concept.
- **JWT-based auth (tymon/jwt-auth)**: Built-in TTL and refresh support. Many Laravel APIs use this before adopting Sanctum.

## Related Knowledge Units
### Prerequisites
- Sanctum token authentication
- Database migrations

### Related Topics
- [sanctum-token-auth](./phase-2/03-sanctum-token-auth.md)
- [token-ability-design](./phase-2/04-token-ability-design.md)

### Advanced Follow-up Topics
- OAuth2 refresh token grant (RFC 6749 Section 1.5)
- Token binding (proof-of-possession tokens)
- Session vs token revocation semantics

## Research Notes
### Source Analysis
The Sanctum token model (`vendor/laravel/sanctum/src/PersonalAccessToken.php`) and the `HasApiTokens` trait show that `expires_at` is cast to Carbon but never checked by the default authentication flow.

### Key Insight
The absence of built-in expiration in Sanctum is a deliberate design choice — it keeps the package simple and lets developers choose their own security posture. The database schema includes `expires_at` specifically for custom implementations. This is preferable to a forced-short-TTL approach that would break mobile apps without refresh logic.

### Version-Specific Notes
- **Sanctum 2.x**: `expires_at` column existed but was not functional.
- **Sanctum 3.x**: `expires_at` column is now functional when you configure the `expiration` config option, but only for SPA (cookie) auth, not token auth.
- **Sanctum 4.x (future)**: May add native token expiration support based on community demand.

## Tradeoffs

**Benefit:** Centralized, consistent pattern. **Cost:** Additional abstraction layer, indirection. **Consequence:** Cleaner controllers but requires team discipline to maintain separation.