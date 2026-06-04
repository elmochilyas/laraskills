# ECC Standardized Knowledge — Policy Design for APIs

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Authentication & Authorization |
| Knowledge Unit | Policy Design for APIs |
| Difficulty | Intermediate |
| Category | Authorization |
| Last Updated | 2026-06-02 |

## Overview

Laravel Policies provide a centralized authorization layer determining whether a user can perform a specific action on a specific resource instance. For APIs, policies operate after token authentication, forming the second authorization layer: token abilities gate feature access, policies gate instance-level permissions. This separation prevents authorization logic from leaking into controllers and enables unit-testable, reusable permission rules.

## Core Concepts

- **Policy class**: One per resource model (`PostPolicy`, `CommentPolicy`). Methods map to actions (`view`, `create`, `update`, `delete`).
- **User + Model parameters**: Policy methods receive the authenticated user and the target model instance. `viewAny` and `create` receive only the user.
- **Auto-discovery**: Laravel resolves `App\Models\Post` → `App\Policies\PostPolicy` by convention. Explicit registration via `Gate::policy()` for non-standard names.
- **Abilities + Policies**: Abilities check feature-level access (middleware); policies check instance-level access (controller). Both must pass.

## When To Use

- Every non-trivial authorization check (ownership, role-based, attribute-based)
- Resources with instance-level access rules (user can edit own posts but not others')
- Team/collaboration features (shared resource access)
- Admin override patterns (admins can do everything)
- API endpoints where the authenticated entity may not be the resource owner

## When NOT To Use

- Simple CRUD where all authenticated users have equal access (use token abilities only)
- Public endpoints with no authorization (no auth required)
- System-level permissions better handled by middleware (IP whitelisting, feature flags)
- When using simple `is_admin` boolean checks on the user model exclusively

## Best Practices

- **All authorization in policies, never in controllers**: Controllers call `$this->authorize()` and delegate to policies.
- **Admin override pattern**: Check admin first in each method: `if ($user->isAdmin()) return true;`.
- **Register policies explicitly**: Use `Gate::policy()` in `AppServiceProvider` if auto-discovery is disabled.
- **Custom 403 responses**: Format 403 to match API error structure. Include resource type and action for debugging.
- **Log denied attempts**: Record user ID, resource type, action, and IP for security auditing.
- **Eager load policy dependencies**: Avoid N+1 queries within policy checks (`$post->team->owner_id`).

## Architecture Guidelines

- All policies in `app/Policies/`. Use subdirectories for large applications (`app/Policies/Api/V1/`).
- Policy methods return boolean. Throw `AuthorizationException` for custom error messages.
- For listing endpoints, use `viewAny` for collection access and filter results via query scopes rather than checking each item.
- Rate limiting is checked before policies — 429 responses skip authorization entirely.
- Soft delete models require `restore` and `forceDelete` policy methods.

## Performance Considerations

- Policy resolution is cached per request. No repeated autoloading.
- Policy methods querying the database add queries. Ensure foreign key indexes.
- Eager load relations used in policy checks to prevent N+1.
- Avoid checking per-item policies in collection endpoints — use `viewAny` + query scopes.
- Cache expensive policy checks (external API calls, computed values) with user + resource key.

## Security Considerations

- **AuthorizationException messages**: Do not expose denial reasons in production. Use generic "Forbidden" messages.
- **Guest user handling**: Policy methods may receive null for guest users. Check `Auth::check()` before `$user->id`.
- **Race condition**: Post owner changes between policy check and update. Use database foreign keys as safety net.
- **Admin override safety**: Test admin overrides explicitly. Avoid catch-all `return true` without conditions.

## Common Mistakes

- **Authorization logic in controllers**: Leads to duplication when the same check is needed across multiple endpoints.
- **Not implementing all methods**: Missing `restore`/`forceDelete` defaults to false for soft-delete resources.
- **`viewAny` vs `view` confusion**: `viewAny` for index routes (collection), `view` for show routes (instance).
- **Forgetting auto-discovery depends on model namespace**: Custom model namespaces need explicit policy registration.
- **No tests for policy edge cases**: Must test owner, non-owner, admin, and guest scenarios.

## Anti-Patterns

- **Catch-all `return true` in admin checks**: Without explicit conditions, admin gains unintended access to all actions.
- **`$post->user_id === $user->id` without null check**: If the model's user_id is null, comparison fails silently.
- **Throwing exceptions instead of returning boolean**: Exceptions break control flow; boolean returns allow graceful handling.

## Examples

- PostPolicy: `viewAny($user)` returns true for all authenticated users; `update($user, $post)` returns `$user->id === $post->user_id || $user->isAdmin()`.

## Related Topics

- **Prerequisites**: Laravel authorization (Gates, Policies), Sanctum token authentication
- **Closely Related**: Token Ability Design, API-Specific Middleware
- **Advanced**: ABAC implementation, dynamic policy resolution for multi-tenant systems
- **Cross-Domain**: Laravel Core Application Engineering

## AI Agent Notes

When generating policy code: place all authorization logic in dedicated Policy classes, call `$this->authorize()` from controllers, implement admin override returns, never expose denial reasons in production responses, and test owner/non-owner/admin/guest scenarios.

## Verification

Sources: `Illuminate\Auth\Access\Gate`, `AuthorizesRequests` trait, Laravel documentation, domain-analysis.md.
