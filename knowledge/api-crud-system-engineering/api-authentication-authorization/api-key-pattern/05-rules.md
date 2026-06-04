# Phase 5: Rules — API Key Pattern

> Generated from 04-standardized-knowledge.md

## Use Dedicated api_keys Table
---
## Category
Code Organization
---
## Rule
Always store API keys in a dedicated `api_keys` table instead of Sanctum's `personal_access_tokens` table.
---
## Reason
API keys have different lifecycle and permission semantics from user tokens — environment scoping, service identity, and separate rate limit contexts. Mixing tables conflates service-to-service credentials with user credentials.
---
## Bad Example
```php
$user->createToken('ci-deploy', ['deploy']);
```

---
## Good Example
```php
Schema::create('api_keys', function (Blueprint $table) {
    $table->id();
    $table->string('prefix', 20)->index();
    $table->string('key_hash');
    $table->string('service_name');
    $table->string('environment');
    $table->json('permissions')->nullable();
    $table->timestamp('expires_at')->nullable();
    $table->timestamp('last_used_at')->nullable();
    $table->timestamps();
});
```

---
## Exceptions
Prototyping phases where speed outweighs separation; can be migrated later.
---
## Consequences Of Violation
Conflated permissions model, no environment isolation, harder audit traceability.

---
## Generate With 256-Bit Entropy Minimum
---
## Category
Security
---
## Rule
Always generate API keys with a minimum of 256 bits of entropy using a cryptographically secure source — `Str::random(64)` or `bin2hex(random_bytes(32))`.
---
## Reason
Low-entropy keys (128 bits or less) can be brute-forced at scale. Attackers with DB read access to hashed keys can offline-crack weak keys faster than 256-bit keys.
---
## Bad Example
```php
$plaintext = Str::random(16);
```

---
## Good Example
```php
$plaintext = Str::random(64);
// Or:
$plaintext = bin2hex(random_bytes(32));
```

---
## Exceptions
No common exceptions. Always generate with 256-bit minimum entropy.
---
## Consequences Of Violation
Key compromise through brute-force, enabling unauthorized API access.

---
## Hash With SHA-256, Never Store Plain Text
---
## Category
Security
---
## Rule
Always hash API keys with SHA-256 before storing. Never store the plain-text key in the database, logs, or cache.
---
## Reason
A database breach exposes all stored keys. SHA-256 is sufficient for high-entropy random keys — bcrypt's cost factor provides no additional benefit for 256-bit inputs and adds unnecessary latency.
---
## Bad Example
```php
ApiKey::create(['key' => $plaintext]);
```

---
## Good Example
```php
ApiKey::create([
    'prefix' => $prefix,
    'key_hash' => hash('sha256', $plaintext),
]);
```

---
## Exceptions
No common exceptions. Always hash.
---
## Consequences Of Violation
Critical data breach — all keys compromised if database is leaked.

---
## Use Prefix for Efficient Lookup
---
## Category
Design
---
## Rule
Always store a separate prefix column and use prefix-based filtering in key lookup queries.
---
## Reason
Scanning all rows for a SHA-256 hash match is expensive. Prefix lookup reduces the candidate set to a handful of rows before applying the full hash comparison.
---
## Bad Example
```php
$key = ApiKey::where('key_hash', hash('sha256', $input))->first();
```

---
## Good Example
```php
$prefix = Str::before($input, '_');
$key = ApiKey::where('prefix', $prefix)
    ->where('key_hash', hash('sha256', $input))
    ->first();
```

---
## Exceptions
Extremely low-volume APIs (<100 keys) where index overhead outweighs lookup benefit.
---
## Consequences Of Violation
Slower key authentication at scale, increased database load on every API request.

---
## Transmit in Header Only, Never URL
---
## Category
Security
---
## Rule
Always transmit API keys via the `Authorization: Bearer` or `X-API-Key` header. Never accept keys as URL query parameters.
---
## Reason
URL parameters are logged by proxies, stored in browser history, and leaked via `Referer` headers. Header transmission avoids all these exposure vectors.
---
## Bad Example
```php
// GET /api/data?api_key=sk_live_abc123
$key = $request->query('api_key');
```

---
## Good Example
```php
$key = $request->bearerToken() ?? $request->header('X-API-Key');
```

---
## Exceptions
Webhook callbacks that cannot set custom headers — sign the request instead of using a URL query key.
---
## Consequences Of Violation
Key leakage through server logs, proxy logs, referrer headers, and browser history.

