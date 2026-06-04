# Skill: Configure Production Logging and Error Tracking

## Purpose

Set up the production logging infrastructure with daily log rotation, structured JSON formatting, external error tracker integration, and alerting for critical exceptions to ensure full visibility into production errors.

## When To Use

- During initial production deployment setup
- When adding error monitoring to an existing production application
- When replacing a `single` log driver with proper rotation
- When integrating an error tracker (Sentry, Flare, Bugsnag) for the first time

## When NOT To Use

- Development-only applications with no production deployment
- Ephemeral containerized environments that stream logs to stdout
- Internal tools with no external users and no SLA

## Prerequisites

- Access to `config/logging.php` and the exception handler (`bootstrap/app.php` or `App\Exceptions\Handler`)
- Error tracker account and DSN (if integrating one)
- Monitoring system (PagerDuty, Slack, Opsgenie) for alerting

## Inputs

- Production environment log level (typically `warning`)
- Error tracker DSN and configuration
- Slack webhook URL or other alert destination
- Days of log retention (typically 30)
- List of channel destinations (file, error tracker, Slack)

## Workflow

1. Configure `config/logging.php` to use `daily` driver for production (never `single`):
   ```php
   'daily' => [
       'driver' => 'daily',
       'path' => storage_path('logs/laravel.log'),
       'level' => env('LOG_LEVEL', 'debug'),
       'days' => 30,
   ],
   ```

2. Set the production log level to `warning` in `.env.production`:
   ```
   LOG_LEVEL=warning
   ```

3. Enable structured JSON logging for log aggregation tools:
   ```php
   'daily' => [
       'driver' => 'daily',
       'path' => storage_path('logs/laravel.log'),
       'level' => env('LOG_LEVEL', 'debug'),
       'days' => 30,
       'tap' => [App\Logging\JsonFormatter::class],
   ],
   ```
   Or configure Monolog's `JsonFormatter` via a custom `tap` class.

4. Create a `stack` channel that sends to both the daily file and the error tracker:
   ```php
   'default' => env('LOG_CHANNEL', 'stack'),
   'stack' => [
       'driver' => 'stack',
       'channels' => ['daily', 'sentry'],
   ],
   ```

5. Integrate an external error tracker by installing its SDK (e.g., `sentry/sentry-laravel`) and configuring the DSN:
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

6. Configure alerts for CRITICAL and ERROR level exceptions in the error tracker, sending notifications to the team's incident response channel (Slack, PagerDuty, Opsgenie).

7. Add a Slack channel for critical errors:
   ```php
   'slack' => [
       'driver' => 'slack',
       'url' => env('LOG_SLACK_WEBHOOK_URL'),
       'level' => 'critical',
   ],
   ```

## Validation Checklist

- [ ] `daily` log driver is configured for production (not `single`)
- [ ] Production `LOG_LEVEL` is set to `warning` (not `debug`)
- [ ] Structured JSON logging is enabled (JsonFormatter)
- [ ] External error tracker is installed and configured with DSN
- [ ] `stack` channel sends to both file and error tracker
- [ ] Alerts are configured for CRITICAL/ERROR exceptions
- [ ] Log files are not publicly accessible (outside `public/`)
- [ ] Log retention is configured (typically 30 days)

## Common Failures

1. **single driver in production**: Log file grows to gigabytes, fills the disk, and crashes the application.

2. **debug level in production**: SQL queries, request data, and application internals are written to production logs — security risk and enormous volume.

3. **No error tracker**: Production errors go undetected until users report them. No breadcrumbs, no request context, no trending.

4. **Single channel dependency**: All logging goes through the error tracker — if the tracker is down, errors are completely invisible.

5. **Plain text logs**: Log aggregation tools require custom regex parsing — brittle and CPU-intensive.

## Decision Points

- **Error tracker choice**: Sentry (mature, broad feature set), Flare (Laravel-native, Ignition integration), Bugsnag (multi-platform, strong stability). Choose based on ecosystem fit.
- **Stack vs single**: Always use `stack` to avoid a single point of failure for log data.
- **Slack level**: Set to `critical` for production alerts to avoid channel noise from ERROR-level spam.

## Performance Considerations

- File logging: ~1–5ms per entry
- External error tracker: ~50–200ms per call (network)
- Stack channel multiplies cost but rarely matters (exceptions are exceptional)
- Consider async logging for non-critical entries

## Security Considerations

- Never log passwords, tokens, credit card numbers, or PII
- Error trackers may expose data to team members — configure data scrubbing to redact sensitive fields
- LOG_LEVEL=warning in production ensures DEBUG-level data (SQL, request details) is not written
- Log files must be outside the public web root
- Review logged context fields regularly for accidental PII inclusion

## Related Rules

- Always Use daily Log Driver in Production, Never single
- Integrate an External Error Tracker on Day One
- Never Log Sensitive Data in Exception Contexts
- Use Appropriate Log Level per Environment — Debug in Local, Warning in Production
- Use a Stack Channel to Send to Both File and Error Tracker
- Configure Alerts for Critical Exception Types
- Use Structured JSON Logging for Production Log Aggregation

## Related Skills

