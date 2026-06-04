# Anti-Patterns — Sensitive Data Leak Prevention

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Knowledge Unit | Sensitive Data Leak Prevention |
| Difficulty | Intermediate |
| Category | Security Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Including $request->all() in Context | Critical | High | Code review: all input including passwords in error context |
| Only Redacting at One Layer | Critical | Medium | Code review: sanitization only at response layer, not logs or tracking |
| Blacklist-Based Redaction | Medium | Medium | Code review: assumes-all-safe pattern |
| SQL Bindings in Log Messages | High | Medium | Code review: query logging enabled in production |
| Not Sanitising Third-Party Packages | High | Low | Code review: package exceptions may contain sensitive context |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Manual Per-Exception Sanitisation | Each exception handles its own redaction | Inconsistent, some exceptions leak |
| Logging Raw Exception __toString() | Full stack trace with file paths | Server structure exposed in logs |
| Over-Redaction | Removing useful diagnostic info | Can't debug production issues |
| No Sanitisation on New Log Channels | New channel added without redaction processor | Unprotected log channel |

---

## Anti-Pattern Details

### AP-SDL-01: Including $request->all() in Context

**Description**: Log context or exception context includes the entire request payload via `$request->all()`. This captures everything the user submitted — including passwords, password confirmations, API tokens, credit card numbers, and any other sensitive fields. These values are stored in plaintext in logs and may be sent to error tracking services.

**Root Cause**: Convenience. "I want to see everything the user sent so I can debug the issue." The developer doesn't consider that the request contains sensitive data.

**Impact**:
- Passwords stored in plaintext in log files
- Credit card numbers in error tracking (PCI DSS violation)
- Auth tokens in logs (usable for impersonation)
- PII (email, phone, SSN) in third-party tracking services (GDPR violation)
- Legal liability: log data breach exposes user credentials

**Detection**:
- Code review: `$request->all()` in exception context or log context
- Code review: `Log::withContext(['input' => $request->all()])`
- Security audit: log files scanned for password patterns
- Incident: data breach traced to accessible log storage

**Solution**:
- Never include `$request->all()` in any context
- Use explicit field lists: `$request->only('email', 'name')`
- Implement a log sanitisation processor that redacts known sensitive keys
- Use allowlist-based approach: only include fields that are explicitly safe

**Example**:
```php
// BEFORE: $request->all() in context
class Handler extends ExceptionHandler
{
    public function context(): array
    {
        return [
            'request_data' => request()->all(), // ❌ includes password, token, credit_card
        ];
    }
}

// AFTER: Explicit safe fields only
class Handler extends ExceptionHandler
{
    public function context(): array
    {
        return [
            'user_id' => request()->user()?->id,
            'trace_id' => request()->header('X-Trace-ID'),
            'url' => request()->fullUrl(),
            'method' => request()->method(),
            'ip' => request()->ip(),
        ]; // ✅ No request body, no PII
    }
}
```

---

### AP-SDL-02: Only Redacting at One Layer

**Description**: Sensitive data sanitisation is only applied at the response layer (error responses are clean), but not at the logging layer or the error tracking layer. Error responses are safe, but log files and Sentry/Flare events contain the sensitive data. The developer assumes "logs are internal" and doesn't consider that logs are the #1 target in data breaches.

**Root Cause**: The developer sanitizes the response because it's visible to users, but doesn't apply the same sanitization to internal outputs (logs, tracking). "Our logs are private."

**Impact**:
- Log data breach exposes sensitive data even though responses are clean
- Error tracking (Sentry) stores sensitive data on third-party servers
- Compliance violation: sensitive data at rest in log files
- False sense of security: "we sanitized the error responses"

**Detection**:
- Code review: sanitisation applied in `render()` but not in `report()` or logging
- Code review: log channel configuration has no redaction processor
- Code review: Sentry/Flare data scrubbing not configured
- Security audit: log files contain sensitive data despite clean error responses

