# Anti-Patterns — Not Found Error Responses

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Knowledge Unit | Not Found Error Responses |
| Difficulty | Intermediate |
| Category | Implementation Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Returning 200 with Null Data | High | Medium | Code review: `{ data: null }` instead of 404 |
| Including ID in Response | Critical | Medium | Code review: "User #42 not found" message |
| Different 404 Shapes per Endpoint | High | Medium | Code review: some return `{ error }`, others return plain text |
| Using find() Instead of findOrFail() | Medium | High | Code review: manual 404 handling, inconsistent per endpoint |
| Inconsistent 403/404 Strategy | High | Medium | Code review: same resource type returns 403 on one endpoint, 404 on another |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Including the Searched Value in Debug | Even in dev mode, identifier echoed | Information disclosure in development |
| Redirecting on 404 | Response is a redirect, not an error | Breaks HTTP semantics, client must follow redirect |
| Returning 410 Gone for Soft-Deleted | Premature use of 410 | Unnecessary HTTP status complexity |

---

## Anti-Pattern Details

### AP-NFE-01: Returning 200 with Null Data

**Description**: When a resource is not found, the API returns HTTP 200 with `{ data: null }` instead of HTTP 404. The client must inspect the response body to determine that the resource was not found, rather than using the HTTP status code. This breaks HTTP semantics and defeats automated caching, proxy behavior, and client error handling.

**Root Cause**: The developer treats "not found" as a valid response rather than an error condition. They find it simpler to return null data than to throw an exception.

**Impact**:
- Client must check `data === null` rather than `status === 404`
- HTTP caches treat 200 as a valid response and cache null results
- Automated tooling (proxies, API gateways) doesn't see this as an error
- Inconsistent with the rest of the error handling system

**Detection**:
- Code review: controller returns `response()->json(['data' => null])` for missing resources
- Code review: `User::find($id)` (returns null) returned directly without null check
- Client code: `if (response.data === null)` — fragile null checking

**Solution**:
- Always return HTTP 404 for resources that don't exist
- Use `findOrFail()` which throws `ModelNotFoundException`
- Let the exception handler convert the exception to a proper 404 response
- Never return null data as a successful response

**Example**:
```php
// BEFORE: 200 with null data
class UserController
{
    public function show(int $id): JsonResponse
    {
        $user = User::find($id); // returns null if not found
        return response()->json(['data' => $user]); // ❌ 200 with null
    }
}

// AFTER: 404 for not found
class UserController
{
    public function show(int $id): JsonResponse
    {
        $user = User::findOrFail($id); // ✅ throws ModelNotFoundException
        return response()->json(['data' => $user]);
    }
}
```

---

### AP-NFE-02: Including ID in Response

**Description**: The 404 error response includes the searched identifier in the message or detail: `"User #42 not found"` or `detail: { id: 42 }`. This enables attackers to probe for valid identifiers (enumeration). Even for non-sensitive resources, echoing the identifier confirms that the attacker guessed a valid ID format.

**Root Cause**: Helpfulness. "If I tell them exactly what wasn't found, they can fix the request faster."

**Impact**:
- Resource enumeration: attacker can verify which IDs exist
- ID format confirmation: attacker learns the identifier pattern
- Competitive intelligence: for sequential IDs, attacker can estimate user base size
- GDPR: leaking information about whether an identifier exists

**Detection**:
- Code review: 404 message includes variables: `"User {$id} not found"`
- Code review: 404 detail includes `id`, `slug`, or `identifier` field
- Penetration testing: 404 response varies based on identifier value

**Solution**:
- Never echo the searched identifier in any 404 response
- Use generic message: "The requested resource was not found."
- Include `resource_type` (e.g., "User") but never the actual identifier value
- Log the identifier internally for debugging but exclude from response

**Example**:
```php
// BEFORE: ID in response
class UserNotFoundException extends OperationalException
{
    public function __construct(int $userId)
    {
        parent::__construct(
            code: ErrorCodes::USER_NOT_FOUND,
            message: "User #{$userId} not found", // ❌ ID leaked
            status: 404,
        );
    }
}

// AFTER: Generic message
class UserNotFoundException extends OperationalException
{
    public function __construct(int $userId)
    {
        parent::__construct(
            code: ErrorCodes::USER_NOT_FOUND,
            message: 'The requested resource was not found.', // ✅ generic
            status: 404,
            context: ['lookup_id' => $userId], // logged internally only
        );
    }
}
```

---

### AP-NFE-03: Different 404 Shapes per Endpoint

**Description**: Different endpoints return different 404 response shapes. Some return `{ error: { code, message } }`, others return `{ message: "Not Found" }`, others return plain text `"Resource not found"`. Clients must write endpoint-specific parsing for 404 errors.

**Root Cause**: No centralized 404 handling. Each controller handles its own "not found" case with inline responses. No shared error envelope is used.

**Impact**:
- Clients cannot write generic 404 handling
- Inconsistent error shape confuses client developers
- API contract documentation must specify 404 shape per endpoint
- Automated client generation (OpenAPI) produces incorrect models

**Detection**:
- Code review: some controllers return `response()->json(['message' => 'Not Found'], 404)`
- Code review: some controllers return `response()->json(['error' => 'Not found'], 404)`
- Code review: no centralized `ModelNotFoundException` handler
- Client issues: "404 parsing works for endpoint A but breaks on endpoint B"

**Solution**:
- Use centralized 404 handling in the exception handler
- Map `ModelNotFoundException` to a single consistent envelope
- If same endpoint uses `findOrFail()`, the handler produces a consistent response
- Remove all inline 404 responses from controllers

**Example**:
```php
// BEFORE: Different shapes per endpoint
class UserController
{
    public function show(int $id): JsonResponse
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404); // ❌ shape A
        }
    }
}
class OrderController
{
    public function show(int $id): JsonResponse
    {
        $order = Order::find($id);
        if (!$order) {
            return response()->json(['error' => 'Not found'], 404); // ❌ shape B
        }
    }
}

// AFTER: Centralized handling in handler
class Handler extends ExceptionHandler
{
    public function register(): void
    {
        $this->renderable(function (ModelNotFoundException $e, Request $request) {
            return $request->expectsJson()
                ? response()->json(
                    new ErrorEnvelope(ErrorCodes::RESOURCE_NOT_FOUND, 'The requested resource was not found.', 404),
                    404,
                )
                : null;
        });
    }
}
```