- Set Up Exception Reporting and Logging Configuration (exception-fundamentals)
- Configure Environment-Specific Exception Handling (global-exception-handling)

## Success Criteria

- Production logs are rotated daily and retained for 30 days
- Logs are structured JSON, parseable by aggregation tools
- External error tracker captures all unhandled exceptions with full context
- Alerts notify the team within minutes of CRITICAL exceptions
- No sensitive data appears in log outputs
- A single chokepoint failure does not cause complete log loss

---

# Skill: Set Up Exception Context Enrichment and Suppression

## Purpose

Configure the exception handler to add global context to all exception reports, suppress expected exceptions from ERROR-level logging, and use domain-specific log channels for structured error visibility.

## When To Use

- After basic exception handler is configured
- When adding global context to exception reports for debugging
- When fine-tuning which exceptions are reported at which severity
- When implementing domain-specific logging channels

## When NOT To Use

- Development-only applications where log noise is not a concern
- Applications with a single simple form and no complex error landscape

## Prerequisites

- Exception handler is configured (see "Configure the Exception Handler" skill)
- Understanding of `dontReport`, `$levels`, `context()`, and `reportable()` APIs
- Log channels defined in `config/logging.php`

## Inputs

- List of expected exception types to suppress (validation, 404, auth)
- Global context fields to include (user_id, url, method, ip, request_id)
- Log level mapping per exception type
- Domain-specific channel names

## Workflow

1. Add expected exceptions to `dontReport` to suppress them from ERROR-level logging:
   ```php
   $exceptions->dontReport([
       AuthenticationException::class,
       ValidationException::class,
       AuthorizationException::class,
       NotFoundHttpException::class,
       ThrottleRequestsException::class,
   ]);
   ```

2. Override `context()` on the Handler to add global request metadata:
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

3. Set log levels per exception type to map severity correctly:
   ```php
   protected $levels = [
       AuthenticationException::class => LogLevel::INFO,
       ValidationException::class => LogLevel::INFO,
       NotFoundHttpException::class => LogLevel::INFO,
       ThrottleRequestsException::class => LogLevel::WARNING,
       PaymentFailedException::class => LogLevel::ERROR,
       Throwable::class => LogLevel::CRITICAL,
   ];
   ```

4. Add domain-specific `reportable()` callbacks for custom exception types:
   ```php
   $exceptions->reportable(function (PaymentFailedException $e) {
       Log::channel('billing')->error($e->getMessage(), [
           'payment_method' => $e->paymentMethod,
           'amount' => $e->amount,
           'failure_reason' => $e->failureReason,
       ]);
   });
   ```

5. Add a catch-all `reportable()` for the external error tracker:
   ```php
   $exceptions->reportable(function (Throwable $e) {
       if (app()->environment('production') && !$this->shouldntReport($e)) {
           \Sentry\captureException($e);
       }
   });
   ```

6. Verify that `reportable()` callbacks contain no response-rendering logic.

## Validation Checklist

- [ ] All expected exception types are in `dontReport`
- [ ] Global `context()` includes user_id, url, method, ip, request_id
- [ ] `$levels` maps exception types to appropriate severity
- [ ] Domain-specific `reportable()` callbacks exist for custom exceptions
- [ ] External error tracker has a catch-all `reportable()` callback
- [ ] No sensitive data appears in log context or exception properties
- [ ] Report and render pipelines are fully independent

## Common Failures

1. **Missing context**: No `context()` override — each report lacks request metadata, making debugging impossible.

2. **PII in context**: Including email, phone, or full user data in `context()` — violates GDPR/CCPA.

3. **Wrong log level**: Mapping `Throwable` to INFO hides critical server errors. Unknown exceptions must be CRITICAL.

4. **Coupled pipelines**: A `reportable()` callback that also attempts to modify the response — breaks the separation.

## Decision Points

- **dontReport + reportable vs levels alone**: Use `dontReport` to suppress expected exceptions entirely. Use `$levels` when you want them logged at a lower severity (e.g., WARNING for 404s during security audits). Both can be combined.

## Performance Considerations

- `context()` is called for every exception — keep it lightweight
- Avoid database queries or HTTP calls in `context()`
- External error tracker calls add ~50–200ms — acceptable for exceptional cases

## Security Considerations

- `context()` output is visible in logs and error trackers — no PII
- Review custom `reportable()` callbacks for accidental inclusion of sensitive data
- Error trackers may expose data to team members with access — configure data scrubbing

## Related Rules

- Add Global Context via context() for All Exception Reports
- Log Expected Exceptions at INFO Level, Not ERROR
- Never Log Sensitive Data in Exception Contexts
- Set Appropriate Log Levels per Exception Type
- Separate Report and Render Pipelines

## Related Skills

- Configure the Exception Handler (exception-fundamentals)
- Configure Production Logging and Error Tracking (this file, above)

## Success Criteria

- Every exception report includes user_id, url, method, ip, and request_id
- Expected exceptions are not logged at ERROR level
- Exception severity is correctly mapped (INFO for expected, ERROR for failures, CRITICAL for unknown)
- Domain-specific exceptions log to their respective channels
- No sensitive data leaks into any report
