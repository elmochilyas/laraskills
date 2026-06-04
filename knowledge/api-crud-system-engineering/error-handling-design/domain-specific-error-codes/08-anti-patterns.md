# Anti-Patterns — Domain-Specific Error Codes

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Knowledge Unit | Domain-Specific Error Codes |
| Difficulty | Intermediate |
| Category | Design Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Single Code for All Errors | Critical | High | Code review: `API_ERROR` or `ERROR` for every scenario |
| Codes Embedded in Messages | High | High | Code review: clients parse message strings for error type |
| Dynamic Code Generation | High | Medium | Code review: `ERROR_ . strtoupper($field)` at throw site |
| Frame-Shifting Codes | Critical | Medium | Code review: same code shifts meaning between API versions |
| Codes as Translated Strings | High | Low | Code review: locale-dependent error codes |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Missing Registry | Error codes defined inline as strings at throw sites | No central catalog, duplicates inevitable |
| Reusing Codes Across Scenarios | Same code for validation and auth errors | Clients cannot differentiate error types |
| Overly Specific Codes | `USER_PASSWORD_HASH_MISMATCH_INTERNAL` reveals internals | No client actionability, security risk |
| Numeric Codes | Error code `42` means nothing | Requires lookup table, not self-documenting |

---

## Anti-Pattern Details

### AP-DEC-01: Single Code for All Errors

**Description**: Every API error — validation, auth, not found, server error, conflict — returns the same error code (`API_ERROR`, `ERROR`, or `UNKNOWN`). Clients cannot programmatically determine what went wrong. All error parsing must use message string inspection, which is fragile and locale-dependent.

**Root Cause**: The developer doesn't design error codes at all. Error responses are an afterthought. The code field is seen as "optional metadata" rather than the primary error identifier.

**Impact**:
- Clients cannot implement error-specific recovery logic
- All error branching must use fragile string matching on messages
- Error tracking dashboards cannot distinguish error types
- API consumers must build custom parsing for every language/locale

**Detection**:
- Code review: error envelope has `code: "ERROR"` or `code: "API_ERROR"` for all scenarios
- Code review: no `ErrorCodes` class or enum exists
- Client code: `if (error.message.includes('not found'))` — fragile string matching

**Solution**:
- Design a distinct error code for each error scenario
- Create a central `ErrorCodes` registry with unique, descriptive constants
- Use the code as the primary error identifier — messages are secondary
- Target 20-50 codes per API version

**Example**:
```php
// BEFORE: Single code for all errors
return response()->json([
    'error' => [
        'code' => 'ERROR', // ❌ same for everything
        'message' => $exception->getMessage(),
    ],
], 500);

// AFTER: Distinct codes per scenario
final class ErrorCodes
{
    public const VALIDATION_ERROR = 'VALIDATION_ERROR';
    public const USER_NOT_FOUND = 'USER.NOT_FOUND';
    public const USER_AUTH_INVALID_TOKEN = 'USER.AUTH_INVALID_TOKEN';
    public const ORDER_ALREADY_REFUNDED = 'ORDER.ALREADY_REFUNDED';
    public const SYSTEM_INTERNAL_ERROR = 'SYSTEM.INTERNAL_ERROR';
    // ...
}
```

---

### AP-DEC-02: Dynamic Code Generation

**Description**: Error codes are constructed dynamically at throw time by concatenating strings: `'ERROR_' . strtoupper($model) . '_' . strtoupper($field)`. The resulting codes are unpredictable, not documentable, and cannot be relied upon by clients. A change to variable values changes the error code.

**Root Cause**: The developer wants a "flexible" error system that auto-generates codes from context. They don't realize that error codes are part of the API contract and must be stable.

**Impact**:
- Clients cannot depend on specific codes
- Error reference documentation cannot be generated
- Error tracking cannot group by code (every instance is unique)
- Refactoring variable names changes error codes

**Detection**:
- Code review: error code assigned via string concatenation, interpolation, or dynamic method calls
- Code review: error code contains user input or variable values
- Error tracking: thousands of unique error code values

**Solution**:
- Define all error codes as constants in a central registry
- Every throw references an existing constant — never construct codes dynamically
- If a new scenario needs a code, add it to the registry as a constant

**Example**:
```php
// BEFORE: Dynamic code generation
class ExceptionHandler
{
    protected function resolveCode(Throwable $e): string
    {
        return match (true) {
            $e instanceof ModelNotFoundException =>
                'ERROR_' . strtoupper(class_basename($e->getModel())) . '_NOT_FOUND', // ❌ dynamic
            default => 'ERROR_GENERIC',
        };
    }
}
// Produces: "ERROR_USER_NOT_FOUND", "ERROR_ORDER_NOT_FOUND", etc.
// But these are not documented constants — they just happen to exist.

// AFTER: Static registry constants
final class ErrorCodes
{
    public const USER_NOT_FOUND = 'USER.NOT_FOUND';
    public const ORDER_NOT_FOUND = 'ORDER.NOT_FOUND';
    // Every code is a documented, stable constant
}
```

---

### AP-DEC-03: Frame-Shifting Codes

**Description**: An error code's meaning changes between API versions. In v1, `NOT_FOUND` means "user not found." In v2, the same `NOT_FOUND` code means "order not found." Clients that upgrade from v1 to v2 break because the code they relied on has shifted meaning. This is the error-code equivalent of a silent breaking change.

**Root Cause**: Reusing existing codes instead of creating new ones. The developer feels that `NOT_FOUND` is generic enough for all resources.

**Impact**:
- Client branching logic breaks silently on API version upgrade
- Error tracking aggregates different scenarios under the same code
- API versioning doesn't extend to error codes
- Clients must use version-specific error handling

**Detection**:
- Code review: same error code constant used for different scenarios in different contexts
- Code review: versioned controllers return the same code for different error types
- Client bugs: "upgraded to v2 and my error handling broke"

**Solution**:
- Create a unique code for every distinct error scenario
- Deprecate old codes rather than repurposing them
- New API versions should define new codes for new scenarios
- Never change a code's semantic meaning once published

**Example**:
```php
// BEFORE: Frame-shifting codes across versions
// v1: ERROR_EMAIL_INVALID = "The email format is invalid"
// v2: ERROR_EMAIL_INVALID = "The email is already registered" (meaning changed)

// AFTER: Distinct codes per scenario
final class ErrorCodes
{
    // v1 codes (immutable — never change meaning)
    public const USER_EMAIL_INVALID = 'USER.EMAIL_INVALID';      // format error
    // v2 new codes (never reuse v1 codes differently)
    public const USER_EMAIL_DUPLICATE = 'USER.EMAIL_DUPLICATE';  // conflict error
}
```
