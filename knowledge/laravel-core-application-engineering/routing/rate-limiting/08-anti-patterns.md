# Anti-Patterns: Rate Limiting

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Routing System |
| Knowledge Unit | Rate Limiting |
| Difficulty | Advanced |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | File Cache Rate Limiting in Multi-Server Production | Reliability | Critical |
| 2 | IP-Based Limiting for Authenticated Users | Architecture | High |
| 3 | Rate Limiting in Business Logic Instead of Routing | Architecture | High |
| 4 | Extremely Low or High Limits Without Traffic Analysis | Performance | High |
| 5 | Not Separating Read and Write Rate Limits | Architecture | Medium |

---

## Anti-Pattern 1: File Cache Rate Limiting in Multi-Server Production

### Category
Reliability

### Description
Using the default file cache driver for rate limiting in a load-balanced, multi-server production environment. Each server maintains its own independent rate limit counter, making the effective limit `max_attempts × server_count` instead of `max_attempts`.

### Why It Happens
Laravel's default cache driver is `file`. It works perfectly in development (single server). Developers configure rate limiting, test locally, see correct behavior, and deploy. The deployment environment (3 servers behind a load balancer) is never tested for rate limit consistency. The issue is invisible during normal traffic — it only manifests under high load or abuse scenarios.

### Warning Signs
- Cache driver is `file` in production
- Application runs on multiple servers behind a load balancer
- Rate limit set to `60,1` but users can make 180 requests per minute before hitting limits
- The `X-RateLimit-Remaining` header shows different values across requests
- 429 responses are inconsistent: some servers block, others don't
- Log analysis shows rate limit violations should have been blocked but weren't

### Why Harmful
The effective rate limit is multiplied by the number of servers, rendering the rate limiter ineffective. A limit of `60,1` on a 3-server cluster effectively allows 180 requests per minute. An attacker targeting the API can make 3x the intended requests before being blocked. For authentication endpoints, this means 3x the brute-force attempts.

### Real-World Consequences
- Rate limit: `throttle:5,1` on login endpoint
- 3 servers behind AWS ALB — each has independent file cache
- Attacker sends 15 login attempts in one minute (5 per server)
- Each server allows 5 attempts — none triggers the 429
- Brute-force attack succeeds; user account compromised
- Investigation: file cache counters are per-server
- Fix: switch to Redis cache driver

### Preferred Alternative
Use a shared cache driver (Redis, Memcached, or database) for rate limiting in multi-server environments.

```php
// Wrong: file cache — per-server counters
// config/cache.php
'default' => env('CACHE_DRIVER', 'file'),

// Correct: Redis — shared counters across all servers
// config/cache.php
'default' => env('CACHE_DRIVER', 'redis'),

'stores' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'cache',
    ],
],

// Or use a dedicated cache store for rate limiting
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)
        ->by($request->user()?->id ?: $request->ip());
});

// Verify in production
// php artisan tinker
// > Cache::store('redis')->get('...') // Check rate limit keys
```

### Refactoring Strategy
1. Check production cache driver: `config('cache.default')`
2. If `file` and running multiple servers: switch to Redis or Memcached
3. Deploy Redis infrastructure if not already present
4. Update `.env` with `CACHE_STORE=redis`
5. Verify rate limiter headers show consistent values across servers
6. Test rate limits under load with multiple servers

### Detection Checklist
- [ ] Cache driver is shared (Redis/Memcached) in multi-server environments
- [ ] File cache is not used for production rate limiting
- [ ] `X-RateLimit-Remaining` is consistent across requests to different servers
- [ ] Rate limit is accurate (not multiplied by server count)
- [ ] Rate limit key space is isolated from other cache data

### Related Rules/Skills/Trees
- Rule: Use shared cache (Redis) for rate limiting in multi-server deployments
- Rule: File cache rate limiting is per-server — effective limit is max × server count
- Related KU: Cache Systems, Redis Configuration

---

## Anti-Pattern 2: IP-Based Limiting for Authenticated Users

### Category
Architecture

### Description
Using the IP address as the rate limit key for authenticated users. Multiple users behind a corporate NAT or VPN share the same IP address — one user's heavy usage blocks all users on that IP.

