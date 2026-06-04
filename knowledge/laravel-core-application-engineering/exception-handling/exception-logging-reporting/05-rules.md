# Rules for Exception Logging and Reporting

---

## Rule: Always Use `daily` Log Driver in Production, Never `single`

---

## Category

Reliability

---

## Rule

Always set the production log channel to `daily`. Never use the `single` driver in production environments.

---

## Reason

A `single` log file grows without bound, eventually filling the disk and crashing the application. `daily` rotates logs automatically, keeping the last N days of data and preventing disk exhaustion.

---

## Bad Example

```php
// config/logging.php
'default' => env('LOG_CHANNEL', 'single'),
```

---

## Good Example

```php
// config/logging.php
'default' => env('LOG_CHANNEL', 'stack'),
'channels' => [
    'daily' => [
        'driver' => 'daily',
        'path' => storage_path('logs/laravel.log'),
        'level' => env('LOG_LEVEL', 'debug'),
        'days' => 30,
    ],
],
```

---

## Exceptions

Development environments may use `single`. Short-lived ephemeral environments (containerized deployments without persistent storage) may stream to stdout instead.

---

## Consequences Of Violation

Reliability risks: disk fills up, application crashes. Maintenance risks: manual log rotation becomes an operational burden.

---

## Rule: Integrate an External Error Tracker on Day One of Every Production-Deployed Application

---

## Category

Maintainability

---

## Rule

Always configure an external error tracking service (Sentry, Flare, Bugsnag) as part of the initial production deployment. Never deploy to production without remote error monitoring.

---

## Reason

File logs require manual inspection to find errors. An error tracker captures exceptions with full context (user, request, breadcrumbs) and provides alerting, trending, and debugging tools. Adding it later means missing months of error history.

---

## Bad Example

```php
// No error tracker — relies solely on file logs
// Production errors go unnoticed until users report them
```

---

## Good Example

```php
// config/sentry.php
return [
    'dsn' => env('SENTRY_LARAVEL_DSN'),
    'breadcrumbs' => [
        'sql_queries' => true,
        'sql_bindings' => true,
        'queue_info' => true,
    ],
];
```

---

## Exceptions

Internal tools with no external users and no SLA may rely on file logs alone. Add an error tracker when any external user depends on the application.

---

## Consequences Of Violation

Reliability risks: errors go undetected until users report them. Maintenance risks: debugging requires manual log access and correlation.

---

## Rule: Never Log Sensitive Data in Exception Contexts

---

## Category

Security

---

## Rule

Never log passwords, tokens, credit card numbers, full personal data, or any PII in exception context or messages.

---

## Reason

Logged sensitive data creates compliance violations (GDPR, PCI-DSS, HIPAA) and security risks if logs are breached. Error trackers may also expose this data to unauthorized team members.

---

## Bad Example

```php
Log::error('Payment failed', [
    'credit_card' => '4111-1111-1111-1111', // Violation
    'cvv' => '123',                        // Violation
    'email' => 'user@example.com',          // PII — log last-four only
]);
```

---

## Good Example

```php
Log::error('Payment failed', [
    'card_last_four' => '1111',
    'failure_reason' => 'insufficient_funds',
    'user_id' => $user->id,
]);
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Security risks: leaked credentials and PII in logs. Compliance risks: GDPR/PCI-DSS fines and penalties. Reputation damage from log breaches.

---

## Rule: Log Expected Exceptions at INFO Level, Not ERROR

---

## Category

Maintainability

---

## Rule

Always log expected exceptions (validation errors, 404s, authentication failures) at INFO or WARNING level. Never use ERROR level for expected application behavior.

---

## Reason

ERROR-level logs trigger alerts and noise in monitoring systems. Expected exceptions are normal application behavior — logging them as ERROR drowns out real failures and desensitizes the team to alerts.

---

## Bad Example

```php
// Validation errors reported as ERROR — fills monitoring dashboards
protected $levels = [
    ValidationException::class => LogLevel::ERROR,
    NotFoundHttpException::class => LogLevel::ERROR,
];
```

---

## Good Example

```php
// Appropriate log levels per exception type
protected $levels = [
    AuthenticationException::class => LogLevel::INFO,
    ValidationException::class => LogLevel::INFO,
    NotFoundHttpException::class => LogLevel::INFO,
    PaymentFailedException::class => LogLevel::ERROR,
    Throwable::class => LogLevel::CRITICAL,
];
```

---

## Exceptions

During active debugging or security incident investigation, you may temporarily raise the level of a specific exception type to get more visibility.

---

## Consequences Of Violation

Maintenance risks: real errors are invisible among noise. Reliability risks: false alerts desensitize the team, causing missed critical failures.

---

## Rule: Add Global Context to Every Exception Report

---

## Category

Maintainability

---

## Rule

Always add `user_id`, `url`, `method`, `ip`, and `request_id` to every exception report via the handler's `context()` method. Never rely on individual reportable callbacks to add context.

---

## Reason

Without global context, each exception report is an isolated snapshot with no connection to the request that caused it. Global context ensures every report has the metadata needed for debugging, without duplicating code across callbacks.

---

## Bad Example

```php
// No context() override — each reportable callback must add context manually
$exceptions->reportable(function (PaymentFailedException $e) {
    Log::channel('billing')->error($e->getMessage(), [
        'user_id' => auth()->id(), // Manually added — easy to forget
    ]);
});
```

---

## Good Example

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

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Maintenance risks: debugging requires manual log correlation across multiple sources. Reliability risks: context-rich debugging is inconsistent across exception types.

---

## Rule: Use Appropriate Log Level per Environment — Debug in Local, Warning in Production

---

## Category

Security

---

## Rule

Always configure the minimum log level per environment: `debug` in local and staging, `warning` in production. Never use `debug` level in production.

---

## Reason

DEBUG-level logs contain SQL queries, request data, and detailed application internals. Exposing these in production creates a security risk and generates enormous log volume that is almost never useful for operations.

---

## Bad Example

```php
// .env.production
LOG_LEVEL=debug // Exposes SQL queries and request data in production logs
```

---

## Good Example

```php
// .env
LOG_LEVEL=debug    // Local development

