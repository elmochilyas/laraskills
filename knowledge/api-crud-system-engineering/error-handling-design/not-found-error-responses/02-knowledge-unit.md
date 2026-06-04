# Not Found Error Responses

## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Error Handling Design  
**Last Updated:** 2026-06-02

## Executive Summary
All resource-not-found scenarios — model lookup failures, missing routes, deleted resources — return a consistent 404 response shape. The response identifies the resource type that was not found without leaking the identifier value, preventing enumeration attacks.

## Core Concepts
- **HTTP 404 Not Found**: Status for any resource that cannot be located.
- **Error Codes**: `RESOURCE.NOT_FOUND` (generic), `USER.NOT_FOUND` (domain-specific), `ROUTE.NOT_FOUND` (invalid paths).
- **Resource Type Identification**: `detail.resource_type` tells the client what kind of resource was requested (e.g., `User`, `Order`).
- **No Identifier Leak**: Never echo the searched identifier in the response — attackers use this for enumeration.
- **ModelNotFoundException Handling**: Laravel's `ModelNotFoundException` is caught and mapped to 404 with model type.

## Mental Models
404 is an empty room number in a hotel. The guest (client) asked for Room 404, but it doesn't exist. We tell them "that room doesn't exist" but we don't say "Room 404" out loud — someone else might be listening and learn which rooms exist.

## Internal Mechanics
1. `ModelNotFoundException` is thrown when `Model::findOrFail()` fails.
2. `NotFoundHttpException` is thrown when a route is not matched.
3. Handler catches both, reads the model type from the exception, maps to the appropriate code.
4. Response is built with generic message and resource type in detail.

```php
public function renderNotFoundError(ModelNotFoundException $e, Request $request): JsonResponse
{
    $model = class_basename($e->getModel());
    $code = match ($model) {
        'User'  => ErrorCodes::USER_NOT_FOUND,
        'Order' => ErrorCodes::ORDER_NOT_FOUND,
        default => ErrorCodes::RESOURCE_NOT_FOUND,
    };

    return response()->json(
        new ErrorEnvelope(
            code: $code,
            message: 'The requested resource was not found.',
            status: 404,
            detail: ['resource_type' => $model],
        ),
        404,
    );
}
```

## Patterns
- **Model-Based Code Selection**: Switch on model class name to return domain-specific codes.
- **Generic Fallback**: Unrecognised models get `RESOURCE.NOT_FOUND`.
- **Route NotFound**: A separate handler for `NotFoundHttpException` returns `ROUTE.NOT_FOUND`.
- **Soft Delete Check**: If model exists but is soft-deleted, return 404 with `detail.archived: true` (not 410 Gone — premature).

## Architectural Decisions
| Decision | Choice | Rationale |
|---|---|---|
| Identifier in response | Never | Prevents enumeration; OWASP best practice |
| Resource type in response | Always | Clients need to show context-appropriate UI |
| Soft-deleted resources | 404 with archived flag | Indicates recoverability without leaking existence |

## Tradeoffs
| Tradeoff | Option A | Option B | Chosen |
|---|---|---|---|
| Model type detail | Always in detail | Omit entirely | Always — needed for client error handling |
| Message | Generic: "Not found" | Specific: "User not found" | Generic — "The requested resource was not found" |
| Code per model | One code for all 404s | One code per model | One per model — enables client branching |

## Performance Considerations
- Exception handler trivially fast.
- Model class name extraction is a single `class_basename()` call.
- No database queries in error path.

## Production Considerations
- Log 404s with URL, model type, and identifier (for debugging) — but never in the response.
- Monitor 4xx rates: a surge in 404s often indicates scanning or a broken client.
- Whitelist legitimate 404 sources to reduce alert noise.
- Return 404 for intentionally hidden resources (soft-deleted, private) consistently.

## Common Mistakes
- Returning 403 instead of 404 for resources the user shouldn't know exist (inconsistent hiding strategy).
- Including the searched ID/ slug in the response body or message (`User #42 not found`).
- Returning 404 with a stack trace from the SQL query.
- Using `find()` instead of `findOrFail()` and returning a custom 404 manually — inconsistent handling.

## Failure Modes
- **Model/Route Ambiguity**: A URL like `/api/users/1` could be a missing user (model) or missing route. Handler must distinguish.
- **Enumeration via Timing**: Even without identifier in response, timing differences can reveal existence. Mitigation: constant-time checks not required at this API layer.
- **Soft-Delete Leak**: Returning different responses for active vs soft-deleted resources enables enumeration. Mitigation: always return 404 for soft-deleted; include `archived` flag only if authorized.

## Ecosystem Usage
- **Laravel**: `ModelNotFoundException` has `getModel()` and `getIds()`.
- **Laravel**: `NotFoundHttpException` from `Symfony\Component\HttpKernel\Exception`.
- **OpenAPI**: 404 response with `$ref` to `ErrorEnvelope` and `detail.resource_type` documented.
- **JSON:API**: 404 with `status: 404`, `code: "RESOURCE_NOT_FOUND"`, `source.pointer`.

## Related Knowledge Units
### Prerequisites
- KU-02 Standardized Error Envelope
- KU-05 Exception-to-Code Mapping

### Related Topics
- KU-10 Conflict Error Responses (distinct from not-found semantics)
- Laravel route model binding

### Advanced Follow-up Topics
- 410 Gone for permanently removed resources vs 404 (Phase 4).

## Research Notes
### Source Analysis
OWASP guidelines recommend generic 404 messages without identifiers. GitHub API returns 404 with `message: "Not Found"` — no additional detail. Stripe returns 404 with `error.type: "invalid_request_error"` and `error.message: "No such ..."` including the resource type but not the ID.

### Key Insight
The decision to include or exclude resource type in detail is context-dependent. **Public APIs: exclude** (attacker enumeration risk). **Private APIs: include** (debugging value outweighs risk). Default to include for Phase 2 and make configurable.

### Version-Specific Notes
- Laravel 9+ `ModelNotFoundException` carries model class and IDs.
- Laravel 11+ route model binding returns `ModelNotFoundException` automatically.