### Why It Happens
IP-based keying is the simplest approach — `$request->ip()` is always available and works for unauthenticated requests. Developers apply the same key to all endpoints without considering the authenticated case. The simplicity of the `by()` call obscures the fairness problem.

### Warning Signs
- Rate limiter uses `->by($request->ip())` for all requests, authenticated or not
- Entire office reports 429 errors when one user runs a heavy report
- Users on shared VPNs hit rate limits simultaneously
- Rate limit violations are correlated by IP address in the logs
- Support tickets: "My coworker's script caused me to get rate limited"

### Why Harmful
IP addresses are shared resources in corporate environments. One user's heavy API usage (data export script, polling client, misbehaving integration) blocks all users sharing that IP. The rate limiter is supposed to be fair — each user gets the same limit. IP-based keying makes it unfair by tying limits to a shared identifier. This erodes trust in the platform and creates support overhead.

### Real-World Consequences
- API rate limit: 60/min per IP
- Company office has 200 employees behind one corporate NAT (single IP)
- One developer runs a data export script that makes 60 requests in one minute
- All 199 other employees hit 429 for the rest of the minute
- Support ticket: "Our entire company is blocked from the API"
- Root cause: IP-based keying for authenticated users

### Preferred Alternative
Key authenticated requests by user ID and unauthenticated requests by IP.

```php
// Wrong: IP-based for all requests
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)->by($request->ip());
});

// Correct: user ID for authenticated, IP for unauthenticated
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)->by(
        $request->user()?->id ?: $request->ip()
    );
});

// Even better: different limits for authenticated vs guest
RateLimiter::for('api', function (Request $request) {
    $user = $request->user();
    return match (true) {
        $user !== null => Limit::perMinute(200)->by($user->id),
        default => Limit::perMinute(30)->by($request->ip()),
    };
});
```

### Refactoring Strategy
1. Audit all named limiters for IP-only keying
2. Add user ID segmentation: `$request->user()?->id ?: $request->ip()`
3. Consider different limits for authenticated vs guest users
4. Notify affected users (those behind corporate IPs) of improvement
5. Monitor 429 rate after deployment

### Detection Checklist
- [ ] Authenticated requests are keyed by user ID
- [ ] Unauthenticated requests are keyed by IP
- [ ] No shared IP rate limiting for authenticated users
- [ ] Different limits exist for authenticated vs guest users
- [ ] Support tickets about "coworker rate limiting me" are resolved

### Related Rules/Skills/Trees
- Rule: Key authenticated requests by user ID, not IP
- Rule: IP-based limits for authenticated users create unfair shared limits
- Related KU: Authentication, Named Limiters

---

## Anti-Pattern 3: Rate Limiting in Business Logic Instead of Routing

### Category
Architecture

### Description
Implementing rate limiting logic inside controllers or services (manually checking request counts, storing timestamps, returning custom responses) instead of using the routing-level `throttle` middleware.

### Why It Happens
Developers need custom rate limiting behavior that they think the built-in middleware cannot handle — custom response formats, conditional limits based on request data, or per-user-rate calculation. They implement the logic in the controller or service, duplicating the framework's rate limiting infrastructure.

### Warning Signs
- Controller methods have manual request counting logic
- Services track request timestamps in the database or cache
- Custom rate limiting code is duplicated across multiple controllers
- 429 responses are returned from controllers (not from middleware)
- Rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`) are missing or manually set

### Why Harmful
Rate limiting in business logic bypasses the routing layer, where rate limits are supposed to be enforced before controller code runs. Manual implementations often lack atomic operations (race conditions in counter increments), miss standard headers, and duplicate effort across controllers. The rate-limited request still executes controller and service code, wasting resources on a request that will be rejected.

### Real-World Consequences
- `ExportController::download()` checks cache for request count
- Race condition: two concurrent requests both read count as 59 (below limit of 60)
- Both requests increment to 60 and 61 — both allowed
- Controller executes expensive export logic for both
- Export takes 30 seconds and consumes significant memory
- Both requests complete, double the intended load
- Routing-level rate limiting would have blocked the second request atomically

### Preferred Alternative
Use the `throttle` middleware for all rate limiting. For custom response formats, use the `response()` method on the Limit object.

```php
// Wrong: manual rate limiting in controller
public function download(Request $request): Response
{
    $key = 'download:' . $request->user()->id;
    $count = (int) Cache::get($key, 0);
    if ($count >= 3) {
        return response()->json(['error' => 'Too many downloads'], 429);
    }
    Cache::increment($key);
    // ... expensive download logic
}

