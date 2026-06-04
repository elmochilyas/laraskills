# Exception Logging & Reporting

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Exception Logging & Reporting
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Exception logging and reporting captures error details for debugging, monitoring, and alerting. Laravel integrates with Monolog for file-based logging, and with services like Sentry, Flare, and Bugsnag for error tracking. The engineering value is visibility into production errors — knowing what failed, when, for whom, and with what context.

The engineering value is actionable error intelligence. Without proper logging, production errors are invisible. With structured logging and error tracking, every exception becomes a data point for debugging, trending, and alerting.

---

## Core Concepts

### Default Logging

```php
// config/logging.php
return [
    'default' => env('LOG_CHANNEL', 'stack'),
    'channels' => [
        'stack' => [
            'driver' => 'stack',
            'channels' => ['single', 'flare'],
        ],
        'single' => [
            'driver' => 'single',
            'path' => storage_path('logs/laravel.log'),
            'level' => env('LOG_LEVEL', 'debug'),
        ],
    ],
];
```

### Log Channels

| Channel | Driver | When to Use |
|---|---|---|
| `single` | Single file | Development, simple deployments |
| `daily` | Daily rotation | Production (avoids giant log files) |
| `slack` | Slack webhook | Critical error alerts |
| `syslog` | System log | Centralized logging infrastructure |
| `errorlog` | PHP error log | Shared hosting, no file access |
| `papertrail` | Papertrail | Cloud log aggregation |
| `stack` | Multiple channels | Send to file + error tracker |
| `flare` | Flare integration | Laravel-specific error tracking |

### Log Levels

| Level | Usage | Example |
|---|---|---|
| `DEBUG` | Development details | SQL queries, variable dumps |
| `INFO` | Expected events | User registered, payment processed |
| `NOTICE` | Normal but significant | Admin action performed |
| `WARNING` | Unexpected but not error | Deprecated API used, rate limit approaching |
| `ERROR` | Runtime errors | Payment failure, external API error |
| `CRITICAL` | Critical conditions | Database connection lost, disk full |
| `ALERT` | Immediate action needed | Site down, security breach |
| `EMERGENCY` | System is unusable | Application cannot boot |

---

## Mental Models

### The Error Pyramid

```
EMERGENCY  (1%)   — App is down
CRITICAL   (4%)   — Feature-breaking failures
ERROR      (15%)  — Recoverable failures
WARNING    (30%)  — Unexpected but handled
INFO       (50%)  — Normal operations
```

Log at the appropriate level. Too many ERRORs drown out real emergencies. Too few and you miss problems.

### The Structured Log Event

Each log entry is a structured event with: timestamp, level, message, context (user ID, request ID, exception class), and stack trace. Structured logging (JSON format) enables log aggregation tools (ELK, Datadog, Papertrail) to parse, search, and visualize errors.

---

## Internal Mechanics

### Exception Context in Logs

```php
// Handler — adds global context
protected function context(): array
{
    return [
        'user_id' => auth()->id(),
        'url' => request()?->fullUrl(),
        'method' => request()?->method(),
        'ip' => request()?->ip(),
        'user_agent' => request()?->userAgent(),
        'request_id' => request()?->header('X-Request-Id'),
    ];
}
```

### Logging Exceptions

```php
// Manual logging
Log::error('Payment processing failed', [
    'user_id' => $user->id,
    'amount' => $amount,
    'gateway' => 'stripe',
    'error_code' => $result->code,
]);

// Using report() helper
report($e); // Sends to the handler's report() method

// Using Log facade with exception
Log::error('Failed to generate report', ['exception' => $e]);
```

### Error Tracker Integration (Sentry)

```php
// config/sentry.php
return [
    'dsn' => env('SENTRY_LARAVEL_DSN'),
    'breadcrumbs' => [
        'sql_queries' => true,
        'sql_bindings' => true,
        'queue_info' => true,
        'command_info' => true,
        'http_client_requests' => true,
    ],
];
```

```php
// Handler — send to Sentry only in production
$this->reportable(function (Throwable $e) {
    if (app()->environment('production')) {
        \Sentry\captureException($e);
    }
});
```

---

## Patterns

### Logging Context Per Channel

```php
// config/logging.php
'channels' => [
    'billing' => [
        'driver' => 'daily',
        'path' => storage_path('logs/billing.log'),
        'level' => 'info',
    ],
    'audit' => [
        'driver' => 'daily',
        'path' => storage_path('logs/audit.log'),
        'level' => 'info',
    ],
],
```

```php
Log::channel('billing')->error('Payment failed', $context);
Log::channel('audit')->info('User deleted', $context);
```

### Conditional Reporting

```php
// Handler
$this->reportable(function (PaymentFailedException $e) {
    // Always report payment failures
    Log::channel('billing')->error($e->getMessage(), $e->context());
});

$this->reportable(function (NotFoundHttpException $e) {
    // Only report 404s in production, not during crawling
    if (app()->environment('production') && !request()->is('api/*')) {
        Log::channel('analytics')->warning('404', [
            'url' => request()->fullUrl(),
            'referer' => request()->header('referer'),
        ]);
    }
});
```

### Logging to Multiple Channels

