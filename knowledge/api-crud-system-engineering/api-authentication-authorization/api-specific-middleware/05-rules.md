# Phase 5: Rules — API-Specific Middleware

> Generated from 04-standardized-knowledge.md

## Always Include ForceJson in the API Middleware Group
---
## Category
Design
---
## Rule
Always register a ForceJson middleware in the API middleware group that sets `Accept: application/json` on the incoming request.
---
## Reason
Without ForceJson, unauthenticated API requests return HTML login redirects or exception pages instead of JSON 401 responses. This middleware ensures consistent JSON error formatting across all API routes.
---
## Bad Example
```php
// No ForceJson — auth failure returns HTML redirect to /login
Route::get('/api/posts', [PostController::class, 'index'])->middleware('auth:sanctum');
```

---
## Good Example
```php
class ForceJsonMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');
        return $next($request);
    }
}

// In bootstrap/app.php:
->withMiddleware(function (Middleware $middleware) {
    $middleware->api(prepend: [ForceJsonMiddleware::class]);
})
```

---
## Exceptions
No common exceptions. Every Laravel API needs ForceJson in its API group.
---
## Consequences Of Violation
HTML responses returned to API clients; broken error handling; confusing 302 redirects instead of JSON errors.

---
## Never Place ForceJson in the Global Middleware Stack
---
## Category
Architecture
---
## Rule
Never register ForceJson middleware in the global middleware group — only in the `api` middleware group.
---
## Reason
Web routes serving HTML views will break when `Accept: application/json` forces Laravel to return JSON error pages instead of HTML views.
---
## Bad Example
```php
// bootstrap/app.php — global middleware
->withMiddleware(function (Middleware $middleware) {
    $middleware->prepend(ForceJsonMiddleware::class);
})
```

---
## Good Example
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->api(prepend: [ForceJsonMiddleware::class]);
})
```

---
## Exceptions
API-only applications with zero web routes — in that case, the api group is sufficient anyway.
---
## Consequences Of Violation
Web routes returning JSON errors instead of HTML views; broken Inertia and Blade responses.

---
## Add Request ID for End-to-End Tracing
---
## Category
Reliability
---
## Rule
Always assign a unique `X-Request-Id` (UUID) to every incoming API request and propagate it through response headers and logs.
---
## Reason
Request IDs enable correlating error reports, log entries, and support tickets across distributed systems. Without them, tracing a single failing request through logs is nearly impossible.
---
## Bad Example
```php
// No request ID — logs are hard to correlate
Log::error('Payment failed', ['user_id' => $userId]);
```

---
## Good Example
```php
class AddRequestIdMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $request->header('X-Request-Id') ?: (string) Str::uuid();
        $request->attributes->set('request_id', $requestId);
        
        $response = $next($request);
        $response->headers->set('X-Request-Id', $requestId);
        
        return $response;
    }
}
```

---
## Exceptions
No common exceptions. Every API benefits from tracing.
---
## Consequences Of Violation
Inability to correlate errors across logs; slow debugging in production incidents.

---
## Include Request ID in All Error Responses
---
## Category
Maintainability
---
## Rule
Always include the `request_id` in the JSON body of every error response.
---
## Reason
Clients can report the request ID when reporting issues, allowing developers to locate the exact log entry. Without it, support teams have no entry point for debugging.
---
## Bad Example
```json
{"message": "Internal server error"}
```

---
## Good Example
```json
{"message": "Internal server error", "request_id": "550e8400-e29b-41d4-a716-446655440000"}
```

---
## Exceptions
No common exceptions. Always include request_id in error payloads.
---
## Consequences Of Violation
Slow incident response; support teams unable to locate relevant logs.

---
## Implement Audit Middleware with Async Storage
---
## Category
Scalability
---
## Rule
Always use asynchronous log channels (Redis, ELK) for audit logging instead of synchronous database inserts.
---
## Reason
Synchronous DB inserts in audit middleware create a database bottleneck on every request, reducing API throughput and adding latency proportional to DB write load.
---
## Bad Example
```php
class AuditMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        ApiAudit::create([...]); // Synchronous DB insert
        return $response;
    }
}
```

---
## Good Example
```php
class AuditMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        Log::channel('redis')->info('api.audit', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'status' => $response->getStatusCode(),
            'duration_ms' => $duration,
            'user_id' => $request->user()?->id,
            'ip' => $request->ip(),
            'request_id' => $request->attributes->get('request_id'),
        ]);
        return $response;
    }
}
```

---
## Exceptions
Low-traffic internal APIs (<100 req/s) where synchronous logging overhead is negligible.
---
## Consequences Of Violation
Database connection pool exhaustion under load; increased p99 latency; audit writes failing during traffic spikes.

---
## Strip Sensitive Data from Audit Logs
---
## Category
Security
---
## Rule
Always filter sensitive fields (Authorization headers, passwords, credit cards, PII) from audit log entries.
---
## Reason
Audit logs are often stored longer than request data and replicated to SIEM systems. Storing sensitive data in logs creates a compliance violation (PCI-DSS, GDPR) and expands the breach surface.
---
## Bad Example
```php
Log::info('api.audit', ['headers' => $request->headers->all()]);
```

---
## Good Example
```php
Log::info('api.audit', [
    'method' => $request->method(),
    'url' => $request->fullUrl(),
    'status' => $response->getStatusCode(),
    // Authorization header intentionally omitted
]);
```

---
## Exceptions
PCI-compliant logging systems that handle sensitive data with encryption and retention controls.
---
## Consequences Of Violation
Compliance violations (GDPR, PCI-DSS); sensitive data exposure if log storage is breached.

---
## Run Audit Middleware Before Rate Limiting
---
## Category
Architecture
---
## Rule
Always register audit middleware before (outside of) rate limiting middleware so rate-limited requests are still audited.
---
## Reason
Rate-limited requests (429 responses) bypass the controller but may still indicate abuse patterns. Auditing them enables detection of attack ramps before they hit limits.
---
## Bad Example
```php
// Middleware order: throttling before audit
$middleware->api(prepend: ['throttle:api', AuditMiddleware::class]);
// 429 responses are never logged
```

---
## Good Example
```php
$middleware->api(prepend: [AuditMiddleware::class, 'throttle:api']);
// All requests, including 429s, are audited
```

---
## Exceptions
No common exceptions. Audit before rate limiting is the correct order.
---
## Consequences Of Violation
Blind spot for abuse patterns preceding rate limit activation; incomplete audit trail.

---
## Add Response Timing Header
---
## Category
Maintainability
---
## Rule
Always include an `X-Response-Time` header with the request duration in milliseconds on every API response.
---
## Reason
Response timing enables clients and monitoring tools to diagnose latency without server-side access. It provides an immediate signal when endpoint performance degrades.
---
## Bad Example
```php
// No timing information — clients cannot diagnose slow responses
```

---
## Good Example
```php
class ResponseTimingMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $start = hrtime(true);
        $response = $next($request);
        $duration = (hrtime(true) - $start) / 1_000_000; // ms
        $response->headers->set('X-Response-Time', round($duration, 2));
        return $response;
    }
}
```

---
## Exceptions
No common exceptions. Negligible performance cost.
---
## Consequences Of Violation
Clients and monitoring tools lack visibility into endpoint performance degradation.
