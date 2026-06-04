# Not Found Error Responses

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-error-handling-design-not-found-error-responses |
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Skill Level | Intermediate |
| Classification | Implementation Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

All resource-not-found scenarios — model lookup failures, missing routes, deleted resources — return a consistent 404 response shape. The response identifies the resource type that was not found without leaking the identifier value, preventing enumeration attacks.

## Core Concepts

- **HTTP 404 Not Found**: Status for any resource that cannot be located.
- **Error Codes**: `RESOURCE.NOT_FOUND` (generic), `USER.NOT_FOUND` (domain-specific), `ROUTE.NOT_FOUND` (invalid paths).
- **Resource Type Identification**: `detail.resource_type` tells the client what kind of resource was requested.
- **No Identifier Leak**: Never echo the searched identifier in the response — prevents enumeration.
- **ModelNotFoundException Handling**: Laravel's `ModelNotFoundException` is caught and mapped to 404 with model type.
- **Soft Delete Check**: Soft-deleted resources return 404 with optional `detail.archived` flag.

## When To Use

- For any API that looks up resources by identifier
- When using Eloquent's `findOrFail()` or route model binding
- For RESTful APIs with resource endpoints
- When preventing resource enumeration is a security concern

## When NOT To Use

- For internal services where enumeration is not a concern
- When the API intentionally exposes resource existence (admin dashboards)
- For search endpoints that return empty results (those return 200 with empty array)

## Best Practices (WHY)

- **Never echo the identifier in the response**: Prevents enumeration attacks — OWASP best practice.
- **Always include resource_type in detail**: Clients need context-appropriate UI for missing resources.
- **Use domain-specific error codes per model**: Enables client branching (user vs order not found).
- **Use generic message**: "The requested resource was not found." — no identifier exposure.
- **Be consistent with 404 vs 403 strategy**: Choose one strategy per resource type and apply consistently.
- **Use `findOrFail()` consistently**: Avoids manual 404 handling that can be inconsistent.
- **For soft-deleted resources**: Return 404 with `detail.archived: true` only if authorized.

## Architecture Guidelines

- Map `ModelNotFoundException` with model-based code selection using `class_basename()`.
- Map `NotFoundHttpException` separately for invalid routes returning `ROUTE.NOT_FOUND`.
- Return generic fallback `RESOURCE.NOT_FOUND` for unrecognised models.
- Distinguish model from route 404s in the handler.
- Log 404s with URL, model type, and identifier for debugging (but never in response).
- Monitor 4xx rates — a surge in 404s often indicates scanning or a broken client.

## Performance Considerations

- Exception handler is trivially fast.
- Model class name extraction is a single `class_basename()` call.
- No database queries in the error path.

## Security Considerations

- Never include the searched ID/slug in the response body or message.
- Be careful with `resource_type` — public APIs may want to omit it (prevents enumeration).
- For private/internal APIs, `resource_type` in detail aids debugging.
- Ensure consistent 404 responses for both missing models and missing routes.
- Soft-delete leak: returning different responses for active vs soft-deleted resources enables enumeration.
- Timing differences can reveal existence even without identifier in response.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Returning 403 instead of 404 | Hiding resource existence | Security concern taken too far | Confuses legitimate clients | Choose one strategy and apply consistently |
| Including ID in response | `User #42 not found` | Helpful intent | Enables resource enumeration | Use generic message without identifier |
| Stack traces in 404 | SQL query shown in response | No handler customisation | Information disclosure | Always return safe envelope |
| Using `find()` instead of `findOrFail()` | Manual 404 handling | Avoiding exceptions | Inconsistent 404 handling | Always use `findOrFail()` |
| Inconsistent hiding strategy | Some resources return 403, others 404 | Per-endpoint decisions | Attackers can map existence by testing both codes | Document and enforce per-resource strategy |
| Revealing model type to unauthorized users | `resource_type: "AdminPayment"` | Overly detailed response | Reveals existence of privileged resources | Filter resource_type based on auth context |

## Anti-Patterns

- **Returning 200 with null data**: `{ data: null }` instead of 404 — breaks HTTP semantics.
- **Different 404 shapes per endpoint**: Some return `{ error }`, others return plain text "Not Found".
- **Including the searched value in trace/debug**: Even in dev mode, don't echo identifiers.
- **Redirecting to a different endpoint on 404**: The response should be final, not a redirect.
- **Returning 410 Gone for soft-deleted resources**: Premature — use 404 with `archived` flag.

## Examples

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

## Related Topics

- Conflict Error Responses (distinct from not-found semantics)
- Standardized Error Envelope
- Exception-to-Code Mapping (mapping ModelNotFoundException)
- Laravel Route Model Binding
- Authentication Error Responses (401 vs 404 hiding strategy)

## AI Agent Notes

- Never include the searched identifier in any 404 response field.
- Always use model-based error codes for domain-specific 404 handling.
- For soft-deleted models, return 404 with `archived` flag only for authorized users.
- When adding a new model, add a corresponding 404 error code and handler mapping.
- For public APIs, consider omitting `resource_type` from 404 details to prevent enumeration.

## Verification

- [ ] All 404 responses use the standard error envelope
- [ ] No searched identifier appears in any 404 response field
- [ ] ModelNotFoundException is mapped with model-based code selection
- [ ] NotFoundHttpException is mapped separately for route 404s
- [ ] Resource type is included in detail (or intentionally excluded for public APIs)
- [ ] Using `findOrFail()` consistently across all model lookups
- [ ] Integration tests verify 404 shape for each model type and for invalid routes
