# Authorization Error Responses

## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Error Handling Design  
**Last Updated:** 2026-06-02

## Executive Summary
All authorization failures — policy denies, role/ permission gaps, ownership mismatches — return a consistent 403 response shape using the standard error envelope. The response communicates what resource or action was denied, optionally why, without leaking details that could aid privilege escalation.

## Core Concepts
- **HTTP 403 Forbidden**: Status for identified-but-not-permitted.
- **Error Codes**: `USER.AUTH_FORBIDDEN` (generic), `USER.AUTH_INSUFFICIENT_ROLE` (specific), `RESOURCE.ACCESS_DENIED` (resource-specific).
- **Policy Identification**: The error detail may include the policy name that denied the request (safe information).
- **No Resource Leak**: Never confirm the existence of a resource when denying access to it (use 404 instead in some cases).

## Mental Models
403 is the museum guard saying "I can see your ID, but this exhibit is staff only." The error code tells you whether you need a different badge (role) or you're in the wrong building entirely.

## Internal Mechanics
1. Laravel `Gate` or `Policy` denies authorization.
2. `AuthorizationException` is thrown with a message, optional policy, and optional user.
3. Handler catches, determines the denied policy, and builds the response.

```php
public function renderAuthorizationError(AuthorizationException $e, Request $request): JsonResponse
{
    $policy = $e->ability(); // e.g., 'update-post'
    $code = $this->isMissingRole($policy)
        ? ErrorCodes::USER_AUTH_INSUFFICIENT_ROLE
        : ErrorCodes::USER_AUTH_FORBIDDEN;

    return response()->json(
        new ErrorEnvelope(
            code: $code,
            message: 'You do not have permission to perform this action.',
            status: 403,
            detail: ['required_permission' => $policy],
        ),
        403,
    );
}
```

## Patterns
- **Policy-Aware Detail**: Include the required permission/role in `detail.required_permission` without listing user's current permissions.
- **Generic Message**: "You do not have permission to perform this action." — never reveal what permission is missing in the message.
- **Resource Ownership Denial**: When a user does not own a resource, use 403 with `RESOURCE.ACCESS_DENIED` (not 404).
- **Role/Scope Denial**: Distinguished code `USER.AUTH_INSUFFICIENT_ROLE` for role vs ownership.

## Architectural Decisions
| Decision | Choice | Rationale |
|---|---|---|
| 403 vs 404 for hidden resources | 403 explicitly | 404 would lie about existence; 403 is honest |
| Message detail | Generic; policy in detail object | Safe for client; useful for debugging |
| Distinction | Ownership vs role vs permission | Different client handling (upgrade plan vs request access) |

## Tradeoffs
| Tradeoff | Option A | Option B | Chosen |
|---|---|---|---|
| Tell denied action | Include policy name in detail | Omit entirely | Include — helps client support dialogs |
| Message detail | Exact reason | Opaque | Opaque message + machine-readable detail |
| Same code for all | One `FORBIDDEN` code | Multiple codes | Multiple — enables branching |

## Performance Considerations
- Gate check already ran and threw; no additional overhead.
- Response construction is a single object allocation.

## Production Considerations
- Log authorization failures with user ID, policy, and resource ID for audit trail.
- Alert on repeated authorization failures by the same user (insider threat indicator).
- Never log the user's permission set in the error response.
- GDPR: auth failure logs are personal data; apply retention policies.

## Common Mistakes
- Returning 401 instead of 403 for authenticated-but-denied users.
- Hiding all 403s as 404s ("security by obscurity") — confuses legitimate clients.
- Including the user's current roles in the response (leak).
- Including the denied resource's ID in the message for anonymous endpoints (user enumeration).

## Failure Modes
- **403 Revealing Existence**: If some endpoints return 403 and others 404 for the same resource type, attackers can map existence. Mitigation: be consistent across the entire API.
- **Overly Specific Detail**: `required_permission: 'posts.update.others'` tells attacker exactly which gate to attempt. Mitigation: prefer role-level over permission-level detail.
- **AuthorizationException Unmapped**: Falls through to generic 500. Mitigation: always map `AuthorizationException` in the handler.

## Ecosystem Usage
- **Laravel**: `AuthorizationException` thrown by `Gate::authorize()` and `$this->authorize()`.
- **Spatie Laravel Permission**: Throws `UnauthorizedException` — must be mapped separately.
- **OpenAPI**: `403` response documented with `ErrorEnvelope` schema.
- **AWS IAM**: Returns `AccessDeniedException` with requested action and resource.

## Related Knowledge Units
### Prerequisites
- KU-07 Authentication Error Responses (understand 401/403 boundary)

### Related Topics
- Laravel Gates and Policies
- Role-Based Access Control (RBAC) design

### Advanced Follow-up Topics
- Dynamic permission evaluation — row-level security error responses (Phase 4).

## Research Notes
### Source Analysis
GitHub API returns 403 with `documentation_url` and `message: "Resource not accessible by integration"`. Stripe returns 403 with `error.type: "permission_error"`. Pattern balances client utility with security.

### Key Insight
**Never let the client distinguish "resource doesn't exist" from "resource exists but you can't see it" via error codes alone.** If you use different codes, attackers can enumerate resources. Choose one strategy (always 403 or always 404) per resource type.

### Version-Specific Notes
- Laravel 9+ `AuthorizationException` includes `response()` method — can return custom response directly.
- Spatie's `UnauthorizedException` is not caught by default Laravel handler — must be registered in Phase 3.
