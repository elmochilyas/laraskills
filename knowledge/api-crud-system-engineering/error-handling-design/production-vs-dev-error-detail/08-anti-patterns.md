# Anti-Patterns — Production vs Dev Error Detail

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Knowledge Unit | Production vs Dev Error Detail |
| Difficulty | Intermediate |
| Category | Configuration Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| APP_DEBUG=true in Production | Critical | Medium | CI check: .env or config has APP_DEBUG=true |
| Different Envelope Shapes per Environment | High | Medium | Code review: envelope fields differ between dev and prod |
| Hardcoding Debug Behaviour | Medium | Medium | Code review: `env('APP_DEBUG')` instead of `config('app.debug')` |
| Whoops Page for API Routes | High | Medium | Code review: no expectsJson() guard in dev mode |
| Conditional Rendering via Request Parameter | Critical | Low | Code review: `?debug=1` exposes internals |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Returning Dev Detail in Staging | Staging shows stack traces | Staging should mirror production error detail |
| Environment Detection in Exception Classes | Classification depends on environment | Exception behavior changes between environments |
| Including Traces in Logs but Not Responses (Reverse) | Logs are minimal, responses are verbose | Can't debug from log correlation alone |

---

## Anti-Pattern Details

### AP-PDE-01: APP_DEBUG=true in Production

**Description**: `APP_DEBUG=true` is set in the production environment, exposing full stack traces, file paths, SQL queries, and environment variables in API error responses. This is the most common and most dangerous error-handling misconfiguration. Any error endpoint becomes a full information disclosure vector.

**Root Cause**: A developer sets `APP_DEBUG=true` for temporary debugging and forgets to revert it. No CI check prevents the misconfiguration from reaching production.

**Impact**:
- Full information disclosure: stack traces, file paths, source code snippets
- Database credentials and API keys may be exposed via `$_ENV` in Whoops pages
- SQL queries exposed in responses reveal database schema
- Compliance violation: GDPR, PCI DSS, HIPAA all require secure error handling
- Severity: immediate security incident

**Detection**:
- CI check: `.env` file or config scanned for `APP_DEBUG=true` in production environments
- Security scan: probing endpoints with invalid data to check for stack traces
- Bug report: "I saw a stack trace when I made a bad request"

**Solution**:
- Enforce `APP_DEBUG=false` in production via CI — fail the build if detected
- Use environment-specific `.env` files (`.env.production` is never committed)
- Add a health check endpoint that verifies debug mode is disabled
- Monitor for stack traces in error responses via automated testing

**Example**:
```php
// CI check (e.g., in deploy script or test suite):
// BEFORE: No check — APP_DEBUG=true can reach production
// deploy.sh: just deploys whatever is in .env

// AFTER: CI check prevents production deployment with debug on
// tests/Feature/ProductionSafetyTest.php
public function test_debug_mode_is_disabled_in_production(): void
{
    if (app()->isProduction()) {
        $this->assertFalse(config('app.debug'), 'APP_DEBUG must be false in production');
    }
}

// Or in a deploy script:
// if grep -q "APP_DEBUG=true" .env.production; then
//   echo "ERROR: APP_DEBUG is true in production config"
//   exit 1
// fi
```

---

### AP-PDE-02: Different Envelope Shapes per Environment

**Description**: The error envelope structure changes between development and production environments. In development, the envelope includes `error.file`, `error.line`, `error.trace`. In production, these fields are missing. Clients that test against a development environment may parse these fields and fail when the application runs in production.

**Root Cause**: The developer adds debug fields directly to the error envelope instead of using a separate `debug` key.

**Impact**:
- Client code breaks when moving from dev to production
- The API contract is environment-dependent
- Envelope structure is inconsistent, violating the principle of a stable API contract
- Clients cannot rely on field presence in any environment

**Detection**:
- Code review: envelope keys like `file`, `line`, `trace` added under the `error` key
- Code review: envelope fields added conditionally without a separate namespace
- Client issues: "Error parsing works in dev but fails in production"

**Solution**:
- Keep the error envelope identical across all environments
- Add dev-only detail under a separate top-level `debug` key
- The `debug` key is optional and never guaranteed
- All envelope fields are always present in every environment

**Example**:
```php
// BEFORE: Different envelope shapes
// Dev: { error: { code, message, status, file, line, trace } } ❌
// Prod: { error: { code, message, status } } ❌ — different keys

// AFTER: Same envelope, separate debug key
// Dev: { error: { code, message, status }, debug: { file, line, trace } }
// Prod: { error: { code, message, status } } ✅ — same envelope
public function render($request, Throwable $e): JsonResponse
{
    $response = new ErrorEnvelope(
        code: $this->resolveCode($e),
        message: 'An error occurred.',
        status: 500,
    );

    if (config('app.debug') && app()->isLocal()) {
        return response()->json([
            'error' => $response,
            'debug' => [ // ✅ separate key
                'class' => $e::class,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => array_slice($e->getTrace(), 0, 10),
            ],
        ], 500);
    }

    return response()->json(['error' => $response], 500);
}
```

---

### AP-PDE-03: Conditional Rendering via Request Parameter

**Description**: Debug information is enabled based on a request parameter (`?debug=1` or `X-Debug: true` header) rather than environment configuration. A developer, tester, or attacker can enable debug mode on any environment — including production — by adding the parameter to their request.

**Root Cause**: The developer wants to selectively see debug information for specific requests without enabling it globally. They don't realize this creates an open backdoor to sensitive information.

**Impact**:
- Anyone with the URL can enable debug mode in production
- Stack traces, file paths, and SQL queries become accessible via ?debug=1
- The debug backdoor can be shared, bookmarked, or discovered via logs
- Security audit fails: debug mode is controllable by the client
- Compliance violation: no production security control

**Detection**:
- Code review: `if ($request->has('debug'))`, `if ($request->header('X-Debug'))` in handler
- Code review: middleware that enables debug mode based on request parameters
- Penetration testing: appending `?debug=1` to any endpoint reveals internals

**Solution**:
- Debug mode must only be controlled by `APP_DEBUG` and environment detection
- Never allow clients to enable debug mode via request parameters or headers
- Use IP-based allowlist only as an additional layer (never the primary control)
- Document that production debug is never client-controllable

**Example**:
```php
// BEFORE: Debug via request parameter
public function render($request, Throwable $e): JsonResponse
{
    $debug = $request->has('debug'); // ❌ anyone can add ?debug=1
    if ($debug) {
        // return detailed error
    }
    // return safe error
}

// AFTER: Environment-gated debug only
public function render($request, Throwable $e): JsonResponse
{
    $debug = config('app.debug') && app()->isLocal(); // ✅ only environment
    if ($debug) {
        // return detailed error
    }
    // return safe error
}
```
