# Error Tracking Integration

## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Error Handling Design  
**Last Updated:** 2026-06-02

## Executive Summary
Integration with error tracking services (Sentry, Flare, Bugsnag) ensures that every exception — whether operational or unexpected — is captured, grouped, and enriched with context for effective triage. The integration is configured once in the handler and automatically applies to all exceptions, with environment-specific behaviour for volume control.

## Core Concepts
- **Automatic Capture**: All exceptions flow to the tracking service unless explicitly ignored.
- **Context Enrichment**: Each error event is tagged with user ID, request ID, environment, error code, and domain.
- **Error Grouping**: Errors are grouped by exception class and error code, not by message — prevents duplicate groups for the same issue.
- **Release Tracking**: Each deploy tags errors with the release version/git SHA for regression detection.
- **Volume Control**: Operational errors (401, 403, 422) are sampled or excluded to avoid budget waste.

## Mental Models
Error tracking is a flight recorder. Every exception is a flight event logged with telemetry (context) and a timestamp. The recorder doesn't judge — it just records. Engineers review the black box after a "crash" (500 spike) to find root cause.

## Internal Mechanics
1. Laravel's exception handler calls `$this->report()` for every exception.
2. The Sentry/Flare SDK's `reportable()` callback is already registered in `register()`.
3. Context is enriched via `Handler::context()`.
4. Ignored exceptions are filtered before sending.
5. Events are sent asynchronously (queue job) to avoid blocking the response.

```php
public function register(): void
{
    $this->reportable(function (Throwable $e) {
        if ($this->shouldReportToSentry($e)) {
            \Sentry\configureScope(function (Scope $scope) use ($e): void {
                $scope->setTag('error_code', $this->resolveCode($e));
                $scope->setTag('domain', $this->resolveDomain($e));
                $scope->setUser(['id' => request()->user()?->id]);
                $scope->setExtra('request_id', request()->header('X-Request-ID'));
                $scope->setExtra('trace_id', $this->getTraceId());
            });
        }
    });
}

protected function shouldReportToSentry(Throwable $e): bool
{
    return app()->isProduction()
        && ! $e instanceof AuthenticationException
        && ! $e instanceof ValidationException;
}
```

## Patterns
- **Conditional Reporting**: Filter high-volume expected exceptions (validation, auth) from tracking to reduce noise and cost.
- **Error Code Tagging**: Always tag events with the resolved error code for dashboard filtering.
- **Release Version**: Set `release` via config from `APP_VERSION` or git SHA at deploy time.
- **User Context**: Attach user ID (not PII) for identifying impacted users.
- **Breadcrumbs**: Log significant request events (DB queries, HTTP calls) as breadcrumbs before the error.

## Architectural Decisions
| Decision | Choice | Rationale |
|---|---|---|
| Tracking service | Sentry (primary) | Industry standard, Laravel integration, breadcrumbs |
| Operational error reporting | Sampled (10%) | Retain signal without noise |
| User context | User ID only (no email, name) | PII minimisation in third-party systems |
| Async sending | Queued job | Never block the response for tracking |

## Tradeoffs
| Tradeoff | Option A | Option B | Chosen |
|---|---|---|---|
| Track all errors | Yes (expensive) | No (ignore operational) | Sampled — reduce cost while maintaining signal |
| User context | Full user object | User ID only | User ID only — PII safety |
| Grouping key | Error code | Exception class + message | Code + class — best balance of grouping and detail |

## Performance Considerations
- Context enrichment adds < 0.1ms per exception.
- Async sending (queue) moves HTTP call overhead off the request thread.
- Breadcrumb collection adds slight overhead per DB/HTTP call — sample breadcrumbs in high-throughput endpoints.
- Sentry SDK is lazy-loaded — no memory impact until an exception occurs.

## Production Considerations
- Set up Sentry alerts: P1 on new error types, P2 on error count spike.
- Configure Sentry "Inbound Filters" to ignore known noisy exceptions.
- Set a daily error budget (e.g., 1000 events/hour) and alert when exceeded.
- Use Sentry Releases to track which deploy introduced a new error.
- Regularly review and archive resolved issues.
- SDK version must be updated with Laravel upgrades.

## Common Mistakes
- Sending all 401/403 errors to Sentry — floods the dashboard with expected auth traffic.
- Including PII in user context (email, full name, IP in user context violates data processing agreements).
- Not setting the release tag — can't tell which deploy broke things.
- Ignoring breadcrumb limits — excessive breadcrumbs increase event size and cost.
- Registering Sentry after the handler modifies the exception (context lost).

## Failure Modes
- **SDK Outage**: Sentry is down; events are queued locally and dropped if queue fills. Mitigation: set a queue timeout; log locally as fallback.
- **Cost Explosion**: A bug causes 10,000 errors/minute, each reported to Sentry. Mitigation: set event rate limits in Sentry dashboard.
- **Context Leak**: User context in Sentry contains PII due to misconfiguration. Mitigation: audit context regularly; use PII scrubbing in Sentry settings.
- **Duplicate Events**: Both Sentry SDK and a manual `Log::error()` capture the same exception. Mitigation: let Sentry handle it; remove manual Log calls for tracked exceptions.

## Ecosystem Usage
- **Sentry**: `sentry-laravel` package with `Sentry\Laravel\Integration`.
- **Flare**: Laravel Ignition integration (default dev error page; production tracking).
- **Bugsnag**: `bugsnag-laravel` package with similar integration pattern.
- **Logtail / BetterStack**: Log-based error tracking (no SDK — uses structured logging).
- **Laravel Pulse**: Built-in monitoring (Laravel 11+) — complements, does not replace Sentry.

## Related Knowledge Units
### Prerequisites
- KU-14 Global Exception Handler Config (where integration hooks in)
- KU-16 Sensitive Data Leak Prevention (context must be sanitised before sending)

### Related Topics
- KU-18 Error Logging Context (structured logging complements tracking)
- CI/CD release tagging

### Advanced Follow-up Topics
- Custom error tracking dashboard with aggregation by error code (Phase 4).
- Self-hosted error tracking (GlitchTip, Sentry self-hosted) for compliance.

## Research Notes
### Source Analysis
Sentry documentation and Laravel ecosystem conventions form the basis. The sampled reporting for operational errors is derived from Twilio's approach of "expected errors don't page anyone."

### Key Insight
**Error tracking is most valuable for unexpected errors.** If you already know about an error (operational, expected), tracking it adds noise. Invest the error tracking budget (both money and attention) on programmer and infrastructure errors.

### Version-Specific Notes
- Sentry SDK v3.x for Laravel 10+ uses `sentry-laravel` package with auto-instrumentation.
- Laravel 11+ Horizon and Pulse integrate natively for queue and request monitoring.
- Flare is bundled with Laravel Ignition (default in Laravel 9+).
