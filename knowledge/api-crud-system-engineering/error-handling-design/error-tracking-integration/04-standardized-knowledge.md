# Error Tracking Integration

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-error-handling-design-error-tracking-integration |
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Skill Level | Expert |
| Classification | Integration Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

Integration with error tracking services (Sentry, Flare, Bugsnag) ensures that every exception — whether operational or unexpected — is captured, grouped, and enriched with context for effective triage. The integration is configured once in the handler and automatically applies to all exceptions, with environment-specific behaviour for volume control.

## Core Concepts

- **Automatic Capture**: All exceptions flow to the tracking service unless explicitly ignored.
- **Context Enrichment**: Each error event is tagged with user ID, request ID, environment, error code, and domain.
- **Error Grouping**: Errors are grouped by exception class and error code, not by message.
- **Release Tracking**: Each deploy tags errors with the release version/git SHA for regression detection.
- **Volume Control**: Operational errors (401, 403, 422) are sampled or excluded to avoid budget waste.

## When To Use

- For any production API serving external consumers
- When on-call teams need real-time error alerting
- When deploying frequently and need regression detection
- For APIs with multiple services or microservices
- When compliance requires error audit trails

## When NOT To Use

- For local development environments
- For trivial applications with no external users
- When error tracking budget/cost cannot be justified
- For air-gapped systems with no external service access

## Best Practices (WHY)

- **Filter high-volume expected exceptions**: Validation and auth errors are expected — exclude or sample (10%).
- **Tag with error code**: Enables dashboard filtering by error type across all exceptions.
- **Set release version**: Tags each deploy — identifies which release introduced a regression.
- **Attach user ID (not PII)**: Identifies impacted users without violating privacy.
- **Use async sending**: Queue the tracking request so it never blocks the response.
- **Monitor tracking budget**: Set event rate limits and daily budgets to control cost.
- **Review resolved issues regularly**: Prevent alert fatigue from stale issues.
- **Update SDK with Laravel upgrades**: Outdated SDKs cause silent tracking failures.

## Architecture Guidelines

- Register error tracking in `Handler::register()` via `reportable()` callbacks.
- Enrich scope with error code, domain, user ID, request ID, and trace ID.
- Filter expected exceptions (Authentication, Validation) from tracking to reduce noise.
- Set release version from `APP_VERSION` or git SHA at deploy time.
- Move event sending to a queued job to avoid blocking the response.
- Configure Sentry "Inbound Filters" to ignore known noisy exceptions.
- Set up Sentry alerts: P1 on new error types, P2 on error count spike.

## Performance Considerations

- Context enrichment adds < 0.1ms per exception.
- Async sending (queue) moves HTTP call overhead off the request thread.
- Breadcrumb collection adds slight overhead per DB/HTTP call — sample in high-throughput endpoints.
- Sentry SDK is lazy-loaded — no memory impact until an exception occurs.
- Queue failures (Sentry down) should not impact application availability.

## Security Considerations

- Never send PII (email, name, IP) in user context — user ID only.
- Configure Sentry data scrubbing for server-side redaction.
- Ensure error tracking data retention complies with GDPR/CCPA.
- Review context sent to third-party tracking — it may include sensitive data.
- Do not send raw request bodies or session data to tracking services.
- Audit tracking payloads regularly for accidental PII inclusion.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Tracking all 401/403 errors | Dashboard flooded with expected auth traffic | No filtering | Noise obscures real issues; budget waste | Sample or exclude operational errors |
| Including PII in user context | Email, full name, IP in Sentry events | Convenience for developer context | GDPR violation; data processing breach | Send only user ID |
| No release tag | Can't tell which deploy broke things | Missing configuration | Regression goes unnoticed | Set release from APP_VERSION or git SHA |
| Excessive breadcrumbs | Event size and cost balloon | No breadcrumb limit | Higher tracking costs; slower ingest | Limit breadcrumbs per event (10-20 max) |
| Sentry registered after handler modifies exception | Context lost | Wrong registration order | Missing enrichment data | Register Sentry first in handler |
| Synchronous sending | Response blocked by tracking HTTP call | Not using queue | Higher response latency | Always queue tracking calls |

## Anti-Patterns

- **Failing open when Sentry is down**: Application should work without error tracking.
- **PII in tags**: Tags are indexed and searchable — PII in tags is a data leak.
- **Same grouping key for all errors**: All errors grouped under one issue.
- **Over-filtering**: Excluding too many errors hides real issues in noise.
- **No error budget**: Unlimited tracking leads to cost surprises.

## Examples

```php
public function register(): void
{
    $this->reportable(function (Throwable $e) {
        if ($this->shouldReportToSentry($e)) {
            \Sentry\configureScope(function (Scope $scope) use ($e): void {
                $scope->setTag('error_code', $this->resolveCode($e));
                $scope->setTag('domain', $this->resolveDomain($e));
                $scope->setUser(['id' => request()->user()?->id]);
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

## Related Topics

- Global Exception Handler Config (where integration hooks in)
- Sensitive Data Leak Prevention (context must be sanitised before sending)
- Error Logging Context (structured logging complements tracking)
- Production vs Dev Error Detail (environment-specific tracking behaviour)
- CI/CD release tagging

## AI Agent Notes

- Filter operational exceptions (401, 403, 422) from tracking unless they indicate abuse.
- Never include PII in tags, user context, or extra data sent to tracking.
- Always set release version for deploy tracking.
- Use queue for async event sending.
- When configuring a new tracking service, ensure it respects the same filtering and data minimisation rules.

## Verification

- [ ] Error tracking is registered via `reportable()` callback in the handler
- [ ] Operational exceptions (401, 403, 422) are filtered/sampled
- [ ] Event scope is enriched with error_code, domain, user_id (not PII), trace_id
- [ ] Release version is set from APP_VERSION or git SHA
- [ ] Event sending is queued (async)
- [ ] Sentry data scrubbing is configured for server-side redaction
- [ ] Integration tests verify tracking is called for programmer errors but not for operational errors
