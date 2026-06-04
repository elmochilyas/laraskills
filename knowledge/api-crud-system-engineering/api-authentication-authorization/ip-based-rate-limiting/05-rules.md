# Phase 5: Rules — IP-Based Rate Limiting

> Generated from 04-standardized-knowledge.md

## Always Configure TrustProxies Behind Load Balancers
---
## Category
Reliability
---
## Rule
Always configure Laravel's `TrustProxies` middleware when the application runs behind a load balancer or reverse proxy.
---
## Reason
Without TrustProxies, `$request->ip()` returns the load balancer's IP instead of the client IP. IP-based rate limiting then blocks the proxy IP, affecting all users behind it.
---
## Bad Example
```php
// No TrustProxies configuration — all IPs appear as 10.0.0.1 (load balancer)
RateLimiter::for('guest', fn($request) => Limit::perMinute(30)->by($request->ip()));
```

---
## Good Example
```php
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->trustProxies(at: '*');
    // Or specify exact proxies:
    // $middleware->trustProxies(at: ['10.0.0.0/8', '172.16.0.0/12']);
})
```

---
## Exceptions
Directly accessible servers with no intermediate proxy — rare in production.
---
## Consequences Of Violation
IP rate limiting unusable behind load balancers; entire user base blocked when proxy IP hits limit.

---
## Use Compound Keys: User ID for Authenticated, IP for Guests
---
## Category
Design
---
## Rule
Always use a compound rate limit key that switches between user ID (for authenticated) and IP (for guests).
---
## Reason
IP-based limits for authenticated users unfairly penalize everyone behind a NAT gateway when one user hits the limit. User ID provides per-user fairness regardless of IP.
---
## Bad Example
```php
RateLimiter::for('api', fn($request) => Limit::perMinute(60)->by($request->ip()));
// Authenticated users behind NAT share the same limit
```

---
## Good Example
```php
RateLimiter::for('api', function (Request $request) {
    $key = $request->user()
        ? 'user:' . $request->user()->id
        : 'ip:' . $request->ip();
    return Limit::perMinute(60)->by($key);
});
```

---
## Exceptions
Endpoints where user identity must not be linked to rate limit counts (anonymized analytics endpoints).
---
## Consequences Of Violation
Office-wide rate limit blocks from a single user; unfair degradation for NAT users.

---
## Normalize IPv6 to /64 Prefix
---
## Category
Scalability
---
## Rule
Always normalize IPv6 addresses to their /64 prefix before using as rate limit keys.
---
## Reason
A single client can rotate through billions of IPv6 /128 addresses, trivially bypassing per-address rate limits. The /64 subnet identifies the actual client network.
---
## Bad Example
```php
$key = 'ip:' . $request->ip();
// IPv6 address could be any of 2^64 possibilities per client
```

---
## Good Example
```php
$ip = $request->ip();
if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
    $prefix = substr(inet_pton($ip), 0, 8);
    $ip = inet_ntop($prefix);
}
$key = 'ip:' . $ip;
```

---
## Exceptions
IPv4-only APIs or APIs where IPv6 traffic is negligible.
---
## Consequences Of Violation
IPv6-based rate limiting is completely bypassable; attackers rotate addresses freely.

---
## Prefix Rate Limit Keys by Type
---
## Category
Design
---
## Rule
Always prefix rate limit keys with a type identifier (`ip:`, `user:`, `service:`) to prevent collision across different identifier types.
---
## Reason
A user ID of `123` and an IP ending in `.123` produce the same key without prefixes, causing cross-type rate limit collisions and incorrect throttle behavior.
---
## Bad Example
```php
$key = $request->user()?->id ?? $request->ip();
// User ID 123 and IP 10.0.0.123 collide
```

---
## Good Example
```php
$key = $request->user()
    ? 'user:' . $request->user()->id
    : 'ip:' . $request->ip();
```

---
## Exceptions
No common exceptions. Always prefix.
---
## Consequences Of Violation
Rate limit key collision between different consumer types; one consumer's limit incorrectly affects another.

---
## Whitelist Monitoring Endpoints and Monitor Them
---
## Category
Security
---
## Rule
Always exempt health check and monitoring endpoints from IP-based rate limiting, and log every whitelisted request.
---
## Reason
Downstream monitoring tools and kubernetes liveness probes must always reach health endpoints. Logging whitelisted requests detects compromised internal IPs abusing the exemption.
---
## Bad Example
```php
// No exemption — monitoring tools get rate limited
Route::get('/health', [HealthController::class, 'index']);
```

