# Authorization Error Responses

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-error-handling-design-authorization-error-responses |
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Skill Level | Intermediate |
| Classification | Implementation Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

All authorization failures — policy denies, role/permission gaps, ownership mismatches — return a consistent 403 response shape using the standard error envelope. The response communicates what resource or action was denied, optionally why, without leaking details that could aid privilege escalation.

## Core Concepts

- **HTTP 403 Forbidden**: Status for identified-but-not-permitted.
- **Error Codes**: `USER.AUTH_FORBIDDEN` (generic), `USER.AUTH_INSUFFICIENT_ROLE` (specific), `RESOURCE.ACCESS_DENIED` (resource-specific).
- **Policy Identification**: Error detail may include the policy name that denied the request.
- **No Resource Leak**: Never confirm the existence of a resource when denying access to it.
- **Ownership vs Role Distinction**: Different error codes for different denial reasons.

## When To Use

- For any API with authentication and resource-level authorization
- When using Laravel Gates and Policies for API authorization
- For multi-role systems with different permission levels
- When implementing RBAC or permission-based access control

## When NOT To Use

- For public APIs with no authorization requirements
- When all users have the same level of access
- For endpoints where 404 (not found) is preferred over 403 for security

## Best Practices (WHY)

- **Use 403, not 401**: 401 = not authenticated; 403 = authenticated but not allowed.
- **Include policy name in detail**: Helps client support dialogs without leaking sensitive data.
- **Use opaque messages + machine-readable detail**: "You do not have permission" + `required_permission` field.
- **Distinguish ownership from role**: Different codes enable different client responses (upgrade plan vs request access).
- **Use 403 explicitly over 404 for known resources**: 404 would lie about existence; 403 is honest.
- **Never include user's current roles in the response**: Information leak.
- **Be consistent across the entire API**: If some endpoints return 403 and others 404 for the same resource, attackers can map existence.

## Architecture Guidelines

- Map `AuthorizationException` with the denied policy/ability name.
- Include `detail.required_permission` without listing user's current permissions.
- Use generic message with specific machine-readable detail codes.
- Log authorization failures with user ID, policy, and resource ID for audit trail.
- Alert on repeated authorization failures by the same user (insider threat indicator).
- Map third-party authorization packages (Spatie Laravel Permission) explicitly.

## Performance Considerations

- Gate check already ran and threw — no additional overhead.
- Response construction is a single object allocation.

## Security Considerations

- Never include the user's current roles or permissions in the response.
- Be careful with `required_permission` detail — it tells attackers which permission to target.
- For hidden resources, consider 404 instead of 403 to avoid confirming existence.
- Log authorization failures with full audit context but exclude permission sets.
- GDPR: auth failure logs contain personal data; apply retention policies.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Returning 401 for denied users | 401 means not authenticated | Confusing auth with authorization | Client thinks credentials are wrong | Use 403 for authenticated-but-denied |
| Hiding all 403s as 404s | Security by obscurity for all endpoints | Fear of information leak | Confuses legitimate clients | Use 403 explicitly; use 404 only for truly hidden resources |
| Including user's current roles | "You have role 'viewer', need 'editor'" | Helpful intent | Permission enumeration vulnerability | Only show what's required, not what's missing |
| Overly specific detail | `required_permission: 'posts.update.others'` | Too much granularity | Tells attacker which gate to target | Prefer role-level over permission-level detail |
| AuthorizationException unmapped | Falls through to generic 500 | No explicit mapping in handler | 500 error for auth failure | Always map AuthorizationException |

## Anti-Patterns

- **Inconsistent 403/404 strategy**: Same resource sometimes returns 403, sometimes 404.
- **Exposing permission hierarchy**: Listing all roles and their capabilities in error responses.
- **Message-based permission hints**: "You need the admin role" in the message string.
- **Returning 403 for missing CSRF tokens**: CSRF is authentication, not authorization.
- **Catch-all 403 with no detail**: Client has no context about what was denied or why.

## Examples

```php
public function renderAuthorizationError(AuthorizationException $e, Request $request): JsonResponse
{
    $policy = $e->ability();
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

## Related Topics

- Authentication Error Responses (401 vs 403 distinction)
- Standardized Error Envelope
- Laravel Gates and Policies
- Role-Based Access Control (RBAC) design
- Exception-to-Code Mapping

## AI Agent Notes

- Always use 403 (not 401) for authenticated users who lack permission.
- Include the denied policy name in `detail.required_permission` but never include the user's permissions.
- When generating authorization logic, ensure consistent use of 403 vs 404 across the API.
- For Spatie's `UnauthorizedException`, register a separate mapping as it's not caught by default Laravel handler.
- Never generate code that reveals resource existence through differing error responses.

## Verification

- [ ] All 403 responses use the standard error envelope
- [ ] Denial reason (role vs ownership) uses distinct error codes
- [ ] No user roles or permissions are exposed in the response
- [ ] AuthorizationException is explicitly mapped in the handler
- [ ] Spatie's UnauthorizedException (if used) has its own mapping
- [ ] Consistent 403 vs 404 strategy across all endpoints
- [ ] Integration tests verify 403 shape for policy failures, role gaps, and ownership conflicts
