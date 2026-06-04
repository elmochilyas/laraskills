# API-Specific Middleware

## Metadata (Domain: API & CRUD System Engineering, Subdomain: API Authentication & Authorization, Last Updated: 2026-06-02)

## Executive Summary
API-specific middleware handles cross-cutting concerns unique to API requests that are not needed for web requests. Common API middleware includes forcing JSON responses (`ForceJson`), adding request identifiers (`addRequestId`), ensuring JSON content type on incoming requests (`EnsureJsonResponse`), and logging API audit trails. These middleware components run before and/or after the controller and are grouped into an API middleware group to ensure consistent behavior across all API endpoints.

## Core Concepts
- **ForceJson response**: Ensures all API responses are JSON by setting the `Accept: application/json` header or overriding the response format. Prevents Laravel from returning HTML/redirect responses on authentication failures.
- **Request ID (`X-Request-Id`)**: A unique identifier (UUID) generated per request, sent in the response header. Enables request tracing across logs, error reporting, and distributed systems.
- **Content negotiation middleware**: Validates that incoming requests have the correct `Content-Type` header and that responses return the expected format.
- **Audit middleware**: Logs API requests and responses (method, URL, status code, duration, user ID, IP) for auditing and debugging.
- **Request timing**: Measures request duration and injects it as a response header (`X-Response-Time`) or logs it.
- **Response compression**: Gzip/brotli compression of API responses for bandwidth reduction (more relevant for large JSON payloads).

## Mental Models
- **Middleware as pipeline stages**: Each middleware is a station on an assembly line. The request passes through each station (modification, validation, logging) before reaching the controller, and the response passes through again on the way back.
- **API middleware as air traffic control**: These middleware components coordinate the safe flow of API traffic — identifying each flight (request ID), ensuring proper communication language (JSON), and logging the flight path (audit).
- **ForceJson as universal translator**: No matter what the client sends, the API always responds in JSON. The ForceJson middleware ensures this translation happens automatically.

## Internal Mechanics
- Middleware are registered in `app/Http/Kernel.php` (Laravel 9/10) or `bootstrap/app.php` (Laravel 11) in the `$middlewareGroups['api']` array.
- ForceJson middleware works by modifying the request's `Accept` header:
  ```php
  $request->headers->set('Accept', 'application/json');
  ```
- Request ID middleware generates a UUID via `Str::uuid()` and stores it in the request attributes:
  ```php
  $requestId = (string) Str::uuid();
  $request->attributes->set('request_id', $requestId);
  $response->headers->set('X-Request-Id', $requestId);
  ```
- Audit middleware uses Laravel's logging system (or a custom DB/ELK pipeline) to record request data.
- Timing middleware records `LARAVEL_START` (defined in `index.php`) or `microtime(true)` at middleware entry and exit.

## Patterns
- **ForceJson middleware**: Set `Accept: application/json` on the request. This ensures `AuthenticationException` returns JSON instead of redirecting to `/login`:
  ```php
  class ForceJsonResponse {
      public function handle($request, Closure $next) {
          $request->headers->set('Accept', 'application/json');
          return $next($request);
      }
  }
  ```
- **AddRequestId middleware**: Injects and returns a `X-Request-Id` header. Include in all API responses for tracing:
  ```php
  class AddRequestId {
      public function handle($request, Closure $next) {
          $requestId = $request->header('X-Request-Id') ?: (string) Str::uuid();
          $request->attributes->set('request_id', $requestId);
          $response = $next($request);
          $response->headers->set('X-Request-Id', $requestId);
          return $response;
      }
  }
  ```
- **EnsureJsonResponse middleware**: Validates that the response `Content-Type` is `application/json`. Useful during development to catch accidentally returning HTML:
  ```php
  class EnsureJsonResponse {
      public function handle($request, Closure $next) {
          $response = $next($request);
          if (!$response->headers->has('Content-Type')) {
              $response->header('Content-Type', 'application/json');
          }
          return $response;
      }
  }
  ```
- **Audit middleware**: Logs request details. Use a dedicated log channel or database table:
  ```php
  class AuditMiddleware {
      public function handle($request, Closure $next) {
          $start = microtime(true);
          $response = $next($request);
          $duration = microtime(true) - $start;
          Log::channel('api-audit')->info('API Request', [
              'method' => $request->method(),
              'url' => $request->fullUrl(),
              'status' => $response->getStatusCode(),
              'duration' => round($duration * 1000, 2),
              'user_id' => $request->user()?->id,
              'ip' => $request->ip(),
              'request_id' => $request->attributes->get('request_id'),
          ]);
          return $response;
      }
  }
  ```
- **Response timing header**: `X-Response-Time` in milliseconds:
  ```php
  $response->header('X-Response-Time', round($duration * 1000, 2).'ms');
  ```
- **Cors middleware**: (Handled separately in CORS KU) — included in the API middleware group for convenience.

## Architectural Decisions
1. **ForceJson in global vs API middleware**: Placing ForceJson in the `api` middleware group is sufficient. Placing it globally (web + api) may interfere with web routes that return views.
2. **Request ID from client vs server**: Prefer server-generated request IDs. If the client provides one, use it as-is (idempotency) but validate it's a proper UUID.
3. **Audit storage**: Log channel vs database vs external service (ELK, DataDog). Log channels are simplest and least intrusive for the database. For compliance-heavy apps, database storage with audit retention policies is needed.
4. **Middleware order**: ForceJson should be the outermost middleware (runs first) so all downstream middleware see JSON headers. Audit should be the outermost on the response path to capture full request/response.

