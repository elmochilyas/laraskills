# ECC Standardized Knowledge — Authorization Failure Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Authorization Failure Testing |
| Difficulty | Intermediate |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

Authorization failure tests verify that authenticated users without required permissions receive 403 Forbidden responses. Tests cover role-based access, ownership-based access, policy-gated actions, and model-scoped permissions. Every endpoint with `authorize()`, `Gate`, or policy must prove it denies unauthorized users. Testing denial is the only way to catch missing policy bugs where Gate defaults to allow-all.

## Core Concepts

- **Two-user pattern**: One user with permission (should succeed), one without (should 403).
- **Ownership tests**: User A cannot modify user B's resource.
- **Policy method coverage**: Each policy method (view, create, update, delete, restore, forceDelete) needs a 403 test.
- **Default error body**: `{"message": "This action is unauthorized."}`.
- **assertStatus(403)**: Primary assertion for authorization failures.
- **Gate::before caveat**: Admin bypass via `Gate::before` means admin users never 403.

## When To Use

- Any endpoint with authorization logic (Gates, Policies, `authorize()`)
- APIs with role-based or ownership-based access control
- Multi-tenant APIs where users access only their data

## When NOT To Use

- Authentication failures (401) — separate KU
- General happy path success testing
- Unit tests on policy classes (feature tests verify routing + policy integration)

## Best Practices

- **Two-user setup**: Create two users with different roles/permissions. Positive-negative assertion pairs.
- **Assert database state unchanged**: After denied update, verify resource hasn't changed.
- **Test every policy method**: Each method (view, create, update, delete) needs a corresponding 403 test.
- **Use PestPHP dataset for roles**: Define roles dataset and iterate permission tests.
- **Test ownership explicitly**: User editing another user's resource must 403.

## Architecture Guidelines

- Separate auth-failure (401) from auth-failure (403) testing — they test different concerns.
- Feature-level authZ tests verify controller-to-policy routing, not just policy logic.
- Every policy method must be tested for denial. Enforce via architecture tests.
- Never expose why authorization failed (which gate denied) in 403 response.

## Performance Considerations

- AuthZ tests require multiple database records (two users, resources owned by each).
- Use `beforeEach` to create user + resource once per class; avoid recreating in every method.
- Use PestPHP higher-order message for shared setups.

## Security Considerations

- 403 responses must never reveal which specific permission was missing.
- Log authZ failures at warning level — often indicate probing or permission misconfiguration.
- Global `Gate::before` bypasses all specific policies for admin — test with non-admin users.

## Common Mistakes

- Testing authorization with same user (both acting and owning) — never triggers denial.
- Asserting only 403 without checking response body.
- Forgetting ownership-based authorization tests.
- Using `actingAs($user)` but route loads resource user doesn't own — test passes for wrong reason.

## Anti-Patterns

- **Missing policy tests**: Endpoint uses `authorize()` but no policy registered — Gate allows by default.
- **Wrong policy method tested**: Controller calls `authorize('update', $post)` but policy only defines `updateMany()`.
- **Admin bypass masking**: Tests use admin users who bypass all policies via `Gate::before`.

## Examples

- Role test: `$this->actingAs($admin)->post('/api/posts', [...])->assertCreated(); $this->actingAs($user)->post('/api/posts', [...])->assertForbidden();`.
- Ownership test: `$this->actingAs($otherUser)->put("/api/posts/{$post->id}", [...])->assertForbidden(); $this->assertDatabaseHas('posts', ['title' => $post->title]);`.

## Related Topics

- **Prerequisites**: Laravel Authorization (Gates, Policies), Feature Test Structure, Authentication Failure Testing
- **Closely Related**: Error Response Shape Testing, Happy Path Testing
- **Advanced**: Multi-tenant authorization testing, Dynamic policy resolution testing, Test-time policy override patterns

## AI Agent Notes

When testing authorization failures: use two-user positive-negative pattern, test every policy method, assert DB state unchanged on denial, test ownership scenarios explicitly, never expose denied permission details in response, test with non-admin users to avoid Gate::before bypass.

## Verification

Sources: `Illuminate\Auth\Access\Gate`, Laravel Policy auto-discovery, `Illuminate\Auth\Access\AuthorizationException`, domain-analysis.md.
