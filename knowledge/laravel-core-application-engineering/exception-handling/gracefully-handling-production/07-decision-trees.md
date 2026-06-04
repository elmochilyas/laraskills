# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Gracefully Handling Production Errors
**Generated:** 2026-06-03

---

# Decision Inventory

* Maintenance Mode (php artisan down) vs Normal Error Handling
* Failsafe Error Page (resources/views/errors/500.blade.php) vs Handler Fallback
* Health Check Endpoint vs Log Monitoring for Detection

---

# Architecture-Level Decision Trees

---

## Decision 1: Maintenance Mode (php artisan down) vs Normal Error Handling

---

## Decision Context

Whether to put the application in maintenance mode (blocking all traffic with a 503 response) or let traffic through with degraded error handling.

---

## Decision Criteria

* Whether the failure affects all users or a subset
* Whether the failure is caused by a deployment or infrastructure change vs a transient condition
* Whether degraded operation is possible (cached reads, fallback services) vs complete outage
* Whether the maintenance is planned (deployment) or unplanned (incident)

---

## Decision Tree

Is the failure caused by a planned deployment or infrastructure change?
↓
YES → Is the deployment expected to cause temporary downtime?
    YES → Use `php artisan down` with retry header — `php artisan down --retry=60`
    NO → Is this a rolling deployment with zero-downtime strategy?
        YES → Do NOT use maintenance mode — health check failures redirect traffic to healthy nodes
        NO → Use `php artisan down` — plan for the downtime window
NO → Is the failure an unplanned incident affecting ALL users?
    YES → Is degraded operation possible (serve stale cache, read-only mode)?
        YES → Do NOT use maintenance mode — serve degraded responses, log the issue
        NO → Use `php artisan down` if the error is producing harmful results (corrupting data, exposing wrong data)
NO → Is the failure affecting only a subset of users (specific feature, specific region)?
    YES → Do NOT use maintenance mode — feature flag or route-based redirect to an error page
    NO → Use `php artisan down` only as a last resort — prefer degraded operation

---

## Rationale

Maintenance mode is a nuclear option — it blocks all traffic. For most failures, degraded operation (stale cache, read-only mode, feature-specific error page) is better than a full 503. Maintenance mode should be reserved for deployments, data-corrupting failures, and complete outages.

---

## Recommended Default

**Default:** Do NOT use maintenance mode for partial or feature-specific failures. Use `php artisan down --retry=60` for planned deployments with expected downtime.
**Reason:** Maintenance mode is a last resort. Degraded operation preserves user experience for the unaffected parts of the application.

---

## Risks Of Wrong Choice

* Maintenance mode for partial failure: All users blocked when only the search feature is broken
* No maintenance mode for data corruption: Users continue corrupting data — worse than downtime
* No retry header: Bots and tools hammer the 503 — compounds the server load
* Overuse of maintenance mode: Users lose trust in availability, churn to competitors

---

## Related Rules

* Maintenance Mode Strategy
* Production Error Response

---

## Related Skills

* Maintenance Mode Configuration
* Graceful Error Recovery

---

---

## Decision 2: Failsafe Error Page vs Handler Fallback

---

## Decision Context

What to render when the exception handler itself fails — whether to rely on Laravel's failsafe or provide a custom fallback.

---

## Decision Criteria

* Whether the application has custom Blade error templates that could themselves error
* Whether the application requires branded error pages even when the framework can't render normally
* Whether the team has tested the error page rendering path under failure conditions
* Whether the application is API-only (no HTML rendering needed)

---

## Decision Tree

Is the application API-only?
↓
YES → Ensure the handler returns JSON even in fallback — implement a manual `try/catch` in the handler
NO → Are custom Blade error templates used for 500 errors?
    YES → Does the error page use the application layout or complex Blade components?
        YES → Create a minimal, dependency-free failsafe at `resources/views/errors/500.blade.php`
        NO → Test that the simple template renders correctly — no special failsafe needed
    NO → Is the default Laravel 500 page acceptable for production?
        ↓
        YES → No failsafe needed — Laravel has a built-in fallback
        NO → Create a minimal, dependency-free failsafe — no layouts, no components, no DB

---

## Rationale

The 500 error page itself can fail if it depends on the same services that caused the original error (database, cache, layout). A minimal failsafe uses no dependencies — pure HTML/CSS inline, no layout inheritance, no DB queries. Laravel provides a built-in fallback, but it's unbranded.

---

## Recommended Default

**Default:** Create a minimal, self-contained `resources/views/errors/500.blade.php` with inline CSS, no layout inheritance, no database queries, and no complex Blade directives. Test it by forcing an error in the handler.
**Reason:** The failsafe page is the last line of defense. If it depends on the same infrastructure that's failing, users see a white screen.

---

## Risks Of Wrong Choice

* Error page uses app layout: Layout breaks → 500 page doesn't render → white screen
* Error page queries database: Database down → 500 page doesn't render → white screen
* No failsafe for API: API clients get HTML when they expect JSON — breaks integrations
* Failsafe with complex components: Components have their own dependencies — risk of cascading failure

---

## Related Rules

* Failsafe Error Page
* Production Error Response

---

## Related Skills

* Implement Custom HTTP Error Pages
* Graceful Error Recovery

---

---

## Decision 3: Health Check Endpoint vs Log Monitoring for Detection

---

## Decision Context

Whether to detect production errors proactively via health check endpoints or reactively via log monitoring.

---

## Decision Criteria

* Whether the application has infrastructure-level health checks (load balancer, Kubernetes, availability zone routing)
* Whether the application has a monitoring and alerting system (PagerDuty, OpsGenie, DataDog)
* Whether the team is on-call for production incidents
* Whether the failure mode is detectable via a synthetic request vs log analysis

---

## Decision Tree

Does the infrastructure require a health check endpoint for routing (load balancer, K8s, auto-scaling)?
↓
YES → Implement `/health` and `/health/db` endpoints — required for infrastructure health checks
NO → Is the team on-call for production incidents?
    YES → Does the team need real-time alerting for specific error patterns?
        YES → Implement log monitoring with alerting rules — ERROR-level exceptions trigger alerts
        NO → Implement health check endpoint with passive monitoring — review in daily standup
    NO → Is the failure detectable by a synthetic request (ping a known URL, check response status)?
        ↓
        YES → Implement a health check endpoint — `/health` returns 200, `/health/db` verifies database
        NO → Use log monitoring — health checks can't detect all failure modes (wrong data, partial outage)

---

## Rationale

Health checks are for infrastructure routing and quick synthetic verification. Log monitoring is for detecting errors that health checks can't surface — wrong business logic, partial failures, silent data corruption. Most production apps need both.

---

## Recommended Default

**Default:** Implement `/health` (app responds) and `/health/db` (database connected) endpoints. Also monitor ERROR-level logs with alerting for on-call teams.
**Reason:** Health checks handle infrastructure routing. Log monitoring catches everything else. Together they provide comprehensive coverage.

---

## Risks Of Wrong Choice

* Only health checks: Silent data corruption, partial failures, and business logic errors go undetected
* Only log monitoring: Load balancer doesn't know which nodes are healthy — routes traffic to failing nodes
* No health check for DB: App responds 200 but database is disconnected — load balancer keeps routing traffic
* No health check auth: External attackers, bots, and scanners hit `/health` — public endpoint

---

## Related Rules

* Health Check Endpoint Implementation
* Production Error Monitoring

---

## Related Skills

* Health Check Implementation
* Production Error Monitoring Configuration