## Tradeoffs (table)
| Middleware | Benefit | Overhead | Maintenance Cost |
|-----------|---------|----------|-----------------|
| ForceJson | Consistent JSON responses | Negligible | Low |
| AddRequestId | Request tracing | Negligible | Low |
| Audit | Debugging + compliance | Log I/O or DB write per request | Medium (log rotation) |
| Timing | Performance monitoring | Negligible | Low |
| EnsureJson | Catch response format bugs | Negligible | Low |
| Response compression | Bandwidth savings (30-70%) | CPU for compression | Low |

## Performance Considerations
- ForceJson, AddRequestId, and EnsureJson add < 0.1ms per request — irrelevant.
- Audit middleware adds log I/O. In high-throughput scenarios, use async logging (Redis log channel) or batch DB inserts.
- Response compression uses CPU. For JSON responses under 1KB, compression adds more overhead than it saves. Compress only responses above 4KB.
- Timing header computation is free (microtime difference).
- Request ID generation using `Str::uuid()` is a single function call — negligible.

## Production Considerations
- **Audit log volume**: An API handling 1M requests/day generates ~2GB of audit logs per month. Configure log rotation and retention policies (30-90 days typical).
- **Request ID in error responses**: When returning error responses, include the `X-Request-Id` in the error payload for easy debugging:
  ```php
  'error' => ['message' => '...', 'request_id' => $requestId]
  ```
- **Audit sampling**: For very high-traffic APIs, sample audit logging (log 1% of requests) to reduce storage and performance impact.
- **ForceJson and error pages**: Override `Whoops` (debug mode) to return JSON errors instead of HTML. Register a custom exception handler for JSON rendering.
- **Rate limiter + Request ID**: Include request ID in rate limit error responses so clients can correlate 429s with their logs.
- **Sensitive data in audit logs**: Strip `Authorization` headers, passwords, credit cards, and PII from audit logs. Use a data sanitizer middleware.

## Common Mistakes
- Placing ForceJson in global middleware — breaks web routes that expect HTML/redirect responses.
- Not handling `X-Request-Id` in exception responses — when an exception occurs before the middleware runs the response, the request ID is lost.
- Logging the full request body in audit logs (can contain sensitive data).
- Adding audit middleware after the rate limiter — rate-limited requests (429) are not audited.
- Using synchronous database inserts for audit logging — the database becomes a bottleneck.
- Generating a new request ID when the client sent one — breaks client-side request tracing.
- Not removing `ForceJson` for webhook endpoints that receive `application/x-www-form-urlencoded` or `multipart/form-data`.

## Failure Modes
1. **Audit log storage full**: Disk fills up with audit logs, causing the application to crash. Solution: Configure log rotation, log shipper (Logstash, Fluentd), or retention limits.
2. **ForceJson breaks file uploads**: ForceJson sets `Accept: application/json` but file uploads need `multipart/form-data` for the response. Solution: ForceJson typically does not affect uploads (the `Accept` header is for response format, not request encoding).
3. **Request ID collision**: Extremely unlikely with UUID v4, but if using a custom ID generator (e.g., timestamp-based), collisions are possible. Solution: Use UUID v4 or v7.
4. **EnsureJson fails on binary responses**: Endpoints that return binary data (CSV exports, PDFs) get overwritten to `application/json`. Solution: Skip EnsureJson on specific routes or override individually.
5. **Audit log async buffer overflow**: When using async logging, the in-memory buffer overflows during traffic spikes. Solution: Use a bounded buffer with a blocking strategy or switch to a more robust transport (Redis list → Logstash).

## Ecosystem Usage
- **Laravel Telescope**: Provides request monitoring similar to audit middleware but with a web UI. Telescope watches all requests and provides debugging insights.
- **Laravel HTTP Client middleware**: The HTTP client supports middleware for outgoing requests. Useful for adding `X-Request-Id` to outgoing requests to propagate tracing.
- **Sentry/Laravel**: Error tracking that uses request IDs to correlate errors with requests. Sentry's Laravel SDK automatically captures request data.

## Related Knowledge Units
### Prerequisites
- Laravel middleware lifecycle (global, group, route)
- HTTP request/response cycle

### Related Topics
- [api-security-headers](./phase-2/13-api-security-headers.md)
- [cors-configuration](./phase-2/12-cors-configuration.md)
- [signed-request-pattern](./phase-2/07-signed-request-pattern.md)

### Advanced Follow-up Topics
- Distributed tracing (OpenTelemetry, Zipkin, Jaeger)
- Middleware priority and ordering strategies
- Event-driven audit logging with Laravel events

## Research Notes
### Source Analysis
Laravel's `app/Http/Kernel.php` (or `bootstrap/app.php` in Laravel 11) controls middleware registration. The `$middlewareGroups['api']` array defines the API middleware stack.

### Key Insight
API-specific middleware is the glue that ensures consistent behavior across all API endpoints. Without ForceJson, an unauthenticated API request returns a login HTML page instead of a JSON 401 — a common Laravel pitfall. The `AddRequestId` middleware is the foundation of observability: without it, correlating a specific API error to log entries is nearly impossible.

### Version-Specific Notes
- **Laravel 9/10**: Middleware registered in `app/Http/Kernel.php`. The `api` middleware group includes `throttle:api` by default.
- **Laravel 11**: Middleware registration moved to `bootstrap/app.php` using the `->withMiddleware()` method. The API middleware group must be explicitly defined.
- **Laravel 11**: The `api` middleware group no longer includes `throttle:api` by default — it must be added in `bootstrap/app.php`.

## Tradeoffs

**Benefit:** Centralized, consistent pattern. **Cost:** Additional abstraction layer, indirection. **Consequence:** Cleaner controllers but requires team discipline to maintain separation.