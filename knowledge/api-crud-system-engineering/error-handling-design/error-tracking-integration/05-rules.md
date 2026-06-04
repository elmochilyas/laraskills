# Phase 5: Rules — Error Tracking Integration

## Rule: Register Error Tracking via reportable() Callbacks
---
## Category
Framework Usage | Code Organization
---
## Rule
Always register error tracking integration using `reportable()` callbacks in the handler's `register()` method; never integrate tracking by overriding the `report()` method.
---
## Reason
`reportable()` callbacks are the Laravel 10+ convention for side-effect handling (logging, tracking, notifications) and ensure upgrade compatibility. They are evaluated only for exceptions that pass `$dontReport` filtering.
---
## Bad Example
```php
class Handler extends ExceptionHandler
{
    public function report(Throwable $e): void
    {
        parent::report($e);
        Sentry::captureException($e); // Overrides — breaks upgrade path
    }
}
```
---
## Good Example
```php
public function register(): void
{
    $this->reportable(function (Throwable $e) {
        if ($this->shouldReportToSentry($e)) {
            \Sentry\captureException($e);
        }
    });
}
```
---
## Exceptions
Legacy Laravel versions (pre-8.x) that do not support `reportable()` callbacks; upgrade as soon as possible.
---
## Consequences Of Violation
Framework upgrade breaks custom reporting logic; reporting happens for exceptions in `$dontReport`; cannot control filtering per tracking service.

---

## Rule: Filter High-Volume Operational Exceptions from Tracking
---
## Category
Performance | Scalability
---
## Rule
Always filter or sample (10%) high-volume operational exceptions — `AuthenticationException`, `ValidationException`, `ThrottleRequestsException` — from error tracking to avoid budget waste and signal noise.
---
## Reason
Operational errors are expected traffic — tracking every 401 and 422 burns through event budgets (Sentry/Bugsnag pricing) and drowns out the signal of real programmer errors.
---
## Bad Example
```php
$this->reportable(function (Throwable $e) {
    \Sentry\captureException($e); // Every 401 and 422 tracked — budget wasted
});
```
---
## Good Example
```php
protected function shouldReportToSentry(Throwable $e): bool
{
    return ! $e instanceof AuthenticationException
        && ! $e instanceof ValidationException
        && ! $e instanceof ThrottleRequestsException;
}

$this->reportable(function (Throwable $e) {
    if ($this->shouldReportToSentry($e)) {
        \Sentry\captureException($e);
    }
});
```
---
## Exceptions
Operational exceptions that indicate abuse (e.g., 429 with unusual patterns); use a sampling rate (10%) for these instead of full exclusion.
---
## Consequences Of Violation
Monthly error tracking budget exhausted on expected traffic; real programmer errors buried in noise; false-positive PagerDuty alerts.

---

## Rule: Tag Every Error Event with Error Code and Domain
---
## Category
Maintainability | Reliability
---
## Rule
Always set `error_code` and `domain` tags on every error tracking event; never send events without machine-parseable tags.
---
## Reason
Tags enable dashboard filtering, alert routing, and issue grouping by error type. Without tags, finding all occurrences of a specific error code requires inspecting each event individually.
---
## Bad Example
```php
\Sentry\configureScope(function (Scope $scope): void {
    // No tags — cannot filter by error code in dashboard
});
\Sentry\captureException($e);
```
---
## Good Example
```php
\Sentry\configureScope(function (Scope $scope) use ($e): void {
    $scope->setTag('error_code', $this->resolveCode($e));
    $scope->setTag('domain', $this->resolveDomain($e));
    $scope->setTag('environment', app()->environment());
});
\Sentry\captureException($e);
```
---
## Exceptions
No common exceptions — tags are the primary mechanism for error aggregation and must always be present.
---
## Consequences Of Violation
Cannot filter dashboard by error code; unable to identify which error types spiked after a deploy; alert routing cannot differentiate error severity by type.

---

## Rule: Set Release Version for Deploy Tracking
---
## Category
Reliability | Maintainability
---
## Rule
Always set the release version (git SHA or `APP_VERSION`) on error tracking initialization; never deploy without a release tag.
---
## Reason
Release tags enable regression detection — when a new error type appears, the release tag identifies exactly which deploy introduced it, enabling instant rollback decisions.
---
## Bad Example
```php
// No release set — all errors untrackable by version
\Sentry\init(['dsn' => env('SENTRY_DSN')]);
```
---
## Good Example
```php
// AppServiceProvider or SentryServiceProvider
\Sentry\init([
    'dsn' => env('SENTRY_DSN'),
    'release' => env('APP_VERSION', trim(exec('git log --pretty="%H" -n1 HEAD'))),
]);
```
---
## Exceptions
Local development where release tracking is unnecessary; skip release tag in non-production environments.
---
## Consequences Of Violation
Cannot correlate error spike to a deploy; regression detection impossible; rollback decisions lack data support.

---

