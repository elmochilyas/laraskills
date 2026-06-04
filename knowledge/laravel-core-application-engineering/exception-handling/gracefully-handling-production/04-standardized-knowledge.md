# Gracefully Handling Production Errors

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Gracefully Handling Production Errors
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

## Overview

Production error handling encompasses strategies for maintaining application availability during failures, including maintenance mode decisions, failsafe error pages, health check endpoints, and monitoring. The goal is to minimize user impact when things go wrong — serving degraded responses instead of white screens, providing clear communication during downtime, and detecting failures before users report them.

The engineering value is production resilience. A well-designed production error strategy means the difference between a minor incident and a major outage. Users see branded maintenance pages instead of cryptic errors. Operations teams get alerted before users notice problems. The application degrades gracefully rather than failing completely.

## Core Concepts

- **Maintenance Mode:** `php artisan down` puts the application in a 503 maintenance state with a configurable retry header and secret bypass token. A nuclear option — blocks all traffic.
- **Failsafe Error Page:** A minimal, self-contained 500 error page with no dependencies on the application's layout, database, or cache. The last line of defense when everything else fails.
- **Health Check Endpoints:** `/health` (app responds) and `/health/db` (database connected) endpoints for infrastructure routing, load balancer checks, and synthetic monitoring.
- **Degraded Operation:** Serving reduced functionality during partial failures — cached data instead of live queries, read-only mode during database issues, feature-specific error pages instead of full 503.
- **Error Monitoring:** Proactive detection of production errors via log monitoring, error tracking services, and alerting rules.

## When To Use

- Every production application needs a failsafe 500 error page
- Applications behind load balancers need health check endpoints
- Planned deployments with downtime need maintenance mode with retry headers
- Applications with partial failure modes need degraded operation strategies
- All production applications need error monitoring and alerting

## When NOT To Use

- Do NOT use maintenance mode for partial or feature-specific failures — use degraded operation
- Do NOT use maintenance mode during rolling deployments with zero-downtime strategy
- Do NOT expose health check endpoints without rate limiting or authentication on external-facing instances
- Do NOT rely solely on health checks — they can't detect all failure modes (wrong data, partial outage)

## Best Practices

- **Fail-safe before fail-over:** A failsafe error page is more important than complex fail-over logic. When everything breaks, users should see a branded page, not a white screen.
- **Degrade, don't die:** Partial failures should degrade specific features, not take down the entire application. Cache fallbacks, read-only mode, and feature flags enable graceful degradation.
- **Maintenance mode is a last resort:** Reserve `php artisan down` for deployments, data-corrupting failures, and complete outages. Feature-specific failures should not block all traffic.
- **Monitor proactively:** Health checks catch infrastructure failures. Log monitoring catches everything else. Both are needed for comprehensive coverage.

## Architecture Guidelines

- Create a minimal, self-contained `resources/views/errors/500.blade.php` with inline CSS, no layouts, no database queries
- Implement `/health` (app status) and `/health/db` (database status) endpoints
- Use `php artisan down --retry=60 --secret="..."` for planned maintenance
- Configure error monitoring (Sentry/Flare/Bugsnag) from day one of production
- Set up alerting for CRITICAL exception types
- Implement feature flags for gradual rollback during incidents
- Test the failsafe page by forcing an error in the handler in a staging environment

## Performance Considerations

Health check endpoints should be fast: `/health` should be a memory-only response (~0.1ms). `/health/db` should use a lightweight query like `SELECT 1` (~1-5ms). Avoid loading the full application framework in health checks — use Laravel's lightweight route middleware stack. Maintenance mode checks are cached per request — negligible overhead.

## Security Considerations

- Health check endpoints must not expose internal application details
- Maintenance mode bypass secret must be rotated regularly
- Health check responses should not reveal database schema or version information
- Rate limit health check endpoints to prevent abuse
- Ensure health check endpoints are not accessible from external networks in production

## Common Mistakes

1. **No Failsafe Error Page:** The 500 error page uses the application layout with database queries. When the database is down, the error page itself fails — users see a white screen.

2. **Maintenance Mode for Partial Failure:** The search feature is down, so the entire application is put in maintenance mode. All users are blocked when only search is broken.

3. **No Retry Header:** `php artisan down` without `--retry=` causes bots and tools to hammer the 503 page, compounding server load.

4. **Health Check Without DB Check:** `/health` returns 200 but the database is disconnected. Load balancer keeps routing traffic to a broken node.

5. **No Monitoring or Alerting:** Production errors are invisible until users report them. No one knows the application is failing.

## Anti-Patterns

- **The Cascading Error Page:** The 500 error page depends on the database — when the database is down, the error page doesn't render.
- **The Nuclear Button:** Using maintenance mode for every failure, including minor feature-specific issues.
- **The Silent Production:** No error monitoring, no alerting, no health checks — production is a black box.
- **The Public Health Check:** Exposing unauthenticated health check endpoints that reveal internal application state.

## Examples

### Minimal Failsafe 500 Page
```blade
{{-- resources/views/errors/500.blade.php --}}
<!DOCTYPE html>
<html>
<head><title>Server Error</title>
<style>body{font-family:sans-serif;text-align:center;padding:80px 20px}
h1{font-size:48px;color:#333}p{color:#666;max-width:500px;margin:20px auto}
</style></head>
<body>
<h1>500</h1>
<p>Something went wrong. Our team has been notified.</p>
@isset($reference)
<p>Reference: {{ $reference }}</p>
@endisset
</body>
</html>
```

### Health Check Endpoint
```php
// routes/api.php
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

Route::get('/health/db', function () {
    try {
        DB::select('SELECT 1');
        return response()->json(['status' => 'ok', 'database' => 'connected']);
    } catch (Throwable $e) {
        return response()->json(['status' => 'error', 'database' => 'disconnected'], 500);
    }
});
```

### Maintenance Mode with Secret Bypass
```bash
php artisan down --retry=60 --secret="bypass-token"
# Access: https://example.com/bypass-token
```

### Degraded Operation
```php
class ProductController
{
    public function recommendations()
    {
        try {
            $products = RecommendationEngine::forUser(auth()->id());
        } catch (RecommendationException $e) {
            Log::warning('Recommendation engine down, using fallback');
            $products = Product::popular()->limit(10)->get();
        }
        return view('products.recommendations', compact('products'));
    }
}
```

## Related Topics

- **Exception Handler Configuration** — base handler setup
- **Error Tracking Integration** — Sentry, Flare, Bugsnag
- **Exception Rendering Patterns** — error page rendering
- **Production vs Debug Display** — environment configuration
- **Maintenance Mode** — Laravel's built-in maintenance features

## AI Agent Notes

- Create a minimal, dependency-free 500 error page for production
- Implement `/health` and `/health/db` endpoints for infrastructure
- Use maintenance mode only as a last resort — prefer degraded operation
- Configure error monitoring from day one of production
- Add `--retry` and `--secret` to maintenance mode commands
- Test the failsafe page by forcing handler failures in staging
- Set up alerting for CRITICAL exception types