---
## Good Example
```php
Route::get('/health', [HealthController::class, 'index'])
    ->withoutMiddleware('throttle:guest');

// Log all whitelisted requests for security monitoring
```

---
## Exceptions
No common exceptions. Health endpoints must always be accessible.
---
## Consequences Of Violation
Monitoring alerts from rate-limited health checks; Kubernetes killing healthy pods.

---
## Apply IP-Based Limits Early in Middleware Stack
---
## Category
Performance
---
## Rule
Always apply IP-based rate limiting early in the middleware stack, before controllers and database queries.
---
## Reason
Rejecting requests before expensive operations (DB queries, external API calls) saves resources. A rate-limited request should consume minimal server capacity.
---
## Bad Example
```php
// bootstrap/app.php
$middleware->api(prepend: [
    SomeDbQueryMiddleware::class,
    'throttle:guest', // Rate limiting after DB work
]);
```

---
## Good Example
```php
$middleware->api(prepend: [
    'throttle:guest', // Reject before any DB work
    OtherMiddleware::class,
]);
```

---
## Exceptions
No common exceptions. Rate limiting must run as early as possible.
---
## Consequences Of Violation
Server resources wasted processing requests that will be rejected; higher vulnerability to resource-exhaustion attacks.

---
## Never Use $_SERVER['REMOTE_ADDR'] Directly
---
## Category
Security
---
## Rule
Always use `$request->ip()` instead of `$_SERVER['REMOTE_ADDR']` or `request()->ip()` for rate limit key generation.
---
## Reason
`$_SERVER['REMOTE_ADDR']` always returns the immediate connection IP, ignoring proxy forwarding headers. `$request->ip()` respects trusted proxy configuration and returns the real client IP.
---
## Bad Example
```php
$ip = $_SERVER['REMOTE_ADDR']; // Always the proxy IP behind a load balancer
```

---
## Good Example
```php
$ip = $request->ip(); // Respects TrustProxies configuration
```

---
## Exceptions
No common exceptions. Always use `$request->ip()`.
---
## Consequences Of Violation
Wrong IP captured for rate limiting behind proxies; all requests attributed to load balancer IP.

---
## Use Stricter Limits for Login Endpoints
---
## Category
Security
---
## Rule
Always apply stricter IP-based rate limits to login/authentication endpoints than to regular data endpoints (e.g., 5/min for login vs 30/min for data).
---
## Reason
Login endpoints are primary brute-force targets. A standard data endpoint limit of 60/min would allow 3,600 password attempts per hour per IP.
---
## Bad Example
```php
// Same limit for login and data endpoints
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:30,1');
Route::get('/posts', [PostController::class, 'index'])->middleware('throttle:30,1');
```

---
## Good Example
```php
RateLimiter::for('login', fn($request) => Limit::perMinute(5)->by('login:' . $request->ip()));
RateLimiter::for('api', fn($request) => Limit::perMinute(30)->by('ip:' . $request->ip()));

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::get('/posts', [PostController::class, 'index'])->middleware('throttle:api');
```

---
## Exceptions
No common exceptions. Login endpoints require stricter limits.
---
## Consequences Of Violation
Successful brute-force password attacks; account takeovers at scale.

---
## Validate X-Forwarded-For from Trusted Proxies Only
---
## Category
Security
---
## Rule
Always ensure `X-Forwarded-For` headers from untrusted sources are rejected or stripped. Only trust headers appended by known proxies.
---
## Reason
Attackers can spoof `X-Forwarded-For: 127.0.0.1` to forge arbitrary IPs, bypassing IP-based rate limits designed for specific addresses.
---
## Bad Example
```php
// Accepting X-Forwarded-For from anywhere
$middleware->trustProxies(at: '*');
```

---
## Good Example
```php
// Only trust specific proxy IPs
$middleware->trustProxies(at: [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '203.0.113.0/24', // Known load balancer IPs
]);
```

---
## Exceptions
Development environments where proxy IPs are dynamic — but never trust all proxies in production.
---
## Consequences Of Violation
IP spoofing bypasses rate limits; attacker can impersonate any IP address.
