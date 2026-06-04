# Sensitive Data Leak Prevention

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-error-handling-design-sensitive-data-leak-prevention |
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Skill Level | Intermediate |
| Classification | Security Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

A systematic approach to preventing sensitive data — credentials, PII, SQL queries, stack paths, configuration values, and internal identifiers — from appearing in error responses, error logs, or error tracking systems. Prevention is layered: source-side (don't throw sensitive data), handler-side (sanitise before rendering), and log-side (redact before writing).

## Core Concepts

- **Data Classification**: Three levels: Public (error codes, generic messages), Internal (file paths, SQL), Sensitive (passwords, tokens, PII).
- **Never at Rest**: Sensitive data should never be stored in exception context, log messages, or error tracking events.
- **Sanitisation Layer**: A pipeline that strips or redacts known sensitive patterns before any output.
- **Safe Defaults**: Assume all context data is sensitive unless explicitly marked as safe.
- **Layered Defence**: Prevention at source → redaction at handler → redaction at log.
- **Audit Trail**: Logging when sensitive data is detected being passed to error handling (for fixing the source).

## When To Use

- For any production API handling user data
- When subject to compliance requirements (GDPR, CCPA, HIPAA, PCI DSS)
- When integrating third-party error tracking services (Sentry, Flare)
- For any API that logs request data or exception context
- When stack traces may contain file paths with server structure

## When NOT To Use

- For local-only development tools with no real user data
- For APIs that process only public, non-sensitive information
- When no logging or error tracking is implemented

## Best Practices (WHY)

- **Prevention > Redaction**: If you never throw sensitive data, you can never leak it.
- **Use layered defence**: Source sanitisation + handler sanitisation + log redaction.
- **Use key-name redaction**: Recursively scan context arrays for keys matching sensitive patterns.
- **Redact in log processors**: Apply redaction globally in the logging channel configuration.
- **Strip server paths from stack traces**: Remove `vendor/` paths and server root prefixes.
- **Sanitise query parameters**: Remove credentials from URLs before logging.
- **Use allowlist for dev debug**: Only include fields from an explicit allowlist in debug output.
- **Audit error logs quarterly**: Scan for leaked sensitive data patterns.

## Architecture Guidelines

- Implement `SanitiseExceptionContext` class that recursively redacts sensitive keys.
- Register log processor that redacts known patterns (`password`, `token`, `secret`, `credit_card`).
- Apply sanitisation in the exception handler before building the response.
- Strip HTML/JS from error messages to prevent XSS.
- Never log raw request bodies — they often contain PII.
- Configure Sentry "Data Scrubbing" for server-side redaction.
- Add CI test: throw exception with known sensitive keys and assert they are redacted.

## Performance Considerations

- Context sanitisation is O(n) on context keys (n < 20 typically).
- Regex-based PII detection is slower — use only on message strings, not context.
- Log processor overhead adds ~0.1ms per log entry.
- Use an allowlist cache (static array) for dev mode to avoid re-computation.
- Redaction is not on the hot path (only runs for error responses).

## Security Considerations

- Never store sensitive values in exception context — they may be logged and tracked.
- Redaction is a safety net, not primary defence — train developers to never include sensitive data.
- Ensure redaction patterns cover all known sensitive keys.
- Test redaction with fuzzing — throw errors with random context and verify no leak.
- PII detection should cover emails, phone numbers, credit card numbers, and SSNs.
- GDPR requires that PII in error contexts be subject to data retention policies.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Including $request->all() in context | All submitted data including passwords | Convenience for debugging | Credential leak in logs | Use specific fields, never $request->all() |
| SQL bindings in log messages | User data in query logs | Default Laravel logging | PII exposure | Disable query logging in production |
| Only sanitising responses, not logs | Error responses safe, but logs leak data | Logs considered "internal" | Breach via log access | Apply redaction to all output paths |
| Not sanitising third-party packages | Package exceptions contain sensitive context | Assuming packages are safe | Unexpected data leak | Review and sanitise package exception context |
| Over-redaction | Removing useful diagnostic info | Too aggressive patterns | Can't debug production issues | Log warning when data is redacted; tune patterns |
| No sanitisation on new log channels | New channel added without redaction processor | Missing configuration | Unprotected log channel | Enforce redaction globally in config/logging.php |

## Anti-Patterns

- **Only redacting at one layer**: Single layer of defence is insufficient.
- **Blacklist-based redaction**: Assume-all-safe pattern misses unknown sensitive keys.
- **Manual per-exception sanitisation**: Inconsistent — some exceptions leak, others don't.
- **Logging raw exception `__toString()`**: Includes full stack trace with file paths.
- **Redaction in exception constructors**: Exception may never be logged/rendered — waste.

## Examples

```php
class SanitiseExceptionContext
{
    protected array $sensitiveKeys = [
        'password', 'password_confirmation', 'secret', 'token',
        'api_key', 'credit_card', 'ssn', 'authorization',
    ];

    public function sanitise(array $context): array
    {
        foreach ($context as $key => $value) {
            if ($this->isSensitive($key)) {
                $context[$key] = '[REDACTED]';
            }
            if (is_array($value)) {
                $context[$key] = $this->sanitise($value);
            }
        }
        return $context;
    }
}
```

## Related Topics

- Server Error Responses (the safe output baseline)
- Production vs Dev Error Detail (dev mode expands what must be sanitised)
- Error Logging Context (context must be sanitised before logging)
- Error Tracking Integration (Sentry/Flare data scrubbing)
- PII compliance (GDPR, CCPA, HIPAA)

## AI Agent Notes

- Never include `$request->all()`, user passwords, or raw DB data in exception context.
- Apply redaction globally in log channel configuration, not per-exception.
- When generating exception classes, validate that context does not include sensitive fields.
- Redaction should happen at three levels: source, handler, and log.
- For dev mode debug output, use an allowlist approach — only include explicitly safe fields.

## Verification

- [ ] Exception context is sanitised before response rendering
- [ ] Log channel configuration includes redaction processor
- [ ] No `$request->all()` calls in exception context creation
- [ ] Sensitive key patterns (`password`, `token`, `secret`, `credit_card`) are redacted
- [ ] Stack traces have server paths stripped
- [ ] Error tracking service (Sentry/Flare) has data scrubbing configured
- [ ] CI test verifies sensitive data is redacted from error responses
- [ ] Quarterly audit of error logs for leaked sensitive data