---
## Scope Keys by Environment
---
## Category
Security
---
## Rule
Always include an `environment` column on API keys and validate it against the current APP_ENV on every request.
---
## Reason
A staging API key should not authenticate against production infrastructure. Environment scoping prevents accidental cross-environment access and limits blast radius of leaked keys.
---
## Bad Example
```php
$key = ApiKey::where('key_hash', $hash)->first();
// No environment check
```

---
## Good Example
```php
$key = ApiKey::where('prefix', $prefix)
    ->where('key_hash', $hash)
    ->where('environment', config('app.env'))
    ->first();
```

---
## Exceptions
Ephemeral environments (review apps, CI) that share an environment classification.
---
## Consequences Of Violation
Staging keys accessing production data; production keys exposed via staging breaches.

---
## Display Plain-Text Key Once Only
---
## ## Category
Security
---
## Rule
Always show the plain-text API key exactly once at creation time. Never store, log, or re-display the raw key after creation.
---
## Reason
The plain-text key is the credential. Storing or re-displaying it multiplies exposure surfaces. If the user loses it, issue a new key.
---
## Bad Example
```php
$key = ApiKey::create([...]);
return response()->json(['key' => $plaintext, 'stored_key' => $plaintext]);
```

---
## Good Example
```php
return response()->json([
    'key' => $plaintext,
    'warning' => 'Copy this key now. It will not be shown again.',
]);
// Do not store $plaintext anywhere
```

---
## Exceptions
No common exceptions. One-time display is non-negotiable.
---
## Consequences Of Violation
Compromised keys via database breach, admin panel access, or log inspection.

---
## Support Concurrent Key Versions During Rotation
---
## Category
Reliability
---
## Rule
Always support a grace period with concurrent key versions during rotation so clients can switch without service disruption.
---
## Reason
Immediate key invalidation breaks all clients using the old key. Overlapping validity windows let clients update at their own pace.
---
## Bad Example
```php
$oldKey->delete();
$newKey = ApiKey::create([...]);
return $newKey;
```

---
## Good Example
```php
$newKey = ApiKey::create([... 'expires_at' => now()->addDays(90)]);
$oldKey->update(['expires_at' => now()->addDays(7)]); // 7-day grace period
```

---
## Exceptions
Security incidents requiring immediate key revocation.
---
## Consequences Of Violation
Production outages as clients fail to authenticate after rotation window closes.

---
## Dedicated Middleware Placed Before Rate Limiting
---
## Category
Architecture
---
## Rule
Always place the API key authentication middleware before rate limiting middleware in the pipeline.
---
## Reason
Rate limiters need the authenticated identity (API key ID) to apply per-key limits. Running auth after rate limiting means unauthenticated requests consume the global rate limit pool.
---
## Bad Example
```php
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->api(prepend: [
        'throttle:api',
        ApiKeyMiddleware::class,
    ]);
})
```

---
## Good Example
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->api(prepend: [
        ApiKeyMiddleware::class,
        'throttle:api',
    ]);
})
```

---
## Exceptions
No common exceptions. Auth must run before rate limiting.
---
## Consequences Of Violation
Misattributed rate limit counts, inability to do per-key throttling.

---
## Use Custom Guard for API Key Auth
---
## Category
Architecture
---
## Rule
Always register a custom authentication guard for API keys in `config/auth.php` rather than hijacking Sanctum's guard.
---
## Reason
A dedicated guard keeps API key authentication separate from user token authentication, allowing independent configuration, middleware, and testing.
---
## Bad Example
```php
// config/auth.php
'guards' => [
    'api' => ['driver' => 'sanctum', 'provider' => 'users'],
],
```

---
## Good Example
```php
// config/auth.php
'guards' => [
    'api-key' => ['driver' => 'api-key', 'provider' => 'api-keys'],
],
```

---
## Exceptions
No common exceptions. Always use a dedicated guard.
---
## Consequences Of Violation
Auth guard conflicts, inability to distinguish API key users from token users.

---
## Rate Limit by API Key for Service-Level Throttling
---
## Category
Scalability
---
## Rule
Always use the API key as the rate limiter key for service-to-service endpoints to apply per-service throttling.
---
## Reason
IP-based rate limiting penalizes all services behind the same NAT. Using the API key as the limiter key ensures each service gets its own budget independent of source IP.
---
## Bad Example
```php
RateLimiter::for('api', fn($request) => Limit::perMinute(100)->by($request->ip()));
```

---
## Good Example
```php
RateLimiter::for('api', fn($request) => Limit::perMinute(100)->by(
    'service:' . ($request->attributes->get('api_key_id') ?? 'unknown')
));
```

---
## Exceptions
Endpoints that must work for unauthenticated callers — fall back to IP-based limiting.
---
## Consequences Of Violation
Unfair throttling when multiple services share an IP; one bad actor starves others.
