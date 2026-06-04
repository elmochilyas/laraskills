# Anti-Patterns — Exception-to-Code Mapping

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Knowledge Unit | Exception-to-Code Mapping |
| Difficulty | Advanced |
| Category | Design Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Single Mapping Callable | High | Medium | Code review: giant switch/match statement inspecting all exceptions |
| Mapping via Exception Message Parsing | Critical | Medium | Code review: `str_contains($e->getMessage(), 'duplicate')` |
| No Fallback Mapping | High | Medium | Code review: no Throwable fallback registered |
| Mapping in Controllers Instead of Handler | High | Medium | Code review: try-catch in controller maps exceptions |
| Mapping by Exception Code Integer | Medium | Low | Code review: `$e->getCode()` used for mapping |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Mapping Without Guard Context | `AuthenticationException` mapped generically for all guards | API vs web auth errors get the same code |
| Generic ModelNotFoundException | `NOT_FOUND` without model distinction | Client cannot tell which resource is missing |
| Package Exceptions Not Mapped | New package throws undocumented exceptions | Unmapped exceptions fall through to 500 |
| `Exception::class` as Map Key | Catch-all hiding all error detail | All errors return the same generic code |

---

## Anti-Pattern Details

### AP-ECM-01: Single Mapping Callable

**Description**: The exception handler contains one giant method that inspects every exception using a match expression, switch statement, or if-else chain to determine the error code. The method grows with every new exception type, violating the Open/Closed principle. Adding a new exception requires modifying the mapping method.

**Root Cause**: Centralizing all mapping logic in a single method without using a registry-based or callback-based approach.

**Impact**:
- Single file changes for every new exception type (fragile, merge conflict prone)
- Method grows to 50+ lines with 30+ match arms
- Hard to test: the entire mapping must be exercised for any change
- Cannot extend from packages or modules without modifying core code

**Detection**:
- Code review: `protected function resolveCode(Throwable $e): string` is 50+ lines
- Code review: 30+ `instanceof` checks in one method
- Metrics: exception mapping method has cyclomatic complexity >20

**Solution**:
- Use a registry array mapping FQCN → error code
- Use the `register()` method with separate `renderable()` callbacks per type
- Let each custom exception return its own code via an interface
- Keep the single-method approach only for the fallback

**Example**:
```php
// BEFORE: Single giant mapping method
class Handler extends ExceptionHandler
{
    protected function resolveCode(Throwable $e): string
    {
        return match (true) {
            $e instanceof AuthenticationException => 'USER.AUTH_UNAUTHENTICATED',
            $e instanceof AuthorizationException => 'USER.AUTH_FORBIDDEN',
            $e instanceof ModelNotFoundException => 'RESOURCE.NOT_FOUND',
            $e instanceof ValidationException => 'VALIDATION_ERROR',
            $e instanceof ThrottleRequestsException => 'SYSTEM.RATE_LIMITED',
            $e instanceof QueryException => 'SYSTEM.DATABASE_ERROR',
            // ... 25 more arms
            default => 'SYSTEM.INTERNAL_ERROR',
        };
    }
}

// AFTER: Registry-based mapping + renderable callbacks
class Handler extends ExceptionHandler
{
    protected array $exceptionCodeMap = [
        AuthenticationException::class => 'USER.AUTH_UNAUTHENTICATED',
        AuthorizationException::class => 'USER.AUTH_FORBIDDEN',
        ModelNotFoundException::class => 'RESOURCE.NOT_FOUND',
        // ...
    ];

    public function register(): void
    {
        $this->renderable(function (AuthenticationException $e, Request $request) {
            return $this->renderWithCode($e, $request, ErrorCodes::USER_AUTH_UNAUTHENTICATED);
        });
        // Each exception type gets its own callback (Open for extension)
    }
}
```

---

### AP-ECM-02: No Fallback Mapping

**Description**: The exception handler does not register a `Throwable` fallback renderable. When an exception that doesn't match any specific mapping is thrown, it falls through to the default Laravel/Symfony error page — which may be an HTML Whoops page for API requests. No JSON error response is guaranteed.

**Root Cause**: The developer assumes their specific mappings cover all exceptions. They don't consider third-party packages, PHP engine errors, or future exception types.