```php
// Stack channel sends to multiple destinations
'stack' => [
    'driver' => 'stack',
    'channels' => ['daily', 'slack'],
],

// Custom stack for critical errors
'critical_stack' => [
    'driver' => 'stack',
    'channels' => ['daily', 'slack', 'sentry'],
],
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

---

## Architectural Decisions

### File Logging vs External Service

| Concern | File Logging | External Service (Sentry) |
|---|---|---|
| Setup | Built-in | Requires API key + package |
| Cost | Free | Paid (usage-based) |
| Search | `grep` or log aggregator | Web UI, filtering, graphs |
| Alerting | Manual (log watcher) | Built-in (email, Slack, PagerDuty) |
| Retention | Disk space limited | Configurable (30-90 days) |
| Sensitive data | In log files, risk of leak | Scrubbing available |

Use file logging + external service in production. File logs are the fallback; the external service provides the UI, search, and alerting.

### Log Level Strategy

| Environment | Level | Rationale |
|---|---|---|
| Local | `debug` | Maximum visibility during development |
| Staging | `debug` | Catch issues before production |
| Production | `warning` | Only meaningful events (reduce noise) |
| Production (error tracking) | `error` | Sentry/Flare should capture errors |

---

## Tradeoffs

| Concern | Detailed Logging | Minimal Logging |
|---|---|---|
| Debugging | Fast (rich context) | Slow (must reproduce) |
| Cost | Higher storage/bandwidth | Lower |
| Noise | More false positives | Clean signal |
| Security | More data in logs (PII risk) | Less exposure |

---

## Performance Considerations

Logging adds I/O cost per entry. File logging: ~1-5ms per entry. External service: ~50-200ms (network call). Use async logging (queue) for non-critical log entries:

```php
// config/logging.php
'slack' => [
    'driver' => 'slack',
    'url' => env('LOG_SLACK_WEBHOOK_URL'),
    'level' => 'critical',
],
```

Log aggregation tools (Papertrail, Logstash) can buffer and batch log entries to reduce overhead.

---

## Production Considerations

- Use daily log rotation in production (`driver => 'daily'`) — single files grow to gigabytes
- Set appropriate log levels: `warning` in production, `debug` in development
- Never log passwords, tokens, credit cards, or other PII
- Use structured logging (JSON formatter) for machine-parseable logs
- Integrate an error tracker (Sentry, Flare, Bugsnag) on day one
- Set up alerts for critical exceptions (PagerDuty, Opsgenie, Slack)
- Log queue job failures with full context (job ID, payload, exception)
- Periodically review logs: prune noise, fix recurring errors, tune levels
- Use `Log::share()` (Laravel 11+) to add global context to all log entries

---

## Common Mistakes

### Logging Sensitive Data

```php
// Bad — credit card logged
Log::error('Payment failed', ['card_number' => $request->card_number]);

// Good — only relevant metadata
Log::error('Payment failed', [
    'last_four' => substr($request->card_number, -4),
    'error_code' => $result->code,
]);
```

### Silent Catch Without Logging

```php
// Bad — error invisible
try {
    $this->riskyOperation();
} catch (Throwable $e) {
    // Forgotten to log
}

// Good
try {
    $this->riskyOperation();
} catch (Throwable $e) {
    Log::error('Risky operation failed', ['exception' => $e]);
    throw $e; // Or recover
}
```

### Over-Logging Expected Errors

Logging `INFO` for every 404 and validation error fills logs with noise. Real errors get buried. Only log at `ERROR` for actual application errors.

---

## Failure Modes

### Disk Full from Logs

Single log channel without rotation. Log file grows to 100GB, fills the disk, application crashes. Mitigate: always use `daily` driver in production, monitor disk usage.

### Logging Service Throttling

Sentry/Flare rate-limits your account. Exceptions stop being reported without warning. Mitigate: monitor error tracker's rate limit headers, have file logging as fallback.

### PII Leak in Log Aggregation

Logs sent to a third-party service contain user emails, IPs, or other PII. GDPR/CCPA violation risk. Mitigate: configure data scrubbing in the error tracker, review logged context fields regularly.

---

## Ecosystem Usage

### Sentry

sentry-laravel package integrates with Laravel's handler to automatically capture exceptions, breadcrumbs, and context. Provides alerting, release tracking, and performance monitoring.

### Flare

Flare provides Laravel-specific error tracking with context-aware error pages, solutions, and automatic exception grouping.

### Bugsnag

bugsnag-laravel package captures exceptions with full request context and supports custom metadata, user tracking, and release reporting.

### Log Aggregation (ELK / Datadog / Papertrail)

Structured JSON logging integrates with log aggregation platforms for centralized search, alerting, and visualization of application errors.

---

## Related Knowledge Units

- **Exception Fundamentals** (this workspace) — how reporting integrates with the handler
- **Global Exception Handling** (this workspace) — customizing reportable callbacks
- **Custom Exception Classes** (this workspace) — exception context for logging
- **HTTP Exceptions** (this workspace) — which HTTP errors to report
- **Exception Testing** (this workspace) — testing that exceptions are logged correctly

---

## Research Notes

- Laravel uses Monolog under the hood — all Monolog handlers are compatible
- `Log::share()` (Laravel 11+) adds context to all subsequent log entries in the request lifecycle
- `report()` helper sends an exception through the handler's `report()` method
- `Log::channel('name')` selects a specific logging channel
- Sentry's Laravel package automatically captures exceptions, breadcrumbs, and context
- Structured logging (JSON formatter) enables ELK/Papertrail/Datadog integration
- Log levels follow RFC 5424 (syslog protocol)
- Queue job failures are logged in `storage/logs/laravel.log` by default
- Log monitoring tools: Papertrail, Logtail, Datadog, Grafana Loki, ELK Stack
- Error tracking tools: Sentry, Flare, Bugsnag, Rollbar, Raygun
- Logs should be retained for at least 30 days in production (regulatory minimum varies)