// .env.production
LOG_LEVEL=warning  // Production — ERROR and above only
```

---

## Exceptions

Temporary increase to `debug` in production during active incident debugging, reverted immediately after.

---

## Consequences Of Violation

Security risks: sensitive request data leaked in production logs. Performance risks: large log volume degrades I/O performance. Maintenance risks: finding real errors among debug noise.

---

## Rule: Use a Stack Channel to Send to Both File and Error Tracker

---

## Category

Architecture

---

## Rule

Always configure a `stack` log channel that sends to both the daily log file and the error tracking service. Never rely on a single channel for all environments.

---

## Reason

A single channel creates a single point of failure for log data. The stack channel ensures logs are written to disk (for long-term retention) and sent to the error tracker (for real-time alerting) simultaneously.

---

## Bad Example

```php
// Single channel — if Sentry is down, errors are not tracked
'default' => env('LOG_CHANNEL', 'sentry'),
```

---

## Good Example

```php
'default' => env('LOG_CHANNEL', 'stack'),
'channels' => [
    'stack' => [
        'driver' => 'stack',
        'channels' => ['daily', 'sentry'],
    ],
    'daily' => [
        'driver' => 'daily',
        'path' => storage_path('logs/laravel.log'),
        'level' => env('LOG_LEVEL', 'debug'),
        'days' => 30,
    ],
],
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Reliability risks: error tracker downtime causes complete loss of error visibility. Maintenance risks: switching channels requires configuration changes.

---

## Rule: Configure Alerts for Critical Exception Types

---

## Category

Reliability

---

## Rule

Always configure alerts for CRITICAL and ERROR level exceptions in production, delivered to the team's incident response channel (PagerDuty, Slack, Opsgenie). Never rely on manual log inspection to detect production errors.

---

## Reason

Without alerts, production errors go undetected until users report them. Alerting on CRITICAL exceptions ensures the team is notified within minutes of a failure, reducing mean time to detection.

---

## Bad Example

```php
// No alerts configured — team discovers errors from user complaints
// "Is the site down?" "Let me check the logs..."
```

---

## Good Example

```php
// config/logging.php — Slack alert for critical errors
'slack' => [
    'driver' => 'slack',
    'url' => env('LOG_SLACK_WEBHOOK_URL'),
    'level' => 'critical',
],

// Stack channel includes slack
'stack' => [
    'driver' => 'stack',
    'channels' => ['daily', 'slack'],
],
```

---

## Exceptions

Internal development applications with no users and no SLA may omit alerting.

---

## Consequences Of Violation

Reliability risks: production errors go undetected for hours or days. Business risks: SLA violations from delayed incident response.

---

## Rule: Use Structured JSON Logging for Production Log Aggregation

---

## Category

Scalability

---

## Rule

Always use structured JSON logging (Monolog `JsonFormatter`) in production environments. Never use plain text line format when log aggregation tools (ELK, Datadog, Papertrail) are in use.

---

## Reason

Plain text logs require regex parsing for aggregation tools — brittle and slow. JSON-formatted logs are parseable by machines without custom parsing rules, enabling search, filtering, and visualization.

---

## Bad Example

```php
// Plain text — requires regex to parse
[2026-06-02 10:00:00] production.ERROR: Payment failed for user 123
```

---

## Good Example

```php
// JSON — aggregation tools parse automatically
{"message":"Payment failed","level":"error","user_id":123,"channel":"billing","datetime":"2026-06-02T10:00:00Z"}
```

---

## Exceptions

Small applications without log aggregation infrastructure may use plain text logs. Switch to JSON when any log aggregation tool is introduced.

---

## Consequences Of Violation

Scalability risks: log aggregation setup requires custom parsing. Maintenance risks: parsing failures cause gaps in log data. Performance risks: regex parsing at scale is CPU-intensive.
