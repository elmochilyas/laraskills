# Anti-Patterns — Global Exception Handler Configuration

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Knowledge Unit | Global Exception Handler Config |
| Difficulty | Advanced |
| Category | Configuration Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Single Monolithic render() Method | High | Medium | Code review: overridden `render()` with giant switch statement |
| Missing expectsJson() Check | Critical | High | Code review: renderable returns HTML for API route |
| Handler Doing Business Logic | High | Low | Code review: renderable queries database or calls services |
| No Fallback Handler | High | Medium | Code review: no Throwable fallback registered |
| Silent Failures | Medium | Low | Code review: renderable catches exception but returns null |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Overriding render() Instead of Using register() | Custom `render()` method overrides parent | Breaks framework upgrade path |
| Registering Same Exception Twice | First callback wins silently | Unexpected handler behavior |
| Closures Capturing Heavy Dependencies | Memory leak risk | Increased memory per request |

---

## Anti-Pattern Details

### AP-GHC-01: Single Monolithic render() Method

**Description**: The handler overrides the `render()` method with a giant switch/match/if-else chain that inspects every exception type. The `render()` method grows to 80+ lines with mixed concerns — code resolution, response building, logging, and error tracking. Adding a new exception type requires modifying the single method.

**Root Cause**: Older tutorials and documentation override `render()`. The developer follows these patterns without knowing that `register()` callbacks are the modern, upgrade-compatible approach.

**Impact**:
- Violates Open/Closed principle: adding new exception types requires modifying existing code
- High merge conflict risk: every team member modifies the same `render()` method
- Mixed concerns: response building, logging, and tracking in one method
- Framework upgrade risk: Laravel may change the `render()` signature in future versions

**Detection**:
- Code review: `Handler::render()` is overridden (not using `register()` callbacks)
- Code review: `render()` method has switch/match with 15+ branches
- Code review: `render()` contains logging calls, response construction, and tracking integration

**Solution**:
- Do NOT override `render()` — use `register()` with `renderable()` callbacks
- Create one `renderable()` callback per exception type or category
- Delegate each callback to a dedicated named method for testability
- Register specific types first, general types last

**Example**:
```php
// BEFORE: Monolithic render() method override
class Handler extends ExceptionHandler
{
    public function render($request, Throwable $e): JsonResponse
    {
        if ($e instanceof AuthenticationException) { /* ... */ }
        elseif ($e instanceof AuthorizationException) { /* ... */ }
        elseif ($e instanceof ModelNotFoundException) { /* ... */ }
        elseif ($e instanceof ValidationException) { /* ... */ }
        // ... 15 more branches
        else { /* catch-all */ }
    }
}

// AFTER: Register() with dedicated renderable callbacks
class Handler extends ExceptionHandler
{
    public function register(): void
    {
        $this->renderable(fn(AuthenticationException $e, Request $r) =>
            $r->expectsJson() ? $this->handleAuthError($e, $r) : null
        );
        $this->renderable(fn(ValidationException $e, Request $r) =>
            $r->expectsJson() ? $this->handleValidationError($e, $r) : null
        );
        $this->renderable(fn(Throwable $e, Request $r) =>
            $r->expectsJson() ? $this->handleServerError($e, $r) : null
        );
    }
}
```

---

### AP-GHC-02: Missing expectsJson() Check

**Description**: Renderable callbacks return JSON error responses without checking `$request->expectsJson()`. When the same handler handles both web and API routes, an API request that expects JSON may receive an HTML Whoops page, or a web request may receive JSON instead of a proper error page.

**Root Cause**: The developer only considers API routes. They don't guard renderables for the request type.

**Impact**:
- API clients receive HTML error pages when the Accept header is not set
- Web users receive JSON error messages that their browser can't render
- Inconsistent error formatting across request types
- Breaks Laravel's convention: web routes get HTML, API routes get JSON

**Detection**:
- Code review: renderable callbacks return `response()->json()` without `$request->expectsJson()` guard
- Bug reports: "API returns HTML when Accept header is missing"
- Browser testing: web routes show raw JSON instead of error page

**Solution**:
- Guard every renderable callback with `$request->expectsJson()`
- Return `null` for non-JSON requests so the framework falls back to default handling
- Use Laravel's `Accept` header-based content negotiation

**Example**:
```php
// BEFORE: No expectsJson() guard
public function register(): void
{
    $this->renderable(function (AuthenticationException $e, Request $request) {
        return response()->json(['error' => 'Unauthenticated'], 401); // ❌ HTML request gets JSON
    });
}

// AFTER: Guarded with expectsJson()
public function register(): void
{
    $this->renderable(function (AuthenticationException $e, Request $request) {
        if (!$request->expectsJson()) {
            return null; // let Laravel handle web requests
        }
        return response()->json(['error' => 'Unauthenticated'], 401); // ✅ only for API
    });
}
```

---

### AP-GHC-03: No Fallback Handler

**Description**: The exception handler has specific renderable callbacks for known exception types but no catch-all `Throwable` fallback. Unhandled exceptions (from new packages, PHP engine errors, unknown scenarios) fall through to the default Laravel/Symfony error page — which may expose internals for API requests.

**Root Cause**: The developer believes their specific mappings cover everything. Edge cases and new exception types are not anticipated.

**Impact**:
- Unhandled exceptions produce HTML Whoops pages for API requests
- Internal details leak to API clients for unmapped exceptions
- Error response format is not guaranteed to always be JSON
- No trace_id is generated for unhandled exceptions

**Detection**:
- Code review: no `renderable(function (Throwable $e, Request $request) { ... })` as the last callback
- Bug reports: occasional HTML error pages from the API for new endpoints
- Logs: "Symfony\Component\HttpKernel\Exception\...FatalThrowableError" in production logs

**Solution**:
- Register a `Throwable` fallback as the very last renderable callback
- The fallback returns a safe generic error envelope with trace_id
- Log the full exception before returning the generic response
- Wrap the fallback in try-catch for error-during-error-handling

**Example**:
```php
// BEFORE: No fallback
public function register(): void
{
    $this->renderable(fn(AuthenticationException $e, Request $r) => /* ... */);
    $this->renderable(fn(ValidationException $e, Request $r) => /* ... */);
    // ❌ No Throwable handler — unmapped exceptions produce HTML
}

// AFTER: Throwable fallback as last callback
public function register(): void
{
    $this->renderable(fn(AuthenticationException $e, Request $r) => /* ... */);
    $this->renderable(fn(ValidationException $e, Request $r) => /* ... */);
    // ...
    $this->renderable(function (Throwable $e, Request $request) { // ✅ LAST
        if (!$request->expectsJson()) return null;
        Log::critical('Unhandled exception', ['exception' => $e]);
        return response()->json(
            new ErrorEnvelope('SYSTEM.INTERNAL_ERROR', 'An internal error occurred.', 500, [
                'trace_id' => Str::uuid()->toString(),
            ]),
            500,
        );
    });
}
```