**Solution**:
- Apply sanitisation at ALL three layers: response, logs, and tracking
- Register a log processor that redacts sensitive keys globally
- Configure Sentry/Flare data scrubbing for server-side redaction
- Sanitise at the source (exception context) so all outputs are clean

**Example**:
```php
// BEFORE: Sanitisation at response layer only
class Handler extends ExceptionHandler
{
    public function render($request, Throwable $e): JsonResponse
    {
        // Response is sanitised ✅
        return response()->json(['error' => ['message' => 'Error']], 500);
    }

    public function report(Throwable $e): void
    {
        // But sent to Sentry with full context — unsanitised ❌
        Log::error('Error', ['exception' => $e, 'request' => request()->all()]);
    }
}

// AFTER: Sanitisation at all layers
class Handler extends ExceptionHandler
{
    public function report(Throwable $e): void
    {
        $safeContext = (new SanitiseExceptionContext())->sanitise([
            'trace_id' => request()->header('X-Trace-ID'),
            'user_id' => request()->user()?->id,
        ]);
        Log::error('Error', ['exception' => $e, ...$safeContext]); // ✅ sanitised
    }
}

// config/logging.php — global redaction processor
'channels' => [
    'stack' => [
        'tap' => [RedactSensitiveDataProcessor::class], // ✅ global redaction
    ],
],
```

---

### AP-SDL-03: Blacklist-Based Redaction

**Description**: The redaction approach uses a blacklist of known sensitive keys (`password`, `token`, `secret`). Any key not on the list is assumed safe and passed through. When a new sensitive field is added (e.g., `ssn`, `creditCardNumber`), it leaks until the blacklist is updated.

**Root Cause**: The team assumes they can predict all sensitive fields upfront and maintain the blacklist. This assumption is false in any codebase that evolves.

**Impact**:
- New sensitive fields leak until the blacklist is updated
- No warning when an unknown sensitive field passes through
- The blacklist grows without bound but still misses edge cases
- False sense of security: "we have redaction configured"

**Detection**:
- Code review: redaction uses `in_array($key, $sensitiveKeys)` — blacklist only
- Security audit: new fields (e.g., `phone`, `ssn`) found in logs
- Code review: no allowlist or regex-based pattern matching

**Solution**:
- Use an allowlist approach: only pass through explicitly safe fields
- Use regex patterns to detect sensitive data by VALUE pattern (credit card regex, email)
- Combine blacklist with key-pattern matching (`*password*`, `*token*`, `*secret*`)
- Log a warning when unknown keys with sensitive-looking values are encountered

**Example**:
```php
// BEFORE: Blacklist-only redaction
class SanitiseExceptionContext
{
    protected array $sensitiveKeys = [
        'password', 'token', 'secret', // ❌ new sensitive keys not in this list will leak
    ];

    public function sanitise(array $context): array
    {
        foreach ($context as $key => $value) {
            if (in_array($key, $this->sensitiveKeys)) {
                $context[$key] = '[REDACTED]';
            }
        }
        return $context;
    }
}

// AFTER: Allowlist + pattern matching
class SanitiseExceptionContext
{
    protected array $allowedKeys = [
        'user_id', 'trace_id', 'url', 'method', 'ip', 'resource_type',
    ];

    protected array $sensitivePatterns = [
        '/password/i', '/token/i', '/secret/i', '/key/i', '/auth/i',
        '/credit/i', '/ssn/i', '/phone/i', '/email/i',
    ];

    public function sanitise(array $context): array
    {
        foreach ($context as $key => $value) {
            if (in_array($key, $this->allowedKeys)) {
                continue; // ✅ explicitly allowed
            }
            foreach ($this->sensitivePatterns as $pattern) {
                if (preg_match($pattern, $key)) {
                    $context[$key] = '[REDACTED]';
                    break;
                }
            }
            // If not allowed and not matched by pattern — still redact by default
            if (!isset($context[$key]) || $context[$key] !== '[REDACTED]') {
                $context[$key] = '[REDACTED]';
            }
        }
        return $context;
    }
}
```
