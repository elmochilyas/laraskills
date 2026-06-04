# Anti-Patterns — Rate Limit Error Responses

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Knowledge Unit | Rate Limit Error Responses |
| Difficulty | Intermediate |
| Category | Implementation Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Returning 429 Without Retry-After | High | Medium | Code review: 429 response missing Retry-After header |
| No X-RateLimit on Success Responses | Medium | High | Code review: rate limit headers only on 429 |
| Same Limiter for Login and API | Critical | Medium | Code review: login brute force blocks legitimate traffic |
| Rate Limit After Auth | High | Medium | Code review: rate limiting applied after authentication middleware |
| Header Name Inconsistency | Medium | Low | Code review: different header names per environment |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Non-Atomic Counter | Read-then-write race conditions | Under-counting allows limit bypass |
| Rate Limit Information Only on 429 | Clients unaware they're approaching limits | Hitting limit is unexpected |
| One-Size-Fits-All Limit | Same limit for authenticated and unauthenticated users | Uneven protection |

---

## Anti-Pattern Details

### AP-RLE-01: Returning 429 Without Retry-After

**Description**: The rate limit error response (HTTP 429) does not include the `Retry-After` header. The client knows it is rate-limited but has no information about when it can retry. Clients must use exponential backoff guessing, which leads to either premature retries (exacerbating the load) or overly conservative waits (poor user experience).

**Root Cause**: The developer doesn't include the header in the 429 response, or the rate limiting middleware doesn't provide retry timing.

**Impact**:
- Clients cannot implement informed backoff
- Premature retries continue to hit the server, worsening the load
- Clients may retry indefinitely (no max wait time communicated)
- RFC 6585 compliance violation (Retry-After is mandatory for 429)

**Detection**:
- Code review: 429 response has no `Retry-After` header
- Code review: rate limit error envelope has no `retry_after` detail field
- Client issues: "We hit rate limits but don't know when to retry"

**Solution**:
- Always include `Retry-After` header as integer seconds in 429 responses
- Mirror the retry timing in the response body (`detail.retry_after_seconds`)
- Include both seconds and ISO 8601 timestamp formats in the body
- Derive the value from the rate limiter's available-in time

**Example**:
```php
// BEFORE: No Retry-After header
public function render(ThrottleRequestsException $e, Request $request): JsonResponse
{
    return response()->json([
        'error' => ['code' => 'SYSTEM.RATE_LIMITED', 'message' => 'Too many requests.', 'status' => 429],
    ], 429); // ❌ no Retry-After header
}

// AFTER: Retry-After in header and body
public function render(ThrottleRequestsException $e, Request $request): JsonResponse
{
    $retryAfter = $e->getHeaders()['Retry-After'] ?? 60;
    return response()->json(
        new ErrorEnvelope(
            code: ErrorCodes::SYSTEM_RATE_LIMITED,
            message: 'Too many requests.',
            status: 429,
            detail: [
                'retry_after_seconds' => (int) $retryAfter,
                'retry_after' => now()->addSeconds((int) $retryAfter)->toIso8601String(),
            ],
        ),
        429,
        ['Retry-After' => $retryAfter], // ✅ mandatory header
    );
}
```

---

### AP-RLE-02: Same Limiter for Login and API

**Description**: A single rate limiter governs both login attempts and general API access. An attacker launching a credential-stuffing attack on the login endpoint exhausts the rate limit for all API users — legitimate users are blocked from accessing the entire API because someone is trying to brute-force passwords.

**Root Cause**: Using the default global rate limiter for all endpoints, including authentication.

**Impact**:
- Login brute force causes denial of service for all API consumers
- Legitimate users cannot access any endpoint during a login attack
- The login limiter cannot be tuned independently (login needs stricter limits)
- Monitoring cannot differentiate login attacks from API abuse

**Detection**:
- Code review: same `RateLimiter` name used for both `login` and `api` routes
- Code review: `RateLimiter::for('api', ...)` used on both login and general endpoints
- Incident analysis: API-wide throttling traced to login-endpoint attack

**Solution**:
- Create distinct rate limiters for login, general API, and premium tiers
- Login: strict (5 attempts/minute)
- General API: moderate (60 requests/minute for guests, 300 for authenticated)
- Premium: generous (1000+ requests/minute)
- Apply login limiter only to auth routes, API limiter to all other routes

**Example**:
```php
// BEFORE: Single limiter for everything
// app/Providers/RouteServiceProvider.php
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
});
// Both login and API routes use the same 'api' limiter

// AFTER: Separate limiters
RateLimiter::for('login', function (Request $request) {
    return Limit::perMinute(5)->by($request->input('email') . '|' . $request->ip());
});

RateLimiter::for('api', function (Request $request) {
    return $request->user()
        ? Limit::perMinute(300)->by($request->user()->id)
        : Limit::perMinute(60)->by($request->ip());
});

// routes/api.php
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::middleware('throttle:api')->group(function () {
    // All other API routes
});
```

---

### AP-RLE-03: Rate Limit After Auth

**Description**: Rate limiting middleware is applied after the authentication middleware. An unauthenticated attacker can make unlimited login attempts because the rate limit check never runs — the auth middleware processes the request, attempts authentication, fails, and returns a response without the rate limit being checked.

**Root Cause**: Incorrect middleware ordering. The `throttle` middleware is listed after `auth` in the route or controller middleware.

**Impact**:
- Authentication endpoints have no rate protection
- Brute force attacks succeed because there's no attempt throttling
- Password guessing is unlimited
- Credential stuffing attacks operate at full speed

**Detection**:
- Code review: middleware order in `routes/api.php` or controller — `auth` before `throttle`
- Code review: `Route::post('/login', ...)->middleware(['auth', 'throttle:login'])` — wrong order
- Security audit: login endpoint has no rate limiting

**Solution**:
- Apply rate limiting BEFORE authentication for login endpoints
- Apply rate limiting based on IP + email (not authenticated user ID) for login
- Correct middleware order: `throttle` first, then `auth`
- Rate limit by IP and email field for auth endpoints

**Example**:
```php
// BEFORE: Auth before throttle
Route::post('/login', [AuthController::class, 'login'])
    ->middleware(['auth:api', 'throttle:login']); // ❌ auth checked first, throttle never reached for unauth

// AFTER: Throttle before auth
Route::post('/login', [AuthController::class, 'login'])
    ->middleware(['throttle:login']); // ✅ rate limit applied before auth attempt
// Note: no 'auth' middleware on login endpoint — it's the login endpoint
```
