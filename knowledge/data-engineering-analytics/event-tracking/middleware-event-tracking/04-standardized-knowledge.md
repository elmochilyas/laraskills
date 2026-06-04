# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 01-event-tracking
**Knowledge Unit:** middleware-event-tracking
**Difficulty:** Foundation
**Category:** Event Ingestion
**Last Updated:** 2026-06-03

---

# Overview

Middleware-based event tracking is the primary ingestion pattern for analytics in Laravel. It captures user actions — page views, clicks, API requests — via Laravel's `terminate()` middleware hook, firing after the HTTP response is sent to the client. This decouples tracking latency from user-facing response time, ensuring analytics instrumentation never slows down the user experience.

The pattern is foundational to the entire analytics ecosystem. Every analytics package in Laravel — from simple page view trackers to complex event pipelines — builds on middleware-based capture. Understanding its guarantees and limitations is prerequisite to architecting any analytics pipeline.

Engineers must care because the choice between `terminate()` and `handle()`, synchronous versus async dispatch, and global versus route middleware directly determines reliability, performance, and data quality for the entire analytics system.

---

# Core Concepts

## `terminate()` vs `handle()`

`handle()` executes during the request lifecycle — the response has not been sent to the client yet. `terminate()` executes after the response has been sent, in Laravel's post-response lifecycle. For analytics, `terminate()` is preferred because it does not add to the response time perceived by the user. The tradeoff is that `terminate()` middleware cannot modify the response.

## Synchronous vs Async Dispatch

Events captured in middleware can be dispatched synchronously (written to the database in the same process) or asynchronously (dispatched to a queue). Synchronous dispatch guarantees delivery but blocks the terminate phase. Async dispatch preserves response time but introduces queue latency and potential for job loss.

## Request Context

The middleware has access to the full `Request` object — URL, headers, IP, user agent, authenticated user, session data. This is the capture point for all event context. The middleware must extract and serialize the relevant data before the request object goes out of scope.

## Stateless Constraint

Middleware executes in a shared-nothing PHP-FPM or worker context. Each request is independent. Event tracking must not rely on in-memory state accumulated across requests. All state required for enrichment must be fetched fresh or cached externally.

---

# When To Use

- Page view tracking for analytics dashboards
- API usage monitoring and rate limiting
- Feature adoption tracking (which features users are using)
- Performance monitoring (capturing response times per route)
- A/B test assignment logging
- Audit logging of user actions

---

# When NOT To Use

- Server-to-server event ingestion (use direct API calls or queue dispatch)
- Background job event tracking (queue jobs have no request context)
- Real-time event streams with sub-second latency requirements (use WebSocket-based capture)
- Event sourcing for domain events (use dedicated event sourcing infrastructure)
- Third-party analytics forwarding as primary concern (use dedicated SDK or JavaScript snippet)

---

# Best Practices

## Use `terminate()` for All Analytics Events

Never use `handle()` for analytics tracking. The user should not wait for analytics instrumentation to complete before seeing the response. The only exception is when middleware needs to modify the response based on tracking data.

## Extract Context Before Queue Dispatch

If dispatching to a queue from middleware, extract and serialize all required request context before calling `dispatch()`. The `Request` object is not serializable by Laravel's queue system. Use a DTO to capture the data needed by the processing job.

## Keep Middleware Fast

The `terminate()` method executes in the application's main process. If tracking logic is slow (database writes, external API calls), it will block subsequent terminate callbacks. Offload heavy work to the queue.

## Use Middleware Aliases for Route-Specific Tracking

Not all routes need tracking. Define middleware aliases and apply them only to routes that require analytics. Global middleware tracks everything, which increases storage costs and signal-to-noise ratio.

---

# Architecture Guidelines

## Layer Placement

Middleware is the ingress layer. It should extract and validate, not enrich or transform. Enrichment (geo-IP lookup, user-agent parsing) should happen in queue jobs downstream of the middleware.

## Pipeline Flow

HTTP Request → Route Middleware Stack → Controller → Response Sent → `terminate()` Middleware → Event Capture → Queue Dispatch → Job Processing

