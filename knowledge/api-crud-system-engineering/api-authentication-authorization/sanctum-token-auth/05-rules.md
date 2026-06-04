# Phase 5: Rules — Sanctum Token Auth

> Generated from 04-standardized-knowledge.md

## Display Plain-Text Token Exactly Once at Creation
---
## Category
Security
---
## Rule
Always return the plain-text `plainTextToken` from `createToken()` exactly once and never store, log, or re-display it.
---
## Reason
The plain-text token is the credential. Storing it anywhere multiplies exposure surfaces. If the user loses it, revoke and create a new token rather than retrieving the old one.
---
## Bad Example
```php
$token = $user->createToken('mobile-app', ['posts:read']);
Log::info('Token created', ['token' => $token->plainTextToken]);
// Token leaked to logs
```

---
## Good Example
```php
$token = $user->createToken('mobile-app', ['posts:read']);
return response()->json([
    'token' => $token->plainTextToken,
    'message' => 'Save this token — it will not be shown again.',
]);
```

---
## Exceptions
No common exceptions. One-time display is non-negotiable.
---
## Consequences Of Violation
Token compromise via log inspection; unauthorized API access.

---
## Always Assign at Least One Ability on Token Creation
---
## Category
Design
---
## Rule
Always pass at least one ability string when calling `createToken()`.
---
## Reason
A token with no abilities authenticates the request but all `tokenCan()` calls return `false`, resulting in confusing 403 responses that appear to be authentication failures.
---
## Bad Example
```php
$token = $user->createToken('mobile-app');
// No abilities — all tokenCan() calls return false
```

---
## Good Example
```php
$token = $user->createToken('mobile-app', ['posts:read', 'posts:write']);
```

---
## Exceptions
Tokens used only for authentication without any resource access — rare.
---
## Consequences Of Violation
All authorized endpoints return 403; debugging confusion between auth and authorization failures.

---
## Enforce Per-User Token Limits
---
## Category
Security
---
## Rule
Always enforce a maximum number of active tokens per user (e.g., 10) to prevent runaway token creation.
---
## Reason
Unbounded token creation allows credential stuffing (one leaked credential creates thousands of tokens), token sprawl making revocation impractical, and database bloat from millions of orphaned tokens.
---
## Bad Example
```php
public function createToken(Request $request)
{
    $token = $request->user()->createToken($request->name, $request->abilities);
    // No limit — user can create unlimited tokens
}
```

---
## Good Example
```php
public function createToken(Request $request)
{
    $user = $request->user();
    if ($user->tokens()->count() >= 10) {
        return response()->json(['message' => 'Maximum 10 tokens allowed. Revoke an existing token first.'], 400);
    }
    $token = $user->createToken($request->name, $request->abilities);
    return response()->json(['token' => $token->plainTextToken]);
}
```

---
## Exceptions
Service accounts (CI/CD) that may need more — implement per-user configurable limits.
---
## Consequences Of Violation
Unlimited token creation; token sprawl; difficulty revoking all credentials after a breach.

---
## Schedule sanctum:prune-expired for Regular Cleanup
---
## Category
Maintainability
---
## Rule
Always schedule `sanctum:prune-expired` to run daily or hourly to remove expired tokens from the database.
---
## Reason
Expired tokens accumulate in the `personal_access_tokens` table, slowing queries over time. Without cleanup, table scans degrade API performance and increase storage costs.
---
## Bad Example
```php
// No scheduled cleanup — expired tokens accumulate forever
```

---
## Good Example
```php
// In AppServiceProvider or route file
// app/Console/Kernel.php
Schedule::command('sanctum:prune-expired --hours=24')->daily();
```

---
## Exceptions
No common exceptions. Regular cleanup is essential for performance.
---
## Consequences Of Violation
`personal_access_tokens` table bloat; degraded query performance; increased storage costs.

---
## Implement Custom Expiration Checking Middleware
---
## Category
Security
---
## Rule
Always implement a custom middleware that checks `expires_at` on `currentAccessToken()` since Sanctum does not enforce it natively.
---
## Reason
Sanctum's database schema includes `expires_at` but the default guard never checks it. A leaked token remains valid forever unless custom middleware rejects expired tokens.
---
## Bad Example
```php
// Assuming Sanctum checks expires_at — it does not
```

---
## Good Example
```php
class CheckTokenExpiration
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->user()?->currentAccessToken();
        if ($token && $token->expires_at && $token->expires_at->isPast()) {
            $token->delete();
            return response()->json(['message' => 'Token expired'], 401);
        }
        return $next($request);
    }
}
```

