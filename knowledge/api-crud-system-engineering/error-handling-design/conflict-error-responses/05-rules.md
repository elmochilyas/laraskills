# Phase 5: Rules — Conflict Error Responses

## Rule: Use HTTP 409 for Semantic Conflicts, 422 for Validation Errors
---
## Category
Architecture | Framework Usage
---
## Rule
Always return HTTP 409 for resource state conflicts (duplicate, stale version, invalid transition); reserve HTTP 422 for malformed input that fails validation rules.
---
## Reason
409 signals "the request conflicts with current server state"; 422 signals "the request body is malformed." Clients treat these differently — 422 means fix input, 409 means resolve state conflict.
---
## Bad Example
```php
// Validation-style 422 for a duplicate resource
abort(422, 'Email already exists.');
```
---
## Good Example
```php
// 409 for the duplicate; 422 stays for validation
throw new DuplicateResourceException('User', 'email');
// Returns 409
```
---
## Exceptions
Idempotent operations (PUT) where duplicates are safely handled; return 200 with existing resource, not 409.
---
## Consequences Of Violation
Clients cannot distinguish state conflicts from input errors; automated retry logic incorrectly re-submits the same input instead of resolving the conflict.

---

## Rule: Never Include the Duplicate Value in Conflict Responses
---
## Category
Security
---
## Rule
Always exclude the submitted value that caused a duplicate conflict from the 409 response; only include the field name.
---
## Reason
Echoing the duplicate value (email, username, phone number) enables enumeration attacks — attackers can test if specific values exist in the system.
---
## Bad Example
```php
'detail' => [
    'conflict' => [
        'reason' => 'duplicate',
        'field' => 'email',
        'value' => 'user@example.com', // LEAKS searched value
    ],
]
```
---
## Good Example
```php
'detail' => [
    'conflict' => [
        'reason' => 'duplicate',
        'field' => 'email',
        // value is NEVER included
    ],
]
```
---
## Exceptions
Internal admin endpoints where all users are trusted and enumeration is not a concern.
---
## Consequences Of Violation
Resource enumeration vulnerability; attackers can confirm existence of specific emails, usernames, or phone numbers.

---

## Rule: Distinguish Conflict Types with Separate Error Codes
---
## Category
Maintainability | Design
---
## Rule
Always define separate error codes for each conflict type — duplicate resource, stale version, and invalid state transition — never use a single `CONFLICT` code for all.
---
## Reason
Each conflict type has a different client remedy — duplicate means choose different value, stale means refresh and retry, state conflict means check valid transitions.
---
## Bad Example
```php
const RESOURCE_CONFLICT = 'RESOURCE.CONFLICT';
// Used for duplicate, stale version, and invalid state
```
---
## Good Example
```php
const RESOURCE_DUPLICATE = 'RESOURCE.DUPLICATE';
const RESOURCE_STALE_VERSION = 'RESOURCE.STALE_VERSION';
const RESOURCE_STATE_CONFLICT = 'RESOURCE.STATE_CONFLICT';
```
---
## Exceptions
The application has only one conflict scenario possible (e.g., only duplicates can occur).
---
## Consequences Of Violation
Clients cannot determine the correct remediation strategy; automated conflict resolution logic breaks.

---

## Rule: Include Expected Version or Valid Transitions in Optimistic Locking Conflicts
---
## Category
Design | Maintainability
---
## Rule
Always include the expected current version in the `detail.conflict.expected` field when returning 409 for optimistic locking failures; include valid state transitions for state conflicts.
---
## Reason
Clients need the expected version to include in their retry request or the valid transitions to fix their state — without this information, the conflict is unresolvable.
---
## Bad Example
```php
'detail' => [
    'conflict' => ['reason' => 'stale_version'],
    // No expected version — client cannot retry
]
```
---
## Good Example
```php
'detail' => [
    'conflict' => [
        'reason' => 'stale_version',
        'field' => 'version',
        'expected' => 42,
    ],
]
```
---
## Exceptions
No common exceptions — resolution info is always required for actionable conflict responses.
---
## Consequences Of Violation
Clients cannot resolve conflicts; repeated retries with the same stale version; infinite conflict loops.

---

