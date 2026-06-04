# Exception Logging Strategies

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Exception Logging Strategies
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

## Overview

Exception logging strategies define how exceptions are recorded, what log level they receive, which channel they're routed to, and what context data accompanies them. Laravel integrates with Monolog for file-based logging and supports structured logging to services like Sentry, Flare, and Bugsnag.

The engineering value is actionable error intelligence. Without proper logging strategy, production errors are invisible or buried in noise. With structured logging and appropriate log levels, every exception becomes a data point for debugging, trending, and alerting.

## Core Concepts

- **Log Levels:** RFC 5424 syslog levels: DEBUG, INFO, NOTICE, WARNING, ERROR, CRITICAL, ALERT, EMERGENCY. Each exception type should map to the appropriate level based on severity.
- **Log Channels:** Laravel supports `single`, `daily`, `slack`, `syslog`, `errorlog`, `papertrail`, `stack` (for multiple simultaneous channels), and custom channels.
- **Structured Logging:** JSON-formatted logs enable log aggregation tools (ELK, Datadog, Papertrail) to parse, search, and visualize errors.
- **Context Enrichment:** The `context()` method on the Handler adds global data (user ID, URL, IP, request ID) to all exception reports.
- **Log Level Mapping:** The `$levels` property on the Handler maps exception classes to specific log levels.

## When To Use

- File logging for development and simple deployments
- Daily log rotation for production to prevent giant log files
- External error tracking (Sentry, Flare, Bugsnag) for production monitoring
- Stack channels to send to both file and error tracker
- Dedicated log channels for domain-specific errors (billing, audit, security)
- Structured logging for log aggregation and analysis

## When NOT To Use

- Do NOT log sensitive data (passwords, tokens, credit cards, PII)
- Do NOT log expected exceptions (validation errors, 404s) at ERROR level — use INFO
- Do NOT use `single` driver in production without rotation — files grow to gigabytes
- Do NOT silently catch exceptions without logging — errors become invisible

## Best Practices

- **Map log levels to severity:** ERROR should mean "a human needs to look now." WARNING means "notable but not urgent." INFO means "normal operations."
- **Use structured logging:** JSON-formatted logs enable aggregation tools to parse, search, and visualize errors at scale.
- **Enrich exception context:** Always include user ID, request ID, URL, and relevant entity IDs in log context for debugging.
- **Route by domain:** Payment errors go to a billing channel, security events to an immutable store, general errors to the default stack.

## Architecture Guidelines

- Use `daily` driver for production (never `single`)
- Configure log level per environment: `debug` in local, `warning` in production
- Integrate external error tracker on day one
- Add global context via `context()` method on the Handler
- Use dedicated log channels for domain-specific errors
- Configure alerts for critical exception types

## Performance Considerations

File logging: ~1-5ms per entry. External service (Sentry): ~50-200ms (network call). Use async logging for non-critical entries. Log aggregation tools can buffer and batch entries to reduce overhead. High-volume exceptions (>100/hour) should minimize context to reduce I/O and storage costs.

## Security Considerations

- Never log passwords, tokens, credit cards, or other PII
- Configure data scrubbing in error trackers to redact sensitive fields
- Use structured logging with JSON formatter to control exactly what is captured
- Review logged context fields regularly for accidental PII inclusion
- Ensure log files are not publicly accessible
- Set LOG_LEVEL to `warning` or higher in production

## Common Mistakes

1. **Logging Sensitive Data:** Logging credit card numbers, passwords, or full personal data in exception contexts. Use last-four digits or tokens instead.

2. **Silent Catch Without Logging:** `catch (Throwable $e) {}` — the error is invisible. Always log or re-throw unless the catch is intentional recovery.

3. **Over-Logging Expected Errors:** Logging INFO for every 404 and validation error fills logs with noise. Real errors get buried.

4. **Wrong Log Level:** Logging system failures at WARNING and validation errors at ERROR. Misleveled logs cause alert fatigue or missed incidents.

5. **Disk Full from Logs:** Single log channel without rotation fills the disk. Always use `daily` driver in production.

## Anti-Patterns

- **The Silent Swallow:** `catch (Exception $e) {}` with no logging, reporting, or recovery.
- **The Log Firehose:** Logging every request, query, and 404 at ERROR level. Logs are 95% noise.
- **The PII Leak:** Logging full user data in exception context. GDPR/CCPA violation risk.
- **The Single File Production Log:** Using `single` driver in production without rotation.

## Examples

### Log Level Mapping
```php
protected $levels = [
    AuthenticationException::class => LogLevel::INFO,
    ValidationException::class => LogLevel::INFO,
    PaymentFailedException::class => LogLevel::ERROR,
    HttpException::class => LogLevel::WARNING,
    Throwable::class => LogLevel::CRITICAL,
];
```

### Domain-Specific Channels
```php
// config/logging.php
'channels' => [
    'billing' => [
        'driver' => 'daily',
        'path' => storage_path('logs/billing.log'),
        'level' => 'info',
        'days' => 90,
    ],
    'security' => [
        'driver' => 'syslog',
        'level' => 'warning',
    ],
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

### Structured Logging
```php
Log::channel('billing')->error('Payment failed', [
    'payment_method' => 'pm_xxxx', // last four only
    'amount' => 50.00,
    'failure_reason' => 'insufficient_funds',
    'user_id' => auth()->id(),
    'order_id' => $order->id,
]);
```

## Related Topics

- **Exception Handler Configuration** — base exception handling
- **Log Channel Configuration** — custom log channels
- **Error Tracking Integration** — Sentry, Flare, Bugsnag
- **Production vs Debug Display** — environment-specific logging

## AI Agent Notes

- Use `daily` driver for production log files
- Configure `dontReport` for expected exceptions
- Map log levels per exception type
- Add global context via `context()` method
- Never log sensitive data
- Use structured JSON logging for log aggregation
- Set up alerts for critical exception types
