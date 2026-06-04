# Anti-Patterns — Error Tracking Integration

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Knowledge Unit | Error Tracking Integration |
| Difficulty | Expert |
| Category | Integration Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Tracking All 401/403 Errors | High | High | Code review: no filtering of operational errors |
| Including PII in User Context | Critical | Medium | Code review: email, name, IP in Sentry tags |
| No Release Tag | Medium | Medium | Code review: release version not configured |
| Synchronous Sending | Medium | Medium | Code review: event sending not queued |
| Failing Open When Sentry Is Down | Medium | Low | Code review: Sentry SDK blocks on failure |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Over-Filtering | Excluding too many errors hides real issues in noise | Production incidents missed |
| Excessive Breadcrumbs | Event size and cost balloon | Higher tracking costs, slower ingest |
| Same Grouping Key for All Errors | All errors grouped under one issue | Cannot prioritize fixes |

---

## Anti-Pattern Details

### AP-ETI-01: Tracking All 401/403 Errors

**Description**: Every authentication failure (401) and authorization denial (403) is sent to the error tracking service as an error event. Since these errors are expected and high-volume (bots scanning, users mistyping passwords, expired tokens), the tracking dashboard is flooded with noise. Real errors (500s, programmer bugs) are buried in the noise, and the error tracking budget is consumed by non-actionable events.

**Root Cause**: The developer configures the tracking SDK to report all exceptions without any filtering. Default configuration often reports everything.

**Impact**:
- Dashboard noise: 95% of events are expected operational errors
- Alert fatigue: on-call engineers ignore warnings because most are auth failures
- Budget exhaustion: operational errors consume the error tracking quota
- Real issues are delayed: programmer errors filtered after operational ones fill the dashboard

**Detection**:
- Code review: no filter or sampling for `AuthenticationException`, `AuthorizationException`, `ValidationException`
- Error tracking dashboard: 95%+ of events are 401/403/422
- Budget alerts: tracking quota exceeded from high-volume auth errors

**Solution**:
- Filter operational exceptions (401, 403, 422) from tracking
- Sample high-volume errors (log 10% of validation errors)
- Only send programmer and infrastructure errors to tracking
- Configure inbound filters on the tracking service itself as a second layer

**Example**:
```php
// BEFORE: Tracking all errors
public function register(): void
{
    $this->reportable(function (Throwable $e) {
        Sentry::captureException($e); // ❌ sends 401, 403, 422 to Sentry
    });
}

// AFTER: Filter operational errors
public function register(): void
{
    $this->reportable(function (Throwable $e) {
        if ($e instanceof AuthenticationException) return;     // filter 401
        if ($e instanceof AuthorizationException) return;      // filter 403
        if ($e instanceof ValidationException) return;         // filter 422
        if ($e instanceof ThrottleRequestsException) return;   // filter 429
        Sentry::captureException($e); // ✅ only programmer and infrastructure errors
    });
}
```

---

### AP-ETI-02: Including PII in User Context

**Description**: User context sent to the error tracking service includes personally identifiable information (PII) — email address, full name, phone number, IP address. This data is stored on third-party servers, potentially violating GDPR, CCPA, or other data protection regulations. Tags containing PII are indexed and searchable, making the PII easily accessible.

**Root Cause**: Convenience. The developer sets the user context with the entire User object or `$request->user()->toArray()` without considering data minimization.

**Impact**:
- GDPR violation: PII stored on third-party servers without consent
- Data breach: if Sentry is breached, PII is exposed
- Compliance liability: regulatory fines for improper PII handling
- Searchable PII: Sentry tags are indexed — any team member can search by email

**Detection**:
- Code review: `Sentry\setUser(['email' => $user->email, 'name' => $user->name])` — PII fields
- Code review: `Sentry\configureScope()` includes `getUser()->toArray()` — entire user object
- Security audit: Sentry event data includes email, name, phone fields

**Solution**:
- Send only the user ID (never email, name, phone)
- Use opaque user identifiers that cannot identify the individual
- Configure Sentry's data scrubbing to redact common PII fields
- Audit all tracking data before sending to third-party services

**Example**:
```php
// BEFORE: PII in user context
\Sentry\configureScope(function (Scope $scope): void {
    $scope->setUser([
        'id' => auth()->id(),
        'email' => auth()->user()?->email, // ❌ PII
        'name' => auth()->user()?->name,   // ❌ PII
        'ip' => request()->ip(),           // ❌ PII
    ]);
});

// AFTER: User ID only
\Sentry\configureScope(function (Scope $scope): void {
    $scope->setUser([
        'id' => (string) auth()->id(), // ✅ only identifier
    ]);
});
```

---

### AP-ETI-03: Synchronous Sending

**Description**: Error tracking events are sent synchronously during the request lifecycle. The HTTP response is blocked waiting for the tracking service's HTTP call to complete. If the tracking service is slow or down, the API response is delayed or fails.

**Root Cause**: The developer configures the error tracking SDK with default settings, which send events synchronously. The performance impact is not considered.

**Impact**:
- Increased response latency: each error adds 100-500ms for the tracking HTTP call
- Cascading failure: if Sentry is down, the API becomes slow or unresponsive
- Error-during-error-handling: if tracking fails, the original error response is lost
- Poor user experience: users experience slow responses when errors occur

**Detection**:
- Performance monitoring: error responses take significantly longer than success responses
- Code review: no queue configuration for the tracking SDK
- Incident: Sentry outage causes API latency spike

**Solution**:
- Configure the tracking SDK for async sending
- Use the queue for event dispatch
- Set a timeout on tracking calls (fail fast)
- Never let error tracking affect the primary response

**Example**:
```php
// BEFORE: Synchronous sending
// config/sentry.php
return [
    'dsn' => env('SENTRY_LARAVEL_DSN'),
    // No queue configuration — synchronous by default ❌
];

// AFTER: Async sending via queue
// config/sentry.php
return [
    'dsn' => env('SENTRY_LARAVEL_DSN'),
    'send_events_async' => true, // ✅ queue-based dispatch
    'queue_connection' => env('SENTRY_QUEUE_CONNECTION', 'redis'),
    'queue_queue' => 'sentry', // dedicated queue for tracking
];
```
