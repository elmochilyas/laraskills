# Phase 5: Rules — Rate Limiting by Auth Tier

> Generated from 04-standardized-knowledge.md

## Detect Tier in Middleware, Not Controllers
---
## Category
Architecture
---
## Rule
Always detect the authentication tier at the middleware layer, not inside controllers.
---
## Reason
Rate limiting is a cross-cutting concern that must be applied before business logic runs. Controller-based tier detection means rate limits are checked after resource-intensive operations, defeating their purpose.
---
## Bad Example
```php
class PostController
{
    public function index(Request $request)
    {
        $tier = $this->resolveTier($request);
        // Rate limit should have been checked before reaching here
    }
}
```

---
## Good Example
```php
// In RateLimiterServiceProvider
RateLimiter::for('api', function (Request $request) {
    $tier = match (true) {
        $request->user()?->isPremium() => 'premium',
        $request->user() => 'user',
        default => 'guest',
    };
    $limits = config("rate-limits.tiers.$tier");
    return Limit::perMinute($limits['per_minute'])->by("$tier:" . ($request->user()?->id ?? $request->ip()));
});
```

---
## Exceptions
No common exceptions. Tier detection belongs in the rate limiting layer.
---
## Consequences Of Violation
Rate limiting checked after expensive operations; tier detection logic duplicated across controllers.

---
## Use IP for Guests, User ID for Authenticated
---
## Category
Design
---
## Rule
Always scope guest rate limits by IP address and authenticated user limits by user ID.
---
## Reason
Guest requests have no user context — IP is the only available identifier. Authenticated requests must use user ID to avoid penalizing all users behind a shared NAT when one hits the limit.
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
    $identifier = $request->user() ? 'user:' . $request->user()->id : 'ip:' . $request->ip();
    return Limit::perMinute(60)->by($identifier);
});
```

---
## Exceptions
APIs where users are expected to have static IPs and NAT is not a concern.
---
## Consequences Of Violation
Fair users blocked by abusive users on the same NAT; support tickets from blocked offices.

---
## Always Include X-RateLimit-Tier in Response Headers
---
## Category
Maintainability
---
## Rule
Always include a custom `X-RateLimit-Tier` header indicating the current auth tier (guest, user, premium).
---
## Reason
Clients need visibility into which tier's limits apply to understand why they received a 429. Without this header, clients cannot distinguish "guest limit exceeded" from "all limits exceeded."
---
## Bad Example
```php
// No tier header — client cannot identify its active limit set
```

---
## Good Example
```php
$response->headers->set('X-RateLimit-Tier', $tier);
$response->headers->set('X-RateLimit-Limit', $limits['per_minute']);
```

---
## Exceptions
Internal APIs where consumers are known and tier information is not meaningful.
---
## Consequences Of Violation
Client confusion about which rate limit applies; harder to debug 429 issues from client side.

---
## Fall Back to Guest Tier on Authentication Failure
---
## Category
Security
---
## Rule
Always fall back to guest-tier rate limiting when token validation fails mid-request — never bypass rate limiting.
---
## Reason
An expired or invalid token should not unlock higher rate limits. Falling back to guest ensures that even unauthenticated requests are throttled, preventing abuse via token manipulation.
---
## Bad Example
```php
RateLimiter::for('api', fn($request) => Limit::perMinute(
    $request->user()?->isPremium() ? 3000 : 300
));
// Expired token user may still be treated as authenticated briefly
```

---
## Good Example
```php
$tier = match (true) {
    $request->user()?->isPremium() => 'premium',
    $request->user() => 'user',
    default => 'guest', // Always falls here on auth failure
};
```

---
## Exceptions
No common exceptions. Auth failure must always fall back to the most restrictive tier.
---
## Consequences Of Violation
Expired tokens bypassing rate limits; abuse via manipulated credentials.

---
## Exempt Health Check and Monitoring Endpoints
---
## Category
Reliability
---
## Rule
Always exempt health check, metrics, and monitoring endpoints from tiered rate limiting.
---
## Reason
Monitoring systems must always reach health endpoints to assess service status. Rate limiting these endpoints causes false alerts and kubernetes pod restarts.
---
## Bad Example
```php
Route::get('/health', [HealthController::class, 'index'])
    ->middleware('throttle:api');
