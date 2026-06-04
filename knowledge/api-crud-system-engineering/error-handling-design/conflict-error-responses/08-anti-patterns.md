# Anti-Patterns — Conflict Error Responses

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Knowledge Unit | Conflict Error Responses |
| Difficulty | Intermediate |
| Category | Implementation Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Using 422 for All Conflicts | High | High | Code review: 422 returned for duplicate/state conflicts |
| Including the Conflicting Value | Critical | Medium | Code review: duplicate value leaked in error detail |
| Not Distinguishing Conflict Types | Medium | Medium | Code review: same code for duplicate, stale, and state conflict |
| No Conflict Detail | Medium | Medium | Code review: 409 with no explanation |
| Using 409 for Rate Limiting | Medium | Low | Code review: rate limit response returns 409 |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| DB Constraint Not Mapped | `QueryException` SQLSTATE 23000 not handled | 500 error for duplicate entries |
| No Resolution Info | "Conflict" with no expected version or valid transitions | Client cannot fix the conflict |
| Exposing Internal IDs | Conflict detail includes database IDs | Information leak in error responses |

---

## Anti-Pattern Details

### AP-CER-01: Using 422 for All Conflicts

**Description**: Every semantic conflict — duplicate resource, stale version, invalid state transition — returns HTTP 422 Unprocessable Entity instead of 409 Conflict. The client cannot distinguish between "your input is malformed" (422) and "the server state conflicts with your request" (409). Automated retry logic treats both identically.

**Root Cause**: The developer doesn't understand the semantic difference between 422 and 409. 422 feels like a catch-all for "your request is wrong," so all client errors go there.

**Impact**:
- Client cannot distinguish validation errors from state conflicts
- Automated retry for stale version conflicts retries with the same stale data (endless loop)
- Monitoring cannot differentiate validation spam from actual conflicts
- API semantics are ambiguous — breaking HTTP standards

**Detection**:
- Code review: duplicate email, optimistic lock failure, state transition violation all return 422
- Code review: no 409 status code used anywhere in the codebase
- Bug reports: "Retry loop when updating stale data — always gets 422"

**Solution**:
- Use 422 for malformed input (missing fields, invalid format)
- Use 409 for semantic conflicts (duplicate, stale version, invalid state transition)
- Map all conflict scenarios explicitly to 409 in the exception handler
- Document the distinction in the API reference

**Example**:
```php
// BEFORE: 422 for conflicts
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        if (User::where('email', $dto->email)->exists()) {
            return response()->json(['error' => 'Email taken'], 422); // ❌ should be 409
        }
        return User::create($dto->toArray());
    }
}

// AFTER: 409 for conflicts
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        if (User::where('email', $dto->email)->exists()) {
            throw new DuplicateResourceException('User', 'email');
        }
        return User::create($dto->toArray());
    }
}
// Handler maps DuplicateResourceException to 409
```

---

### AP-CER-02: Including the Conflicting Value

**Description**: The 409 error response includes the value that caused the conflict — `"The email 'user@example.com' is already taken."` This enables attackers to probe whether specific values (emails, usernames, phone numbers) are registered. For email addresses, this is a PII leak.

**Root Cause**: Helpfulness. "If I tell the user exactly what value conflicts, they can fix it faster." The security implications of leaking the conflicting value are not considered.

**Impact**:
- User enumeration: attackers can verify if an email is registered
- PII leak: the conflicting value may be sensitive (email, phone, SSN)
- GDPR compliance issue: exposing whether an email is registered
- Competitive intelligence: probing usernames to find registered users

**Detection**:
- Code review: 409 response message or detail includes the submitted value
- Code review: duplicate exception class includes the value in context exposed in response
- Penetration testing: 409 response reveals the conflicting value

**Solution**:
- Never include the conflicting value in the response
- Only include the field name that caused the conflict (`detail.conflict.field`)
- Log the conflicting value internally for debugging but exclude from response
- Use generic messages: "A resource with this value already exists."

**Example**:
```php
// BEFORE: Including the conflicting value
class DuplicateResourceException extends ConflictException
{
    public function __construct(
        string $resourceType,
        string $field,
        mixed $value, // ❌ exposed in response
    ) {
        parent::__construct(
            code: ErrorCodes::RESOURCE_DUPLICATE,
            message: "The {$field} '{$value}' is already taken.", // ❌ value leaked
            status: 409,
        );
    }
}

// AFTER: Only field name, no value
class DuplicateResourceException extends ConflictException
{
    public function __construct(
        string $resourceType,
        string $field,
    ) {
        parent::__construct(
            code: ErrorCodes::RESOURCE_DUPLICATE,
            message: 'A resource with this value already exists.',
            status: 409,
            detail: [
                'conflict' => [
                    'reason' => 'duplicate',
                    'field' => $field, // ✅ field name only
                ],
                'resource_type' => $resourceType,
            ],
        );
    }
}
```
