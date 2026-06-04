# Conflict Error Responses

## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Error Handling Design  
**Last Updated:** 2026-06-02

## Executive Summary
All conflict scenarios — duplicate resource creation, stale data updates (optimistic locking), state transition violations — return a consistent 409 response shape. The response communicates what conflicted and optionally the expected current state so the client can resolve the conflict without guessing.

## Core Concepts
- **HTTP 409 Conflict**: Status for any request that conflicts with the current server state.
- **Error Codes**: `RESOURCE.DUPLICATE` (unique constraint violation), `RESOURCE.STALE_VERSION` (optimistic lock), `RESOURCE.STATE_CONFLICT` (invalid transition).
- **Conflict Detail**: `detail.conflict.reason` explains the conflict type; `detail.conflict.expected` shows the expected current value.
- **Duplicate Identification**: For duplicates, `detail.conflict.duplicate_field` identifies which field caused the conflict.
- **Optimistic Locking**: For stale versions, `detail.conflict.current_version` or `detail.conflict.expected_version` tells the client what value to send next time.

## Mental Models
409 is the "stale browser" problem: you're editing a wiki page, someone else saved version 5, you're trying to save version 4. The server tells you "sorry, you're working on an old copy — here's the latest version number."

## Internal Mechanics
1. Application code detects a conflict (duplicate email, stale `updated_at`, status transition).
2. A `ConflictException` (custom) is thrown with context about the conflict.
3. Handler catches, reads conflict context, builds the response.

```php
class DuplicateResourceException extends ConflictException
{
    public function __construct(
        string $resourceType,
        string $duplicateField,
        mixed $duplicateValue,
    ) {
        parent::__construct(
            code: ErrorCodes::RESOURCE_DUPLICATE,
            message: 'A resource with this value already exists.',
            status: 409,
            detail: [
                'conflict' => [
                    'reason' => 'duplicate',
                    'field' => $duplicateField,
                    // value NOT included — potential PII leak
                ],
                'resource_type' => $resourceType,
            ],
        );
    }
}
```

## Patterns
- **Base ConflictException**: Extends `ApiException` (see KU-13) with 409 status and conflict shape.
- **Stale Version Handling**: Compare `updated_at` or version column; throw `StaleVersionException` on mismatch.
- **Duplicate Field Identification**: Extract the violating field from the exception context, never the value.
- **State Machine Invariants**: Validate state transitions in a service layer; throw `InvalidStateTransitionException`.

## Architectural Decisions
| Decision | Choice | Rationale |
|---|---|---|
| Duplicate field value in response | Never | Prevents PII leak (email, username in response) |
| Optimistic lock detail | Include expected/current version field | Necessary for client reconciliation |
| Status for duplicates | 409 (not 422) | 422 = validation error; 409 = semantic conflict |

## Tradeoffs
| Tradeoff | Option A | Option B | Chosen |
|---|---|---|---|
| Duplicates: 409 vs 422 | 409 — semantic conflict | 422 — bad request | 409 — more precise semantics |
| Lock detail | Only "stale" flag | Current version/updated_at | Current version — clients need it for retry |
| State conflict detail | Generic "transition not allowed" | Valid transitions list | Valid transitions — helps clients debug |

## Performance Considerations
- Conflict detection is part of business logic, not error handling overhead.
- Optimistic lock check is a single WHERE clause — negligible cost.

## Production Considerations
- Monitor 409 rates: high duplicate rates may indicate a client retry loop.
- Log the duplicate field and value (for debugging) but never in response.
- For optimistic locking, ensure the version column is indexed.
- Alert on state conflict spikes — may indicate a workflow bug.

## Common Mistakes
- Using 422 for all conflicts (validation vs conflict is a semantic distinction).
- Leaking the duplicate value ("Email 'attacker@test.com' already exists" — confirms existence).
- Not distinguishing between duplicate and stale-version conflicts (different client remedies).
- Forgetting to include detailed conflict resolution info in the response.

## Failure Modes
- **Value Enumeration**: If duplicate error confirms value existence, attacker enumerates valid emails. Mitigation: never return the value in 409.
- **Stale Version Race**: Two concurrent requests both get 409; neither succeeds. Mitigation: exponential backoff on client side.
- **Unhandled DB Constraint**: `UniqueConstraintViolationException` from DB layer is not mapped to 409. Mitigation: explicitly map `QueryException` with SQLSTATE 23000.

## Ecosystem Usage
- **Laravel**: `UniqueConstraintViolationException` from DB, `ThrottleRequestsException` (different — 429).
- **Stripe**: `idempotency_error` (409) for duplicate idempotency keys.
- **GitHub**: 409 "Edit conflict" for merge conflicts.
- **OpenAPI**: 409 response documented with conflict detail schema.

## Related Knowledge Units
### Prerequisites
- KU-02 Standardized Error Envelope
- KU-05 Exception-to-Code Mapping

### Related Topics
- KU-09 Not Found Error Responses (complementary 4xx)
- Laravel optimistic locking patterns

### Advanced Follow-up Topics
- Distributed conflict resolution (CQRS/Event Sourcing conflicts) in Phase 4.

## Research Notes
### Source Analysis
RFC 7231 defines 409 as "indicates that the request could not be completed due to a conflict with the current state of the target resource." GitHub's merge conflict API and Stripe's idempotency API are primary references.

### Key Insight
The conflict response is the most detail-rich 4xx response because **the client must take corrective action**. Without enough context (which field, expected version), the client cannot resolve the conflict. Balance this against information leakage by never echoing the submitted value.

### Version-Specific Notes
- Laravel 10+ `UniqueConstraintViolationException` extends `QueryException` with SQLSTATE 23000 for duplicate entries.
- MySQL 8+ `ON DUPLICATE KEY` does not throw — use explicit `findOrFail` + insert pattern for conflict detection.