---
## Exceptions
Short-lived applications where token expiration is irrelevant.
---
## Consequences Of Violation
Compromised tokens valid indefinitely; no ability to enforce token lifetime policies.

---
## Log Scrubbing for Authorization Headers
---
## Category
Security
---
## Rule
Always implement log scrubbing to remove `Authorization` header values from all log output.
---
## Reason
A single debug log or error trace that captures request headers leaks the plain-text Bearer token. Attackers monitoring log streams can harvest tokens at scale.
---
## Bad Example
```php
Log::debug('Request headers', $request->headers->all());
// Bearer token leaked to logs
```

---
## Good Example
```php
// Log channel middleware or custom processor
class AuthorizationLogSanitizer
{
    public function __invoke(array $record): array
    {
        if (isset($record['context']['headers']['authorization'])) {
            $record['context']['headers']['authorization'] = '[REDACTED]';
        }
        return $record;
    }
}
```

---
## Exceptions
No common exceptions. Never log Authorization headers.
---
## Consequences Of Violation
Token leakage via log aggregation systems; mass token harvest from log streams.

---
## Issue Separate Tokens Per Device
---
## Category
Security
---
## Rule
Always issue separate tokens per device rather than sharing one token across all devices.
---
## Reason
A shared token cannot be revoked for a single device. If a phone is lost, revoking the shared token logs out all devices. Per-device tokens enable granular revocation.
---
## Bad Example
```php
// Same token reused across iOS and Android
$token = $user->createToken('mobile', ['posts:read']);
```

---
## Good Example
```php
$token = $user->createToken('iPhone-15-Pro', ['posts:read']);
// Revoke specific device without affecting others
$user->tokens()->where('name', 'iPhone-15-Pro')->delete();
```

---
## Exceptions
CLI tools where the concept of "device" does not apply.
---
## Consequences Of Violation
Lost device cannot be individually revoked; all sessions must be invalidated.

---
## Provide Revocation UI for Users
---
## Category
Design
---
## Rule
Always provide an interface (API endpoint or UI) for users to view and revoke their active tokens.
---
## Reason
Users need self-service token management for security hygiene. Without it, a user discovering a compromised token has no way to revoke it except contacting support.
---
## Bad Example
```php
// No token management endpoints — users cannot revoke tokens
```

---
## Good Example
```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/tokens', fn(Request $request) => $request->user()->tokens);
    Route::delete('/tokens/{token}', function (Request $request, $tokenId) {
        $request->user()->tokens()->where('id', $tokenId)->delete();
        return response()->json(['message' => 'Token revoked']);
    });
});
```

---
## Exceptions
No common exceptions. Token self-management is a security best practice.
---
## Consequences Of Violation
Users stuck with compromised tokens; support team burden for manual revocation.

---
## Use Meaningful Token Names for Audit
---
## Category
Maintainability
---
## Rule
Always use descriptive, environment-qualified names when creating tokens (e.g., "Production CI Deploy", "Staging Mobile App").
---
## Reason
Meaningful names enable quick identification of which token to revoke when a device is lost or a service decommissioned. Generic names like "token1" provide no audit value.
---
## Bad Example
```php
$token = $user->createToken('token1', ['posts:read']);
```

---
## Good Example
```php
$token = $user->createToken('Production:CI-GitHub-Actions', ['deploy']);
$token = $user->createToken('Staging:iPhone-15-Pro', ['posts:read']);
```

---
## Exceptions
No common exceptions. Meaningful names have no downside.
---
## Consequences Of Violation
Difficulty identifying which token belongs to which device or service; accidental revocation of wrong token.

---
## Debounce last_used_at Updates for High-Traffic APIs
---
## Category
Performance
---
## Rule
Always debounce `last_used_at` updates to every Nth request for high-traffic APIs (1000+ req/s).
---
## Reason
Sanctum updates `last_used_at` on every authenticated request by default. At 1000+ req/s, this creates 1000 writes/second to the `personal_access_tokens` table, becoming a write bottleneck.
---
## Bad Example
```php
// Every request updates last_used_at — write bottleneck at scale
```

---
## Good Example
```php
// In custom middleware or token check
$token = $request->user()->currentAccessToken();
if ($token && mt_rand(1, 100) === 1) { // ~1% of requests
    $token->forceFill(['last_used_at' => now()])->save();
}
```

---
## Exceptions
Low-traffic APIs (<100 req/s) where write volume is negligible.
---
## Consequences Of Violation
Database write contention; increased p99 latency from update queries; connection pool exhaustion.
