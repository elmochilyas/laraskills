# Rules for Exception Logging Strategies

---

## Rule: Map Log Levels to Exception Severity

---

## Category

Maintainability

---

## Rule

Always assign log levels per exception type using the `$levels` property. Use ERROR for system/infrastructure failures, WARNING for domain violations, INFO for expected handled exceptions.

---

## Reason

Log levels drive alerting. ERROR should mean "a human needs to look at this now." WARNING means "notable but not urgent." INFO means "normal operations." Misleveling causes alert fatigue or missed incidents.

---

## Bad Example

```php
// No log level mapping — all exceptions at default ERROR level
// Validation errors and 404s trigger alerts alongside database failures
```

---

## Good Example

```php
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

Applications under security audit may log 404s at WARNING for scan detection.

---

## Consequences Of Violation

All exceptions at ERROR causes alert fatigue — ops ignores all alerts. All at INFO causes system failures to go unnoticed.

---

## Rule: Use Daily Log Driver in Production

---

## Category

Reliability

---

## Rule

Always use the `daily` log driver in production. Never use `single` without rotation.

---

## Reason

Single log files in production grow to gigabytes over time, filling disks and crashing the application. Daily rotation keeps files manageable with configurable retention.

---

## Bad Example

```php
// config/logging.php
'default' => env('LOG_CHANNEL', 'single'),
```

---

## Good Example

```php
'default' => env('LOG_CHANNEL', 'daily'),
'channels' => [
    'daily' => [
        'driver' => 'daily',
        'path' => storage_path('logs/laravel.log'),
        'level' => env('LOG_LEVEL', 'warning'),
        'days' => 30,
    ],
];
```

---

## Exceptions

Development environments may use `single` for simplicity.

---

## Consequences Of Violation

Disk fills up, application crashes. Logs older than needed are never cleaned.

---

## Rule: Never Log Sensitive Data

---

## Category

Security

---

## Rule

Never log passwords, tokens, credit card numbers, full personal data, or any PII in exception contexts or log entries.

---

## Reason

Logs are often stored with less security than databases. A log breach exposes sensitive data. GDPR/CCPA violations carry significant penalties.

---

## Bad Example

```php
Log::error('Payment failed', [
    'credit_card' => $request->credit_card, // Full credit card number
    'cvv' => $request->cvv,
    'email' => $user->email,
]);
```

---

## Good Example

```php
Log::error('Payment failed', [
    'payment_method' => 'pm_xxxx', // Last four digits only
    'failure_code' => $exception->getFailureCode(),
    'user_id' => $user->id,
]);
```

---

## Exceptions

No exceptions — sensitive data must never appear in logs under any circumstance.

---

## Consequences Of Violation

GDPR/CCPA violation, mandatory breach notification, legal liability, reputational damage.

---

## Rule: Use Structured Logging for Production

---

## Category

Maintainability

---

## Rule

Always use structured logging (JSON format) in production. Never rely on plain-text log messages for production debugging.

---

## Reason

Structured logs enable log aggregation tools (ELK, Datadog, Papertrail) to parse, search, and visualize errors. Plain-text logs require grep and manual correlation, which doesn't scale.

---

## Bad Example

```php
Log::error("Payment failed for user {$user->id} on order {$order->id}");
```

---

## Good Example

```php
Log::error('Payment failed', [
    'user_id' => $user->id,
    'order_id' => $order->id,
    'amount' => $order->total,
    'payment_provider' => 'stripe',
]);
```

---

## Exceptions

Local development may use plain-text for readability.

---

## Consequences Of Violation

Log aggregation tools can't parse entries. Debugging requires manual log file inspection.

---

## Rule: Set Appropriate Log Level Per Environment

---

## Category

Framework Usage

---

## Rule

Always set LOG_LEVEL per environment: `debug` in local, `warning` in production, `info` in staging.

---

## Reason

debug in production logs every SQL query, HTTP request, and DEBUG message — massive volume and cost. warning in production ensures only actionable errors are logged.

---

## Bad Example

```php
// .env.production
LOG_LEVEL=debug
```

---

## Good Example

```php
// .env
LOG_LEVEL=debug

// .env.production
LOG_LEVEL=warning
```

---

## Exceptions

Temporary debug logging for incident investigation may require lower levels.

---

## Consequences Of Violation

debug in production: massive log volume, high storage cost, real errors buried in noise.
