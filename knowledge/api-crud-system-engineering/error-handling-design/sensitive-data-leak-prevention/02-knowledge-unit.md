# Sensitive Data Leak Prevention

## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Error Handling Design  
**Last Updated:** 2026-06-02

## Executive Summary
A systematic approach to preventing sensitive data — credentials, PII, SQL queries, stack paths, configuration values, and internal identifiers — from appearing in error responses, error logs, or error tracking systems. Prevention is layered: source-side (don't throw sensitive data), handler-side (sanitise before rendering), and log-side (redact before writing).

## Core Concepts
- **Data Classification**: Three sensitivity levels: Public (error codes, generic messages), Internal (file paths, SQL), Sensitive (passwords, tokens, PII).
- **Never at Rest**: Sensitive data should never be stored in exception context, log messages, or error tracking events.
- **Sanitisation Layer**: A pipeline that strips or redacts known sensitive patterns before any output.
- **Safe Defaults**: Assume all context data is sensitive unless explicitly marked as safe.
- **Audit Trail**: Logging when sensitive data is detected being passed to error handling (for fixing the source).

## Mental Models
Think of error handling as a water filtration system. Source water (thrown exception) may contain contaminants (sensitive data). The filtration system has multiple stages: sediment filter (source sanitisation), carbon filter (handler sanitisation), UV filter (log redaction). Water that reaches the consumer (client or log viewer) must be clean.

## Internal Mechanics
1. At throw site: developers must not include sensitive values in exception context.
2. At handler: a `SanitiseExceptionContext` middleware checks exception context against a redaction list.
3. At log: PSR-3 log processors redact known patterns (password, token, secret, credit_card) from log context.
4. At response: any debug output (dev mode) is filtered through a safe-keys allowlist.

```php
class SanitiseExceptionContext
{
    protected array $sensitiveKeys = [
        'password', 'password_confirmation', 'secret', 'token',
        'api_key', 'credit_card', 'ssn', 'auth', 'authorization',
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

## Patterns
- **Key-Name Redaction**: Recursively scan context arrays for keys matching sensitive patterns.
- **Stack Trace Stripping**: Remove `vendor/` paths and server root prefixes from stack traces.
- **Query Parameter Sanitisation**: Strip credentials from URLs in log messages.
- **PII Detection in Messages**: Use regex to detect and redact email patterns, credit card patterns in log messages.
- **Allowlist for Dev Debug**: Dev mode debug output only includes fields from an explicit allowlist.

## Architectural Decisions
| Decision | Choice | Rationale |
|---|---|---|
| Redaction strategy | Key-name matching | Simple, fast, covers most cases |
| Redaction location | Log channel processor + handler middleware | Two layers for defence in depth |
| Dev mode data | Allowlist-based | Prevents new developer attributes from leaking |

## Tradeoffs
| Tradeoff | Option A | Option B | Chosen |
|---|---|---|---|
| Redaction aggressiveness | Conservative (redact only known patterns) | Aggressive (redact all dynamic values) | Conservative — aggressive redaction loses debugging value |
| PII detection | Exact key matching | Regex content scanning | Both — key matching for structured data; regex for message content |
| Approach | Prevent at source | Redact at output | Both — layered defence |

## Performance Considerations
- Context sanitisation is O(n) on context keys (n < 20 typically).
- Regex-based PII detection is slower (use only on message strings, not context).
- Log processor overhead adds ~0.1ms per log entry.
- Use an allowlist cache (static array) for dev mode to avoid re-computation.

## Production Considerations
- Regularly audit error logs and tracking for leaked sensitive data (quarterly scan).
- In Sentry, configure "Data Scrubbing" to redact sensitive keys server-side.
- Add to CI: a test that throws exceptions with known sensitive keys and asserts they are redacted.
- GDPR/CCPA compliance requires that PII in error contexts be subject to data retention policies.
- Never log raw request bodies — they may contain PII.

## Common Mistakes
- Assuming exception context is internal and safe to log freely — context often flows to Sentry/Flare.
- Including `$request->all()` in exception context — contains submitted passwords.
- Logging SQL query bindings in production logs — contain user data.
- Forgetting that `__toString()` on exception objects includes the stack trace with file paths.
- Only sanitising response but not logs (attackers who breach logs get sensitive data).

## Failure Modes
- **Redaction Bypass**: A new context key that doesn't match any sensitive pattern contains PII. Mitigation: use allowlist for structured context; audit new keys in code review.
- **Over-Redaction**: Overly aggressive redaction removes useful diagnostic info. Mitigation: log a warning when data is redacted; tune patterns.
- **Log Processor Not Applied**: A new log channel is added without the redaction processor. Mitigation: enforce redaction processor globally in `config/logging.php`.
- **Image/File Uploads**: Error messages about file uploads may include temp paths. Mitigation: strip server paths from all messages.

## Ecosystem Usage
- **Laravel**: `$this->context()` in Handler can filter sensitive keys before logging.
- **Sentry**: "Data Scrubbing" in project settings — server-side redaction for Sentry-ingested events.
- **Flare**: Auto-redacts `password`, `token`, `secret`, `credit_card`.
- **Monolog**: Processors like `WebProcessor`, `IntrospectionProcessor` add context — ensure they run before redaction.
- **OWASP**: Error Handling Cheat Sheet — "Do not reveal internal details in error responses."

## Related Knowledge Units
### Prerequisites
- KU-15 Production vs Dev Error Detail (dev mode expands what must be sanitised)
- KU-12 Server Error Responses (safe output baseline)

### Related Topics
- KU-17 Error Tracking Integration (Sentry/Flare must also be configured for data scrubbing)
- PII compliance (GDPR, CCPA, HIPAA)

### Advanced Follow-up Topics
- Dynamic PII detection using machine learning on log patterns (Phase 4 research).
- Automated redaction policy testing (fuzzing error responses for data leaks).

## Research Notes
### Source Analysis
OWASP Error Handling Cheat Sheet and Proactive Controls (C10) mandate preventing sensitive data disclosure in errors. Sentry's data scrubbing documentation and Laravel's `$dontFlash` for session data informed the approach.

### Key Insight
**Prevention is more reliable than redaction.** If you never throw sensitive data, you can never leak it. The redaction layer is a safety net, not the primary defence. Train developers to never include `$request->all()`, user passwords, or raw DB data in exception context.

### Version-Specific Notes
- Laravel 10+ `Str::mask()` can partially reveal strings (e.g., `Str::mask($email, '*', 3)`).
- Laravel 11+ `$exception->context()` must be sanitised in the Handler.
- PHP 8.2+ `sensitive_parameter` attribute marks function parameters as redactable from stack traces.