## Rule: Attach User ID, Never PII, to Tracking Events
---
## Category
Security | Compliance
---
## Rule
Always attach only the authenticated user ID (integer/UUID) to error tracking user context; never include email, name, IP address, or any PII.
---
## Reason
Error tracking services store and index user context. Including PII turns the tracking service into a data processor under GDPR/CCPA, requiring DPA and compliance audits.
---
## Bad Example
```php
\Sentry\configureScope(function (Scope $scope): void {
    $scope->setUser([
        'id' => $user->id,
        'email' => $user->email,       // PII — GDPR violation
        'username' => $user->username,  // PII if username is email
        'ip_address' => request()->ip(), // PII
    ]);
});
```
---
## Good Example
```php
\Sentry\configureScope(function (Scope $scope): void {
    $scope->setUser([
        'id' => (string) request()->user()?->id, // Non-PII identifier only
    ]);
});
```
---
## Exceptions
Explicit user consent obtained for error reporting that includes contact information for support follow-up; document the lawful basis.
---
## Consequences Of Violation
GDPR/CCPA violation; requires Data Processing Agreement with tracking provider; privacy fine exposure; user data stored in third-party system without consent.

---

## Rule: Always Queue Error Tracking Events Asynchronously
---
## Category
Performance | Reliability
---
## Rule
Always push error tracking HTTP calls to a queue; never send them synchronously from the request thread.
---
## Reason
Synchronous tracking adds 100–500ms to the error response latency. If the tracking service is down, the application response blocks waiting for a timeout — degrading availability.
---
## Bad Example
```php
$this->reportable(function (Throwable $e) {
    \Sentry\captureException($e); // Synchronous HTTP call — blocks response
});
```
---
## Good Example
```php
$this->reportable(function (Throwable $e) {
    if ($this->shouldReportToSentry($e)) {
        dispatch(function () use ($e) {
            \Sentry\captureException($e);
        })->onQueue('error-tracking');
    }
});
```
---
## Exceptions
Critical infrastructure errors where the error tracking event is more important than the response latency; still use a short timeout.
---
## Consequences Of Violation
Increased response latency during error conditions; error response itself may timeout; tracking service outage causes application slowdown.

---

## Rule: Never Send Raw Request Bodies or Session Data to Tracking
---
## Category
Security
---
## Rule
Always exclude raw request bodies, session data, `$_SERVER`, `$_ENV`, and configuration values from error tracking event context.
---
## Reason
Request bodies contain submitted data including passwords, tokens, and PII. Session data may contain authentication tokens. Sending these to a third-party service creates a data breach vector.
---
## Bad Example
```php
\Sentry\configureScope(function (Scope $scope): void {
    $scope->setExtra('request_body', request()->all()); // Contains passwords!
    $scope->setExtra('session', session()->all());      // Contains auth tokens!
});
```
---
## Good Example
```php
\Sentry\configureScope(function (Scope $scope): void {
    $scope->setExtra('trace_id', $this->getTraceId());
    $scope->setExtra('method', request()->method());
    $scope->setExtra('url', request()->fullUrl());
    // Never raw request body or session
});
```
---
## Exceptions
No common exceptions — raw request bodies and sessions must never be sent to third-party tracking.
---
## Consequences Of Violation
Third-party tracking service becomes a data processor with PII; data breach if tracking provider is compromised; compliance violation.

---

## Rule: Configure Server-Side Data Scrubbing in Tracking Service
---
## Category
Security
---
## Rule
Always configure server-side data scrubbing (Sentry "Data Scrubbing" settings, Flare filters) to redact common sensitive patterns before they reach the tracking service; never rely solely on application-side sanitisation.
---
## Reason
Defence in depth — if application sanitisation misses a sensitive field for any reason, server-side scrubbing provides a second layer of protection before data is stored.
---
## Bad Example
```php
// Only application-side sanitisation — no sentry scrubbing configured
// Sentry dashboard: Data Scrubbing = disabled
```
---
## Good Example
```php
// Sentry init with built-in scrubbing
\Sentry\init([
    'dsn' => env('SENTRY_DSN'),
    'send_default_pii' => false,
    'before_send' => function (\Sentry\Event $event): ?\Sentry\Event {
        // Additional application-level filters
        return $event;
    },
]);
// Sentry dashboard: Enable "Data Scrubbing" for passwords, credit cards, emails
```
---
## Exceptions
Self-hosted error tracking where full control of the data storage eliminates third-party risk.
---
## Consequences Of Violation
Single missed `$request->all()` call sends credentials to tracking; PII is stored in third-party system before detection; compliance incident.

---

## Rule: Monitor Error Tracking Budget and Set Event Rate Limits
---
## Category
Scalability | Reliability
---
## Rule
Always set event rate limits and daily budgets on error tracking; never run with unlimited event ingestion.
---
## Reason
A single misconfigured client or bug can generate millions of error events per hour, exhausting the monthly tracking budget in minutes and causing all subsequent errors to be dropped silently.
---
## Bad Example
```php
// No rate limits — one bug can burn the entire budget
\Sentry\init(['dsn' => env('SENTRY_DSN')]);
// No configured rate limits
```
---
## Good Example
```php
\Sentry\init([
    'dsn' => env('SENTRY_DSN'),
    'rate_limiter' => [
        'max_events_per_minute' => 100,
        'max_events_per_hour' => 5000,
    ],
]);
// Also configure daily budget in Sentry dashboard
```
---
## Exceptions
Self-hosted tracking with no cost per event; still set rate limits to prevent storage bloat.
---
## Consequences Of Violation
Monthly budget exhausted on first day; all subsequent errors untracked until budget resets; critical bugs missed due to tracking cap.