## Rule: Map Database Unique Constraint Violations to 409
---
## Category
Framework Usage | Reliability
---
## Rule
Always map `QueryException` with SQLSTATE `23000` (integrity constraint violation) to a 409 conflict response with the duplicate resource code; never let it fall through to 500.
---
## Reason
Unique constraint violations are expected operational errors, not server failures; returning 500 for them creates unnecessary monitoring noise and confuses clients.
---
## Bad Example
```php
// QueryException falls through to 500
$this->renderable(function (Throwable $e, $request) {
    return $this->renderServerError($e, $request); // 500
});
```
---
## Good Example
```php
$this->renderable(function (QueryException $e, Request $request) {
    if ($e->getSqlState() === '23000') {
        return response()->json(
            new ErrorEnvelope(ErrorCodes::RESOURCE_DUPLICATE, 'A resource with this value already exists.', 409),
            409,
        );
    }
    return null; // let other QueryExceptions fall through
});
```
---
## Exceptions
No common exceptions — all DB constraint violations must map to 409.
---
## Consequences Of Violation
Duplicate resource creation returns 500 status; false-positive P1/P2 alerts; clients implement incorrect retry logic.

---

## Rule: Use Distinct Exception Subclasses for Each Conflict Type
---
## Category
Code Organization | Maintainability
---
## Rule
Always define separate exception classes extending a base `ConflictException` for each conflict type: `DuplicateResourceException`, `StaleVersionException`, `InvalidStateTransitionException`.
---
## Reason
Each conflict type carries different structured detail fields; separate classes enforce the correct detail shape at compile time via typed constructors.
---
## Bad Example
```php
// Single exception with a string type discriminator
throw new ConflictException('duplicate', $field);
// Hard to enforce different detail shapes
```
---
## Good Example
```php
class DuplicateResourceException extends ConflictException
{
    public function __construct(string $field)
    {
        parent::__construct(
            code: ErrorCodes::RESOURCE_DUPLICATE,
            message: 'A resource with this value already exists.',
            status: 409,
            detail: ['conflict' => ['reason' => 'duplicate', 'field' => $field]],
        );
    }
}
```
---
## Exceptions
The application only has one conflict scenario; a single exception class suffices.
---
## Consequences Of Violation
Runtime type discrimination errors; inconsistent conflict detail shapes; harder to test and maintain.

---

## Rule: Provide Resolution Info for State Conflicts
---
## Category
Design | Maintainability
---
## Rule
Always include `detail.conflict.valid_transitions` in 409 responses for invalid state transitions, listing the allowed next states from the current state.
---
## Reason
Clients debugging invalid workflow transitions need to know which transitions are allowed; guessing wastes client developer time and generates support tickets.
---
## Bad Example
```php
'detail' => [
    'conflict' => ['reason' => 'state_conflict'],
    // No valid transitions — client cannot fix
]
```
---
## Good Example
```php
'detail' => [
    'conflict' => [
        'reason' => 'state_conflict',
        'current_state' => 'cancelled',
        'valid_transitions' => ['refunded'],
    ],
]
```
---
## Exceptions
Revealing valid transitions would expose business logic that is a competitive secret.
---
## Consequences Of Violation
Increased support burden; clients unable to implement correct workflow; repeated failed requests.

---

## Rule: Never Use 409 for Rate Limiting
---
## Category
Architecture | Framework Usage
---
## Rule
Always use HTTP 429 (Too Many Requests) for rate limit violations; never use 409 (Conflict) for rate limiting.
---
## Reason
409 means "request conflicts with current resource state"; 429 means "too many requests." Using 409 for rate limiting breaks client middleware that handles 429 with back-off.
---
## Bad Example
```php
abort(409, 'Too many requests. Slow down.');
```
---
## Good Example
```php
// ThrottleRequestsException returns 429 automatically
// Or explicit:
abort(429, 'Too many requests.');
```
---
## Exceptions
No common exceptions — 429 is the only correct status for rate limiting.
---
## Consequences Of Violation
Client rate-limiting middleware does not trigger back-off; duplicate conflict monitoring and rate limit monitoring are conflated.

---

## Rule: Always Log the Conflicting Value Internally (Never in Response)
---
## Category
Security | Maintainability
---
## Rule
Always log the conflicting value and field internally for debugging purposes; never include the value in any response field.
---
## Reason
Developers need the conflicting value for debugging duplicate issues; but exposing it in the response enables enumeration attacks.
---
## Bad Example
```php
// Value logged nowhere — hard to debug
// Or value returned in response — security leak
```
---
## Good Example
```php
// Log internally for debugging
Log::info('Duplicate resource prevented', [
    'field' => 'email',
    'value_hash' => hash('sha256', $submittedEmail), // hashed, not raw
    'resource_type' => 'User',
    'ip' => $request->ip(),
]);
// Response includes only field name
```
---
## Exceptions
No common exceptions — values must never appear in responses.
---
## Consequences Of Violation
Either debugging capability is lost (no internal log) or a security vulnerability is introduced (value in response).