The middleware hands off to the queue; it should not perform enrichment itself.

## Integration with Other Middleware

Order matters. The analytics middleware must execute after authentication middleware (to have user context) and after GDPR consent middleware (to respect privacy choices). Configure middleware priority in `Kernel.php`.

---

# Performance Considerations

- `terminate()` middleware does not affect response time, but it does consume PHP-FPM worker time after the response is sent.
- Synchronous tracking with database INSERT in terminate blocks the worker for the duration of the write.
- For high-traffic applications, always use queue-based dispatch from middleware.
- The middleware itself should do no I/O beyond queue dispatch. I/O in terminate blocks the worker from accepting the next request.

---

# Security Considerations

- The middleware has access to the full request. Never log or store raw request bodies, passwords, or tokens.
- Validate and sanitize all request data before storing. Attackers can send crafted requests with malicious payloads in tracking data.
- Ensure middleware respects GDPR consent checks before capturing events.
- Rate limit tracking endpoints to prevent analytics injection attacks.

---

# Common Mistakes

## Mistake: Using `handle()` Instead of `terminate()`

Developers implement tracking logic in `handle()`, adding latency to every tracked request. Users experience slower page loads because of analytics instrumentation.

**Better approach:** Always use `terminate()` for analytics tracking. Reserve `handle()` for middleware that must modify the response.

## Mistake: Tracking in Global Middleware

Registering analytics middleware globally and then filtering out routes in the middleware logic. This adds unnecessary conditionals and makes the middleware harder to test.

**Better approach:** Assign the middleware to specific route groups that require tracking.

## Mistake: Direct Database Writes in Middleware

Writing analytics events directly to the database in `terminate()` without using a queue. Slow database writes block subsequent terminate callbacks and hold the PHP-FPM worker.

**Better approach:** Dispatch a job to the queue with the captured event data.

---

# Anti-Patterns

## Fat Middleware

Middleware that captures, enriches, transforms, and stores analytics events. This violates single responsibility and makes the tracking system fragile.

**Solution:** Middleware captures and dispatches. Enrichment, transformation, and storage are separate concerns handled by queue jobs.

## Serializing the Entire Request

Passing the entire `Request` object as a property to a queued job. Laravel cannot serialize the full `Request` object, causing job failures.

**Solution:** Extract only the required data fields and dispatch them as a DTO or array payload.

---

# Examples

## Analytics Middleware

```php
class TrackPageView
{
    public function __construct(private TrackPageViewJob $job) {}

    public function terminate(Request $request, mixed $response): void
    {
        if (!$request->route() || $this->shouldSkip($request)) {
            return;
        }

        $event = new PageViewEvent(
            url: $request->fullUrl(),
            method: $request->method(),
            statusCode: $response instanceof Response ? $response->getStatusCode() : null,
            userId: $request->user()?->id,
            userAgent: $request->userAgent(),
            ip: $request->attributes->get('anonymized_ip'),
            duration: defined('LARAVEL_START') ? (microtime(true) - LARAVEL_START) : null,
        );

        dispatch(new TrackPageViewJob($event));
    }

    private function shouldSkip(Request $request): bool
    {
        return Str::startsWith($request->path(), ['_debugbar', 'telescope', 'horizon']);
    }
}
```

## Middleware Registration

```php
// In Kernel.php or RouteServiceProvider
protected $routeMiddleware = [
    'track' => \App\Http\Middleware\TrackPageView::class,
];

// In routes/web.php
Route::middleware(['auth', 'track'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/reports', [ReportController::class, 'index']);
});
```

---

# Related Topics

**Prerequisites:**
- Laravel Middleware Fundamentals — Request lifecycle, middleware execution order

**Closely Related:**
- Queue Dispatching — Direct dependency — middleware hands off to queues
- GDPR Compliance — IP anonymization and consent checks in middleware
- Circuit Breaker — Rate limiting and failure protection for tracking pipeline

**Advanced Follow-Up:**
- Multi-Tenancy Analytics — Extends middleware with tenant resolution

**Cross-Domain Connections:**
- Laravel Execution Lifecycle — Middleware execution order and terminate lifecycle
