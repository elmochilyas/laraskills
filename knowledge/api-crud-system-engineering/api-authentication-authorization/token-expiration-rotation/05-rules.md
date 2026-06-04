# Phase 5: Rules — Token Expiration & Rotation

> Generated from 04-standardized-knowledge.md

## Implement Custom Expiration Middleware for Sanctum
---
## Category
Security
---
## Rule
Always implement custom middleware to check `expires_at` on the current access token. Never assume Sanctum enforces expiration natively.
---
## Reason
Sanctum's `personal_access_tokens` table includes an `expires_at` column, but the default guard never reads or validates it. A token past its `expires_at` continues to work indefinitely without explicit middleware.
---
## Bad Example
```php
// Sanctum does NOT check expires_at
$token = $user->createToken('token', ['read'], now()->addDays(30));
// Token still valid after 30 days
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
Development environments where token expiration adds friction without benefit.
---
## Consequences Of Violation
Expired tokens remain valid indefinitely; compromised tokens never lose access.

---
## Set Shorter TTL for Sensitive Abilities
---
## Category
Security
---
## Rule
Always set shorter expiration times for tokens with sensitive or admin-level abilities (hours) than for read-only tokens (weeks or months).
---
## Reason
A compromised admin token causes significantly more damage than a read-only token. Shorter TTLs for sensitive scopes limit the breach window proportionally to the potential impact.
---
## Bad Example
```php
// Same 90-day TTL for all token types
$token->accessToken->expires_at = now()->addDays(90);
```

---
## Good Example
```php
$ttlDays = match (true) {
    in_array('admin:*', $abilities) => 1,
    in_array('billing:write', $abilities) => 7,
    default => 90,
};
$token->accessToken->expires_at = now()->addDays($ttlDays);
```

---
## Exceptions
No common exceptions. TTL must scale with the sensitivity of granted abilities.
---
## Consequences Of Violation
Admin tokens with excessively long TTLs; compromised admin token usable for months.

---
## Always Revoke Old Token During Rotation
---
## Category
Security
---
## Rule
Always revoke (delete) the old token when issuing a rotated token. Never leave both tokens active.
---
## Reason
Rotation without revocation doubles the exposure window — both the old and new tokens are valid. An attacker who compromised the old token retains access even after rotation.
---
## Bad Example
```php
// Old token not revoked — both tokens valid
$newToken = $user->createToken('new', $abilities);
return $newToken->plainTextToken;
```

---
## Good Example
```php
$oldToken = $request->user()->currentAccessToken();
$newToken = $request->user()->createToken($oldToken->name, $oldToken->abilities);
$oldToken->delete(); // Revoke old token
return $newToken->plainTextToken;
```

---
## Exceptions
Grace period handover where both tokens coexist for 5 minutes — but schedule revocation after the window.
---
## Consequences Of Violation
Compromised tokens remain valid after rotation; attacker retains access indefinitely.

---
## Implement Grace Period for Token Handover
---
## Category
Reliability
---
## Rule
Always allow a short grace period (5 minutes) where both old and new tokens are valid during rotation to prevent race-condition lockouts.
---
## Reason
Concurrent requests during rotation may fail if the old token is revoked before the client receives the new token. A grace period ensures at least one token is always valid.
---
## Bad Example
```php
// Immediate revocation — race condition may lock out client
$oldToken->delete();
$newToken = $user->createToken('mobile', $abilities);
return $newToken->plainTextToken;
```

---
## Good Example
```php
$newToken = $user->createToken('mobile', $abilities);
$oldToken->update(['expires_at' => now()->addMinutes(5)]); // Grace period
Schedule::job(new RevokeToken($oldToken->id))->delay(now()->addMinutes(5));
return $newToken->plainTextToken;
```

---
## Exceptions
Security incident requiring immediate revocation — no grace period.
---
## Consequences Of Violation
Client lockout from race conditions; failed requests during token rotation window.

---
## Rate Limit the Token Refresh Endpoint
---
## Category
Security
---
## Rule
Always apply strict rate limiting to the token rotation/refresh endpoint.
---
## Reason
A valid token can be used to hammer the refresh endpoint, performing a credential rotation attack. Without rate limiting, one valid token can generate unlimited new tokens, amplifying a single compromise.
---
## Bad Example
```php
Route::post('/auth/refresh', [AuthController::class, 'refresh']);
// No rate limiting — attacker can rotate unlimited times
```

---
## Good Example
```php
RateLimiter::for('token-refresh', fn($request) => Limit::perHour(10)->by('user:' . $request->user()->id));

Route::post('/auth/refresh', [AuthController::class, 'refresh'])
    ->middleware(['auth:sanctum', 'throttle:token-refresh']);
```

---
## Exceptions
No common exceptions. Token refresh endpoints must always be rate limited.
---
## Consequences Of Violation
Unlimited token generation from a single valid token; amplified breach impact.

---
## Provide Emergency Token Revocation Endpoint
---
## Category
Security
---
## Rule
Always provide an endpoint or Artisan command that immediately expires all tokens for a user or globally.
---
## Reason
A breach response plan requires immediate token invalidation. Without an emergency revocation mechanism, the response team must manually delete tokens or wait for scheduled cleanup.
---
## Bad Example
```php
// No bulk revocation — must delete tokens individually
```

---
## Good Example
```php
// API endpoint
Route::post('/auth/revoke-all', function (Request $request) {
    $request->user()->tokens()->delete();
    return response()->json(['message' => 'All tokens revoked']);
})->middleware(['auth:sanctum', 'password.confirm']);