// Monitoring tools get rate limited — false alerts
```

---
## Good Example
```php
Route::get('/health', [HealthController::class, 'index'])
    ->withoutMiddleware('throttle:api');
```

---
## Exceptions
No common exceptions. Health endpoints are exempt.
---
## Consequences Of Violation
False positive monitoring alerts; Kubernetes killing healthy pods; unnecessary incident response.

---
## Publish Exact Tier Limits in API Documentation
---
## Category
Maintainability
---
## Rule
Always document the exact rate limit values for each auth tier in your API documentation.
---
## Reason
Clients need known limits to design their request patterns. Undocumented limits force clients to discover limits through trial and error, causing unnecessary 429 responses.
---
## Bad Example
```php
// No documentation — developers guess limits by hitting 429s
```

---
## Good Example
```php
// In API documentation:
// | Tier    | Per-Minute | Per-Hour |
// |---------|------------|----------|
// | Guest   | 30         | 500      |
// | User    | 300        | 5,000    |
// | Premium | 3,000      | 50,000   |
```

---
## Exceptions
Internal APIs with controlled consumers who already know the limits.
---
## Consequences Of Violation
Developer frustration; unnecessary 429 errors during integration.

---
## Prefix Rate Limit Keys with Tier to Prevent Collision
---
## Category
Design
---
## Rule
Always prefix rate limit keys with the tier type (`guest:`, `user:`, `premium:`, `service:`) before the identifier.
---
## Reason
Without tier prefixes, a user ID of `123` and a service ID of `123` collide under the same rate limit key. Prefixing isolates each tier's counter space.
---
## Bad Example
```php
$key = $request->user()?->id ?? $request->ip();
// User ID 123 and IP ending in .123 collide
```

---
## Good Example
```php
$key = match ($tier) {
    'guest' => 'guest:ip:' . $request->ip(),
    'user' => 'user:id:' . $request->user()->id,
    'premium' => 'premium:id:' . $request->user()->id,
    'service' => 'service:key:' . $request->attributes->get('api_key_id'),
};
```

---
## Exceptions
No common exceptions. Always prefix with tier and type.
---
## Consequences Of Violation
Rate limit key collision between different tiers; incorrect throttle behavior.

---
## Provide Graceful 429 Response with Upgrade Path
---
## Category
Design
---
## Rule
Always return a clear 429 error response that includes the retry-after time and a link to upgrade or documentation.
---
## Reason
A 429 without context frustrates developers and provides no path forward. Including the retry time and a link to upgrade gives clients actionable information.
---
## Bad Example
```json
{"error": "Too Many Requests"}
```

---
## Good Example
```json
{
    "error": "Too Many Requests",
    "retry_after": 45,
    "message": "You have exceeded the guest rate limit. Authenticate or upgrade to increase your limit.",
    "documentation": "https://docs.example.com/rate-limits"
}
```

---
## Exceptions
Internal APIs where consumers have direct access to team communication channels.
---
## Consequences Of Violation
Developer frustration; support tickets asking why requests are failing.

---
## Allow Per-Customer Override for Enterprise Clients
---
## Category
Scalability
---
## Rule
Always support database-driven rate limit overrides for enterprise/whitelabel customers who need higher limits.
---
## Reason
Enterprise clients with high-volume needs will hit standard tier limits. Forcing them through the same limits as individual users creates churn risk and support escalations.
---
## Bad Example
```php
// Fixed limits — no enterprise override possible
'premium' => ['per_minute' => 3000],
```

---
## Good Example
```php
// Allow database-driven override
$customerOverride = CustomerRateLimit::where('user_id', $user->id)->first();
$maxPerMinute = $customerOverride?->per_minute ?? $defaults[$tier]['per_minute'];
```

---
## Exceptions
APIs with no enterprise customer tier.
---
## Consequences Of Violation
Enterprise customers hitting arbitrary limits; customer churn to competitors with better rate limit policies.
