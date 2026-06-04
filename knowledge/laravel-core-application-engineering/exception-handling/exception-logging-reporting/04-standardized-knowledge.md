# Error Tracking Integration

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Error Tracking Integration
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

## Overview

Exception logging and reporting captures error details for debugging, monitoring, and alerting. Laravel integrates with Monolog for file-based logging, and with services like Sentry, Flare, and Bugsnag for error tracking. The engineering value is visibility into production errors — knowing what failed, when, for whom, and with what context.

The engineering value is actionable error intelligence. Without proper logging, production errors are invisible. With structured logging and error tracking, every exception becomes a data point for debugging, trending, and alerting.

## Core Concepts

- **Log Channels:** Laravel supports `single` (file), `daily` (rotation), `slack` (Slack webhook), `syslog`, `errorlog`, `papertrail`, `stack` (multiple channels), and custom channels.
- **Log Levels:** RFC 5424 syslog protocol levels: DEBUG, INFO, NOTICE, WARNING, ERROR, CRITICAL, ALERT, EMERGENCY. Use appropriate levels to avoid log noise.
- **Error Tracker Integration:** Services like Sentry, Flare, and Bugsnag capture exceptions with full context (user, request, breadcrumbs) and provide alerting, trending, and debugging tools.
- **Context Enrichment:** The `context()` method on the Handler adds global data (user ID, URL, IP, request ID) to all exception reports. Structured logging (JSON format) enables log aggregation.

## When To Use

- File logging for development and simple deployments
- Daily log rotation for production to prevent giant log files
- External error tracking (Sentry, Flare, Bugsnag) for production monitoring
- Stack channels to send to both file and error tracker
- Dedicated log channels for domain-specific errors (billing, audit)

## When NOT To Use

- Do NOT log sensitive data (passwords, tokens, credit cards, PII)
- Do NOT log expected exceptions (validation errors, 404s) at ERROR level — use INFO
- Do NOT use `single` driver in production without rotation — files grow to gigabytes
- Do NOT silently catch exceptions without logging — errors become invisible

## Best Practices (WHY)

- **Why use daily log rotation:** Single log files in production grow to gigabytes over time, filling disks and crashing the application. Daily rotation keeps files manageable.
- **Why integrate error tracking early:** Setting up Sentry/Flare on day one captures errors from the first production deployment. Adding it later means missing months of error data.
- **Why structured logging:** JSON-formatted logs enable log aggregation tools (ELK, Datadog, Papertrail) to parse, search, and visualize errors. Grep doesn't scale.
- **Why use appropriate log levels:** Too many ERRORs drown out real emergencies. Too few and you miss problems. Validation errors and 404s are INFO, not ERROR.

## Architecture Guidelines

- Use `daily` driver for production (never `single`)
- Configure log level per environment: `debug` in local, `warning` in production
- Integrate external error tracker (Sentry/Flare/Bugsnag) on day one
- Add global context via `context()` method on the Handler
- Use dedicated log channels for domain-specific errors (billing, audit)
- Configure alerts for critical exceptions (PagerDuty, Opsgenie, Slack)

## Performance

File logging: ~1-5ms per entry. External service (Sentry): ~50-200ms (network call). Use async logging for non-critical entries to avoid blocking the request. Log aggregation tools can buffer and batch entries to reduce overhead.

## Security

- Never log passwords, tokens, credit cards, or other PII
- Configure data scrubbing in error trackers to redact sensitive fields
- Use structured logging with JSON formatter to control exactly what data is captured
- Review logged context fields regularly for accidental PII inclusion
- Ensure log files are not publicly accessible

## Common Mistakes

1. **Logging Sensitive Data:** Logging credit card numbers, passwords, or full personal data in error contexts. Use last-four digits or tokens instead.

2. **Silent Catch Without Logging:** `catch (Throwable $e) {}` — the error is invisible. Always log or re-throw unless the catch is intentional recovery.

3. **Over-Logging Expected Errors:** Logging INFO for every 404 and validation error fills logs with noise. Real errors get buried.

4. **Disk Full from Logs:** Single log channel without rotation fills the disk and crashes the application. Always use `daily` driver in production.

## Anti-Patterns

- **The Silent Swallow:** `catch (Exception $e) {}` with no logging, no reporting, no recovery. The error is invisible — no debugging possible until users report issues.
- **The Log Firehose:** Logging every request, every query, every 404 at ERROR level. Logs are 95% noise, making it impossible to find real failures.
- **The PII Leak:** Logging full user data (email, phone, address) in exception context. GDPR/CCPA violation risk. Log only what's needed for debugging.
- **The Single File Production Log:** Using `single` driver in production without rotation. File grows to gigabytes, slows down the server, and eventually fills the disk.

## Examples

### Log Channel Configuration
```php
// config/logging.php
return [
    'default' => env('LOG_CHANNEL', 'stack'),
    'channels' => [
        'stack' => ['driver' => 'stack', 'channels' => ['daily', 'slack']],
        'daily' => ['driver' => 'daily', 'path' => storage_path('logs/laravel.log'), 'level' => env('LOG_LEVEL', 'debug'), 'days' => 30],
        'billing' => ['driver' => 'daily', 'path' => storage_path('logs/billing.log'), 'level' => 'info'],
        'slack' => ['driver' => 'slack', 'url' => env('LOG_SLACK_WEBHOOK_URL'), 'level' => 'critical'],
    ],
];
```

### Sentry Integration
```php
// config/sentry.php
return [
    'dsn' => env('SENTRY_LARAVEL_DSN'),
    'breadcrumbs' => ['sql_queries' => true, 'sql_bindings' => true, 'queue_info' => true],
];

// Handler
$exceptions->reportable(function (Throwable $e) {
    if (app()->environment('production')) {
        \Sentry\captureException($e);
    }
});
```

### Suppressing Expected Exceptions
```php
protected $dontReport = [
    ValidationException::class,
    AuthenticationException::class,
    AuthorizationException::class,
    NotFoundHttpException::class,
    ThrottleRequestsException::class,
];
```

### Context Enrichment
```php
protected function context(): array
{
    return [
        'user_id' => auth()->id(),
        'url' => request()?->fullUrl(),
        'method' => request()?->method(),
        'ip' => request()?->ip(),
        'request_id' => request()?->header('X-Request-Id'),
    ];
}
```

## Related Topics

- **Exception Handler Configuration** — how reporting integrates with the handler
- **Production vs Debug Display** — customizing reportable callbacks
- **Custom Exceptions** — exception context for logging
- **HTTP Exception Rendering** — which HTTP errors to report

## AI Agent Notes

- Use `daily` driver for production log files
- Integrate an external error tracker (Sentry/Flare/Bugsnag) on day one
- Configure `dontReport` for expected exceptions
- Add global context via `context()` method on the Handler
- Use appropriate log levels per environment: `debug` local, `warning` production
- Never log sensitive data (passwords, tokens, PII)
- Set up alerts for critical exception types

## Verification

- [ ] `daily` log driver is used in production (not `single`)
- [ ] External error tracker is configured for production
- [ ] `dontReport` filters expected exceptions (validation, 404, auth)
- [ ] Global context is added via `context()` method
- [ ] Log levels are appropriate per environment
- [ ] No sensitive data is logged in exception contexts
- [ ] Alerts are configured for critical exception types
- [ ] Log files are not publicly accessible
