# Conflict Error Responses

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-error-handling-design-conflict-error-responses |
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Skill Level | Intermediate |
| Classification | Implementation Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

All conflict scenarios — duplicate resource creation, stale data updates (optimistic locking), state transition violations — return a consistent 409 response shape. The response communicates what conflicted and optionally the expected current state so the client can resolve the conflict without guessing.

## Core Concepts

- **HTTP 409 Conflict**: Status for any request that conflicts with the current server state.
- **Error Codes**: `RESOURCE.DUPLICATE` (unique constraint), `RESOURCE.STALE_VERSION` (optimistic lock), `RESOURCE.STATE_CONFLICT` (invalid transition).
- **Conflict Detail**: `detail.conflict.reason` explains the type; `detail.conflict.expected` shows expected current value.
- **Duplicate Identification**: `detail.conflict.duplicate_field` identifies the field causing the conflict (not the value).
- **Optimistic Locking**: `detail.conflict.current_version` tells the client what value to send next.

## When To Use

- For any API that creates resources (duplicate detection)
- When implementing optimistic locking (stale version detection)
- For stateful resources with valid transitions (order status, workflow items)
- For idempotency key conflicts (duplicate key with different body)
- For any endpoint where concurrent modification is possible

## When NOT To Use

- For idempotent operations where duplicates are safely handled (PUT)
- When validation (422) is more appropriate than conflict
- For server errors that happen to involve conflicting state (those are 500)
- For rate limiting (use 429, not 409)

## Best Practices (WHY)

- **Use 409 for semantic conflicts, 422 for validation**: 409 = resource state conflict; 422 = malformed input.
- **Never return the duplicate value**: Leaks PII (email, username confirmation).
- **Include version info for optimistic locking**: Clients need the expected version for retry.
- **Provide valid transitions for state conflicts**: Helps clients debug invalid state transitions.
- **Use distinct codes per conflict type**: Duplicate, stale, and state conflict have different client remedies.
- **Monitor 409 rates**: High duplicate rates may indicate client retry loops.
- **Map DB unique constraint violations**: `QueryException` with SQLSTATE 23000 → `RESOURCE.DUPLICATE`.

## Architecture Guidelines

- Define base `ConflictException` extending `ApiException` with 409 status and conflict detail shape.
- Create subclasses: `DuplicateResourceException`, `StaleVersionException`, `InvalidStateTransitionException`.
- Never include the conflicting value in the response — only the field name.
- For optimistic locking, compare `updated_at` or version column before update.
- Validate state transitions in a service layer; throw on invalid transitions.
- Map `UniqueConstraintViolationException` explicitly in the handler.

## Performance Considerations

- Conflict detection is part of business logic, not error handling overhead.
- Optimistic lock check is a single WHERE clause — negligible cost.
- The conflict response generation is identical to any other error response.

## Security Considerations

- Never echo the duplicate value in the response (email, username, phone).
- For optimistic locking, exposing the current version is safe — version is an opaque counter.
- State conflict responses revealing valid transitions help clients but also inform attackers about workflow states.
- Log the conflicting value and field for debugging but exclude from response.
- Ensure 409 does not leak information about other users' resources.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Using 422 for all conflicts | `422 Unprocessable Entity` for semantic conflicts | No understanding of 409 semantics | Client cannot distinguish validation from state conflicts | Use 409 for state/resource conflicts |
| Leaking duplicate value | "Email 'x@y.com' already exists" | Helpful intent | Confirms existence for enumeration | Never return the value; only the field name |
| Not distinguishing conflict types | Same code for duplicate, stale, and state conflict | Single error code | Client cannot determine remedy | Use distinct codes per conflict type |
| No resolution info | Vague "Conflict" with no detail | Minimal error design | Client cannot fix the conflict | Include expected version or valid transitions |
| DB constraint not mapped | `QueryException` with SQLSTATE 23000 not handled | No handler mapping | 500 error for duplicate entry | Map unique constraint violations explicitly |

## Anti-Patterns

- **Returning 409 for all bad requests**: Validation errors should be 422, not 409.
- **Including the conflicting value for "helpfulness"**: Always a security risk.
- **No conflict detail**: Just status 409 with no explanation — client can't resolve.
- **Using 409 for rate limiting**: Rate limits are 429, not 409.
- **Exposing internal IDs or timestamps**: Conflict detail should use public-facing identifiers.

## Examples

```php
class DuplicateResourceException extends ConflictException
{
    public function __construct(
        string $resourceType,
        string $duplicateField,
    ) {
        parent::__construct(
            code: ErrorCodes::RESOURCE_DUPLICATE,
            message: 'A resource with this value already exists.',
            status: 409,
            detail: [
                'conflict' => [
                    'reason' => 'duplicate',
                    'field' => $duplicateField,
                ],
                'resource_type' => $resourceType,
            ],
        );
    }
}
```

## Related Topics

- Standardized Error Envelope
- Exception-to-Code Mapping (mapping QueryException for duplicates)
- Not Found Error Responses (complementary 4xx)
- Validation Error Shape Design (422 vs 409 distinction)
- Idempotency Key Design (idempotency conflicts use 409)

## AI Agent Notes

- Use 409 for semantic conflicts (duplicate, stale, state), not 422 for validation.
- Never include the duplicate value in the response — only the field name.
- For optimistic locking, include the expected version/updated_at in the conflict detail.
- When generating code with unique constraint checks, always throw a `ConflictException` rather than returning 422.
- Map DB-level unique constraint violations to 409 in the exception handler.

## Verification

- [ ] All 409 responses use the standard error envelope with conflict detail
- [ ] No duplicate values (email, username) appear in any 409 response
- [ ] Distinct error codes used for duplicate, stale, and state conflict types
- [ ] Optimistic locking responses include expected version info
- [ ] DB `UniqueConstraintViolationException` is mapped to 409
- [ ] Conflict resolution info (expected value, valid transitions) is included
- [ ] Integration tests verify 409 shape for all conflict scenarios