// Correct: routing-level rate limiting
RateLimiter::for('downloads', function (Request $request) {
    return Limit::perHour(3)
        ->by($request->user()->id)
        ->response(function () {
            return response()->json([
                'error' => 'Download limit exceeded. Try again in 1 hour.',
            ], 429);
        });
});

// Route
Route::get('/downloads/report', [ExportController::class, 'download'])
    ->middleware('throttle:downloads');
```

### Refactoring Strategy
1. Identify manual rate limiting logic in controllers and services
2. Extract the limit configuration into a named limiter via `RateLimiter::for()`
3. Replace manual checks with `throttle` middleware on the route
4. Preserve any custom 429 response format via `->response()`
5. Remove manual counter management code

### Detection Checklist
- [ ] No manual rate limiting logic in controllers or services
- [ ] All rate limits use the `throttle` middleware
- [ ] Custom 429 responses use `Limit::response()`
- [ ] Rate limit headers are set by middleware, not manually
- [ ] Counter operations are atomic (cache-based, not application-level)

### Related Rules/Skills/Trees
- Rule: Use routing-level throttle middleware for rate limiting
- Rule: Rate limiting in controllers wastes resources and lacks atomicity
- Related KU: Throttle Middleware, Custom 429 Responses

---

## Anti-Pattern 4: Extremely Low or High Limits Without Traffic Analysis

### Category
Performance

### Description
Setting rate limits without analyzing production traffic patterns. Limits that are too low block legitimate users; limits that are too high provide no protection against abuse.

### Why It Happens
Developers guess rate limits during initial development. Without production traffic data, any value is arbitrary. "60 per minute" is a common default that fits most APIs but may be too restrictive for some endpoints (read-heavy) or too permissive for others (expensive writes).

### Warning Signs
- Rate limits are round numbers without justification (60, 100, 1000)
- No traffic analysis was performed before setting limits
- Frequent limit violations for legitimate user workflows
- Users complaining about "I hit the rate limit during normal use"
- Or: no rate limit violations ever (limits are too high)
- Expensive endpoints have the same limits as cheap endpoints

### Why Harmful
Limits that are too low create a poor user experience — legitimate users are blocked during normal operation. Support tickets increase, and users lose trust in the platform. Limits that are too high provide no protection — an abusive client can saturate expensive endpoints before hitting the limit. Both extremes indicate the limit was set without understanding the traffic profile.

### Real-World Consequences
- Report export endpoint has `throttle:10,1` — 10 requests per minute
- Normal user workflow: export 3 reports (3 requests), review, export 3 more (6 total)
- User still within limit, but then exports 5 more — blocked at request 11
- Support ticket: "I can't export my reports, the rate limit keeps blocking me"
- Analysis: P99 user makes 15 export requests per hour — limit should be higher
- Fix: change to `throttle:30,1` based on traffic data

### Preferred Alternative
Analyze production traffic to determine P99 request frequency per user for each endpoint category. Set limits at 2-3x the P99 value to accommodate peaks while preventing abuse.

```php
// Wrong: arbitrary limits without data
RateLimiter::for('api', fn (Request $request) =>
    Limit::perMinute(60)->by($request->user()?->id ?: $request->ip())
);

// Correct: data-informed limits
RateLimiter::for('api', fn (Request $request) =>
    Limit::perMinute(200)->by($request->user()?->id ?: $request->ip())
    // P99 is 65 req/min, 3x buffer = 195, rounded to 200
);

// Different limits for different endpoint categories
RateLimiter::for('read-api', fn (Request $request) =>
    Limit::perMinute(500)->by($request->user()?->id ?: $request->ip())
    // Read endpoints: P99 180 req/min, 2.5x buffer
);

RateLimiter::for('write-api', fn (Request $request) =>
    Limit::perMinute(30)->by($request->user()?->id ?: $request->ip())
    // Write endpoints: P99 12 req/min, 2.5x buffer
);