**Impact**:
- Unmapped exceptions return HTML Whoops pages for API requests
- Internal details (file paths, stack traces) leak to API clients
- Error response format is inconsistent: some return JSON envelope, others return HTML
- 500 errors for unmapped exceptions give no traceability (no trace_id)

**Detection**:
- Code review: no `renderable(function (Throwable $e, Request $request) { ... })` in `register()`
- Code review: no catch-all `Throwable` handler in the renderable chain
- Bug reports: "I got an HTML error page from the API"
- Logs: exceptions that reach Symfony's handler instead of the custom handler

**Solution**:
- Register a `Throwable` fallback as the LAST renderable callback
- The fallback returns a generic `SYSTEM.INTERNAL_ERROR` with trace_id
- Log the full exception details before returning the generic response
- Wrap the fallback in try-catch for error-during-error-handling protection

**Example**:
```php
// BEFORE: No fallback — unmapped exceptions produce HTML
public function register(): void
{
    $this->renderable(function (AuthenticationException $e, Request $request) { /* ... */ });
    $this->renderable(function (ValidationException $e, Request $request) { /* ... */ });
    // ❌ No Throwable fallback — unhandled exceptions get HTML Whoops page
}

// AFTER: Throwable fallback as last callback
public function register(): void
{
    $this->renderable(function (AuthenticationException $e, Request $request) { /* ... */ });
    $this->renderable(function (ValidationException $e, Request $request) { /* ... */ });
    // ...
    $this->renderable(function (Throwable $e, Request $request) { // ✅ LAST callback
        Log::critical('Unhandled exception', ['exception' => $e]);
        return response()->json(
            new ErrorEnvelope(ErrorCodes::SYSTEM_INTERNAL_ERROR, 'An internal error occurred.', 500, [
                'trace_id' => Str::uuid()->toString(),
            ]),
            500,
        );
    });
}
```

---

### AP-ECM-03: Mapping via Exception Message Parsing

**Description**: The mapper inspects the exception's message string to determine the error code: `str_contains($e->getMessage(), 'Duplicate')` or `preg_match('/SQLSTATE\[23000\]/', $e->getMessage())`. This is fragile because messages change with localization, framework upgrades, and database driver differences.

**Root Cause**: The developer doesn't create distinct exception classes. Since all exceptions are generic `\Exception` or `QueryException`, message parsing is the only way to distinguish them.

**Impact**:
- Localization breaks mapping: if messages are translated, string matching fails
- Framework upgrades break mapping: Laravel changes error message format between versions
- Database driver changes break mapping: MySQL vs PostgreSQL have different SQLSTATE codes
- Tests must hardcode message strings, making them fragile

**Detection**:
- Code review: `str_contains()`, `preg_match()`, or `str_starts_with()` on `$e->getMessage()`
- Code review: matching on SQLSTATE codes or exception message templates
- Bug reports: "The error mapping broke after upgrading Laravel/MySQL"

**Solution**:
- Create distinct exception classes for each error scenario
- Use `instanceof` for mapping, never message strings
- Use exception properties (error code, previous exception type) for sub-type differentiation
- If message parsing is unavoidable due to third-party packages, wrap the package exception in a custom class

**Example**:
```php
// BEFORE: Message parsing
public function resolveCode(Throwable $e): string
{
    $message = $e->getMessage();
    if (str_contains($message, 'Duplicate')) { // ❌ fragile
        return 'RESOURCE.DUPLICATE';
    }
    if (str_contains($message, 'No query results')) { // ❌ fragile
        return 'RESOURCE.NOT_FOUND';
    }
    return 'SYSTEM.INTERNAL_ERROR';
}

// AFTER: instanceof-based mapping
public function register(): void
{
    $this->renderable(function (ModelNotFoundException $e, Request $request) { // ✅ reliable
        return $this->renderNotFound($e, $request);
    });
    $this->renderable(function (QueryException $e, Request $request) {
        if ($e->getPrevious() instanceof UniqueConstraintViolationException) { // ✅ specific sub-type
            return $this->renderDuplicate($e, $request);
        }
        return $this->renderServerError($e, $request);
    });
}
```
