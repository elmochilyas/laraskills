# Anti-Patterns: Error Tracking Integration

## 1. The Silent Swallow

Catching an exception without logging, reporting, or recovery — the error is invisible.

```php
catch (Exception $e) {} // No logging, no reporting, no recovery
```

A silent catch makes debugging impossible. The error is invisible until users report issues. Always log and handle or re-throw. If the catch is intentional recovery, document why the exception is expected and consider logging at INFO level.

## 2. The Log Firehose

Logging every request, every query, every 404, and every validation error at ERROR level.

```php
// All exceptions including expected 404s logged as ERROR
protected $levels = [
    ValidationException::class => LogLevel::ERROR,
    NotFoundHttpException::class => LogLevel::ERROR,
];
```

Logs become 95% noise, making it impossible to find real failures. Use `dontReport` to suppress expected exceptions entirely, or map them to INFO/WARNING levels. Validation errors, 404s, and authentication failures are expected application behavior — they should never be logged as ERROR.

```php
protected $levels = [
    AuthenticationException::class => LogLevel::INFO,
    ValidationException::class => LogLevel::INFO,
    NotFoundHttpException::class => LogLevel::INFO,
    PaymentFailedException::class => LogLevel::ERROR,
    Throwable::class => LogLevel::CRITICAL,
];
```

## 3. The PII Leak

Logging full personal data (passwords, tokens, credit card numbers, email addresses, phone numbers) in exception context.

```php
Log::error('Payment failed', [
    'credit_card' => '4111-1111-1111-1111', // Violation
    'cvv' => '123',                        // Violation
    'email' => 'user@example.com',          // PII
]);
```

Logged sensitive data creates compliance violations (GDPR, PCI-DSS, HIPAA) and security risks if logs are breached. Never log passwords, tokens, credit card numbers, or full personal data in exception context or messages:

```php
Log::error('Payment failed', [
    'card_last_four' => '1111',
    'failure_reason' => 'insufficient_funds',
    'user_id' => $user->id,
]);
```

## 4. The Single File Production Log

Using the `single` log driver in production without rotation.

```php
// config/logging.php
'default' => env('LOG_CHANNEL', 'single'),
```

A single log file grows without bound, eventually filling the disk and crashing the application. Always use the `daily` driver in production, which rotates logs automatically and keeps the last N days of data:

```php
'channels' => [
    'daily' => [
        'driver' => 'daily',
        'path' => storage_path('logs/laravel.log'),
        'level' => env('LOG_LEVEL', 'debug'),
        'days' => 30,
    ],
],
```

## 5. The No-Alert Production Log

Relying solely on file logs for production error detection without integrating an external error tracker or alerting.

```php
// No error tracker — relies solely on file logs
// Production errors go unnoticed until users report them
```

File logs require manual inspection to find errors. Integrate an error tracking service (Sentry, Flare, Bugsnag) on day one of production deployment. Error trackers capture exceptions with full context (user, request, breadcrumbs) and provide alerting, trending, and debugging tools. Configure alerts for CRITICAL and ERROR level exceptions delivered to the team's incident response channel.

## 6. The Debug Level in Production

Setting `LOG_LEVEL=debug` in production, exposing SQL queries, request data, and application internals.

```bash
# .env.production
LOG_LEVEL=debug # Exposes SQL queries and request data in production logs
```

DEBUG-level logs contain SQL queries, request data, and detailed application internals. Exposing these in production creates a security risk and generates enormous log volume. Set log level to `warning` in production — ERROR and above only.

```bash
# .env.production
LOG_LEVEL=warning
```

## 7. The Plain Text Log

Using plain text log format when log aggregation tools (ELK, Datadog, Papertrail) are in use.

```php
// Plain text — requires regex to parse
[2026-06-02 10:00:00] production.ERROR: Payment failed for user 123
```

Plain text logs require regex parsing for aggregation tools — brittle and slow. Use structured JSON logging (Monolog `JsonFormatter`) in production. JSON-formatted logs are parseable by machines without custom parsing rules, enabling search, filtering, and visualization.