// Artisan command
Artisan::command('tokens:revoke-user {userId}', function ($userId) {
    User::findOrFail($userId)->tokens()->delete();
});
```

---
## Exceptions
No common exceptions. Emergency revocation capability is a production requirement.
---
## Consequences Of Violation
Slow incident response; compromised tokens remain valid during the response window.

---
## Use Atomic Operations for Concurrent Refresh Requests
---
## Category
Reliability
---
## Rule
Always handle concurrent token refresh requests atomically to prevent multiple simultaneous rotation requests from creating orphaned tokens.
---
## Reason
If two refresh requests arrive simultaneously, both create new tokens and revoke the original. The client receives two valid tokens and one request's old token may be the other's new token, creating confusion.
---
## Bad Example
```php
// Two concurrent refreshes create duplicate tokens
$newToken = $user->createToken('mobile', $abilities);
$request->user()->currentAccessToken()->delete();
```

---
## Good Example
```php
DB::transaction(function () use ($user, $abilities) {
    $newToken = $user->createToken('mobile', $abilities);
    $user->tokens()
        ->where('id', $request->user()->currentAccessToken()->id)
        ->delete();
    return $newToken;
});
```

---
## Exceptions
No common exceptions. Concurrent safety is essential for refresh endpoints.
---
## Consequences Of Violation
Orphaned tokens; client confusion from receiving multiple valid tokens; token table bloat.

---
## Prune Expired Tokens Regularly
---
## Category
Maintainability
---
## Rule
Always schedule `sanctum:prune-expired` to run daily to remove expired and revoked tokens.
---
## Reason
Expired tokens accumulate in the `personal_access_tokens` table indefinitely. Without cleanup, the table grows without bound, degrading query performance and increasing storage costs.
---
## Bad Example
```php
// No cleanup — expired tokens accumulate forever
```

---
## Good Example
```php
// app/bootstrap/app.php or Console\Kernel
Schedule::command('sanctum:prune-expired --hours=24')->daily();
```

---
## Exceptions
No common exceptions. Regular pruning is essential for database health.
---
## Consequences Of Violation
Table bloat; degraded query performance; increased backup size and restore time.

---
## Implement Clock Skew Tolerance of 30 Seconds
---
## Category
Reliability
---
## Rule
Always add 30 seconds of clock skew tolerance when comparing `expires_at` timestamps in your expiration middleware.
---
## Reason
Server clocks drift even with NTP. A token issued by server A (slightly behind) may appear expired to server B (slightly ahead), causing intermittent authentication failures.
---
## Bad Example
```php
if ($token->expires_at->isPast()) {
    // No tolerance — clock skew causes false positives
}
```

---
## Good Example
```php
if ($token->expires_at && $token->expires_at->subSeconds(30)->isPast()) {
    // 30-second tolerance for clock skew
}
```

---
## Exceptions
Single-server deployments with tightly synced clocks — but tolerance adds negligible risk.
---
## Consequences Of Violation
Intermittent 401 errors on multi-server deployments; hard-to-diagnose token validation failures.

---
## Never Log plainTextToken During Rotation
---
## Category
Security
---
## Rule
Never log the new `plainTextToken` during the rotation process.
---
## Reason
Rotation creates a new plain-text token. Logging it defeats the purpose of rotation — if logs are compromised, the newly rotated token is immediately exposed.
---
## Bad Example
```php
$newToken = $user->createToken('mobile', $abilities);
Log::info('Token rotated', ['new_token' => $newToken->plainTextToken]);
```

---
## Good Example
```php
$newToken = $user->createToken('mobile', $abilities);
Log::info('Token rotated', [
    'token_id' => $newToken->accessToken->id,
    'token_name' => 'mobile',
]);
// plainTextToken never logged
```

---
## Exceptions
No common exceptions. Never log plain-text tokens.
---
## Consequences Of Violation
Newly rotated token exposed via log compromise; rotation security benefit nullified.

---
## Document Token TTLs in API Reference
---
## Category
Maintainability
---
## Rule
Always document the expiration TTL for each token type and ability scope in your API documentation.
---
## Reason
Clients need to know when tokens expire to schedule refresh calls. Undocumented TTLs force clients to discover expiration through trial and error, causing unexpected 401 errors.
---
## Bad Example
```php
// No TTL documentation — clients guess expiration
```

---
## Good Example
```php
// In API documentation:
// | Token Type       | Default TTL |
// |------------------|-------------|
// | Read-only        | 90 days     |
// | Standard         | 30 days     |
// | Admin            | 24 hours    |
// | Billing write    | 7 days      |
```

---
## Exceptions
Internal APIs with direct developer access to the codebase.
---
## Consequences Of Violation
Client applications with hardcoded refresh schedules; unexpected 401 errors when tokens expire.
