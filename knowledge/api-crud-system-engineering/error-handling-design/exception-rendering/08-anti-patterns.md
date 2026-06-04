# Anti-Patterns: Exception Rendering

## Handler Bloat
**Description:** Putting all exception-to-response mapping logic directly in the Handler class with dozens of renderable callbacks.
**Why it happens:** Developers treat the Handler as the single place for all error handling.
**Consequences:** Handler becomes unmaintainable; adding a new exception requires editing the Handler.
**Better approach:** Define `render()` on individual exception classes. Keep the Handler thin — only for exceptions you can't modify.

## Production Debug Leak
**Description:** Returning stack traces, SQL queries, or file paths in production error responses.
**Why it happens:** `APP_DEBUG=true` left enabled, or the handler doesn't strip debug info.
**Consequences:** Security vulnerability; internal system architecture exposed.
**Better approach:** The handler must check `APP_DEBUG` and strip debug info in production.

## HTML In API Routes
**Description:** API endpoints returning HTML error pages (Laravel's "Whoops!" page) when an exception occurs.
**Why it happens:** The default handler returns HTML for all exceptions; no JSON-only fallback for API routes.
**Consequences:** API consumers receive HTML instead of JSON; client-side error handling breaks.
**Better approach:** Register a JSON-only renderable callback that catches all exceptions for API requests.

## No Exception Logging
**Description:** The handler returns a 500 response but doesn't log the exception details.
**Why it happens:** Default handler may not log all exception types; custom rendering omits logging.
**Consequences:** Server errors are invisible in monitoring; debugging requires reproducing the issue.
**Better approach:** Always log exceptions before rendering. Use `$this->report()` or explicit logging.

## Format Inconsistency
**Description:** Each custom exception's render() method returns a different JSON structure.
**Why it happens:** No shared error envelope contract; each developer structures errors differently.
**Consequences:** Consumers must handle multiple error formats; client-side error parsing is fragile.
**Better approach:** Use a shared error envelope builder or response factory across all render() methods.