RateLimiter::for('exports', fn (Request $request) =>
    Limit::perHour(20)->by($request->user()?->id ?: $request->ip())
    // Expensive exports: P99 8 req/hour, 2.5x buffer
);
```

### Refactoring Strategy
1. Instrument production traffic to measure request frequency per user per endpoint
2. Calculate P99 values for each endpoint category
3. Set limits at 2-3x the P99 value
4. Monitor limit violation rates — if above 1% of requests, adjust upward
5. Review limits quarterly against traffic growth

### Detection Checklist
- [ ] Rate limits are based on production traffic analysis, not guesses
- [ ] P99 request frequency is known for each endpoint category
- [ ] Limits are 2-3x P99 (room for normal peaks)
- [ ] Limit violation rate is below 1% of total requests
- [ ] Different endpoint categories have different limits based on cost

### Related Rules/Skills/Trees
- Rule: Set rate limits based on production traffic data, not guesses
- Rule: P99 request frequency × 2-3x = appropriate rate limit
- Related KU: Monitoring, Traffic Analysis

---

## Anti-Pattern 5: Not Separating Read and Write Rate Limits

### Category
Architecture

### Description
Applying a single rate limit to all endpoints regardless of operation type. Read-heavy and write-heavy endpoints share the same counter, causing a burst of reads to block writes or vice versa.

### Why It Happens
A single `throttle:60,1` middleware is applied to all routes in the `api` group. The limit covers all endpoints uniformly. Developers don't consider that read operations (listing posts, fetching data) and write operations (creating posts, updating records) have different cost profiles and usage patterns.

### Warning Signs
- All API routes use the same named limiter or the same inline `throttle` parameters
- A data export burst blocks users from creating new records
- Write endpoints have the same limit as read endpoints
- Rate limit violations show a mix of read and write operations
- A user watching auto-refresh on a dashboard (reads blocks writes) hits the limit

### Why Harmful
Read and write operations have different characteristics. Reads are typically cheap, frequent, and can tolerate higher limits. Writes are often expensive, less frequent, and need tighter limits. Sharing a single counter means a user rapidly refreshing a dashboard (many reads) burns through the write budget, preventing legitimate create/update operations. This conflates two distinct rate limiting concerns.

### Real-World Consequences
- Single limiter: `throttle:60,1` for all API routes
- User opens a dashboard with auto-refresh (refreshes every 5 seconds)
- After 5 minutes: 60 read requests → rate limit hit
- User tries to create a new post but gets 429
- Dashboard reads consumed the write budget
- Fix: separate read and write limiters

### Preferred Alternative
Define separate named limiters for read and write operations. Apply them to appropriate route groups.

```php
// Wrong: single rate limit for all operations
Route::middleware('throttle:60,1')->group(function () {
    Route::get('/posts', [PostController::class, 'index']); // Read
    Route::post('/posts', [PostController::class, 'store']); // Write
});

// Correct: separate read and write limiters
RateLimiter::for('reads', fn (Request $request) =>
    Limit::perMinute(200)->by($request->user()?->id ?: $request->ip())
);

RateLimiter::for('writes', fn (Request $request) =>
    Limit::perMinute(30)->by($request->user()?->id ?: $request->ip())
);

// Apply to route groups
Route::middleware('throttle:reads')->group(function () {
    Route::get('/posts', [PostController::class, 'index']);
    Route::get('/posts/{post}', [PostController::class, 'show']);
});

Route::middleware('throttle:writes')->group(function () {
    Route::post('/posts', [PostController::class, 'store']);
    Route::put('/posts/{post}', [PostController::class, 'update']);
    Route::delete('/posts/{post}', [PostController::class, 'destroy']);
});
```

### Refactoring Strategy
1. Audit current rate limit structure — is there a single limiter for all operations?
2. Define separate named limiters for reads vs writes
3. Categorize routes into read groups and write groups
4. Apply appropriate limiters to each group
5. Monitor read vs write violation rates separately

### Detection Checklist
- [ ] Read and write operations have separate rate limits
- [ ] Read bursts do not block write operations
- [ ] Write limits are tighter than read limits
- [ ] Rate limit violations are categorized by operation type
- [ ] Users can read freely while being fairly limited on writes

### Related Rules/Skills/Trees
- Rule: Separate read and write rate limits to prevent reads from blocking writes
- Rule: Reads and writes have different cost profiles — limit accordingly
- Related KU: Route Groups, Named Limiters
