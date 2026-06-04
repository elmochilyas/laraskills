# Laravel Gates & Policies

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** access-control-authorization
- **Knowledge Unit:** Laravel Gates & Policies
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Laravel Gates and Policies provide a native, expressive authorization layer that centralizes access control logic outside controllers and routes. This pattern is essential for regulated applications requiring auditable, testable, and maintainable permission models that can scale from simple role checks to complex multi-tenant authorization.

---

## Core Concepts

- **Gates** are Closure-based authorization checks registered in `AuthServiceProvider` for simple, action-level permissions
- **Policies** are dedicated classes organizing authorization logic around a specific Eloquent model or resource
- **The `@can` directive and `can()` method** provide Blade and controller-level authorization checks
- **Policy auto-discovery** automatically resolves policies when models follow Laravel's naming conventions
- **The `Gate::before()` and `Gate::after()` hooks** allow global interceptors for super-admins or post-authorization logic
- **Responses** can be customized with messages via `Gate::authorize()` or `Policy` class return types

---

## Mental Models

- **The Bouncer Model:** Gates are door bouncers — they check credentials (user attributes, roles) before granting entry to specific actions, with `before()` acting as the VIP override
- **The Police Station Model:** Policies are specialized police stations for each model type; `view`, `create`, `update`, `delete`, `restore`, and `forceDelete` are standard response codes
- **The Permission Lattice:** Permissions form a partially ordered set where higher-level grants implicitly include lower-level ones, with `before()` providing lattice overrides

---

## Internal Mechanics

Laravel's `Gate` resolves authorization by first checking `before()` hooks, then iterating through registered policies for the model class, then checking explicitly registered Gates. The `Gate` instance is resolved from the container per request. Policy instances are resolved via the container, allowing dependency injection of services. The `AuthorizesRequests` trait provides the `authorize()` method on controllers. Policy methods receive the authenticated user as the first parameter and optionally the model instance. Middleware-based authorization via `can:` middleware key checks gates before controller execution.

---

## Patterns

**CRUD Policy Pattern:** Define `viewAny`, `view`, `create`, `update`, `delete`, `restore`, `forceDelete` methods on policy classes. Benefit: Standardized, framework-expected interface. Tradeoff: Forces all model authorization through a single class.

**Super Admin Bypass Pattern:** Use `Gate::before()` to grant all permissions to admin users. Benefit: Avoids duplicating permission checks for administrators. Tradeoff: Can mask missing permission definitions if not carefully integrated with audit logging.

**Resource-Based Gates Pattern:** Register gates for non-model actions (reports, exports, settings). Benefit: Extends authorization beyond Eloquent models. Tradeoff: Requires manual registration and documentation.

---

## Architectural Decisions

Choose Gates over Policies when authorization logic is simple, does not map to a specific model, or involves cross-cutting concerns (e.g., "can export reports"). Choose Policies when authorization revolves around a single model or resource. Use Policy auto-discovery when following Laravel conventions; use explicit registration in `AuthServiceProvider` when policies don't follow naming conventions. For multi-tenant systems, inject the tenant context into the Policy via the service container. Avoid embedding authorization logic in controllers — always use Policies or Gates for audit trail traceability.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Centralized authorization | Additional class overhead for simple checks | Increased file count but improved maintainability |
| Framework auto-discovery | Magic binding can obscure policy resolution | Requires naming convention discipline |
| Testable in isolation | Requires mocking Gate facade or injecting Policy | Additional test setup but reliable verification |
| Blade integration via `@can` | Template-level checks can leak authorization concerns | View-layer coupling but convenient for UI toggling |

---

## Performance Considerations

Policy resolution is cached within a single request lifecycle, so multiple `authorize()` calls for the same model do not re-resolve. Database-backed permission lookups (roles, permissions tables) should be eager-loaded or cached to avoid N+1 queries per authorization check. `Gate::before()` callbacks execute on every authorization check — keep them lean. For high-throughput APIs, consider caching resolved permissions per user with TTL. Policy methods are resolved via the container — limit constructor injection to lightweight services.

---

## Production Considerations

Always define a fallback `Gate::denies()` check in exception handlers for unhandled authorization failures. Log authorization failures with user context for audit trails. Use Laravel's `\Illuminate\Auth\Access\AuthorizationException` to return proper 403 responses. Register all policies in `AuthServiceProvider` — auto-discovery fails silently if model file is not autoloadable. Write dedicated Pest or PHPUnit tests for each policy method. Monitor `authorize()` calls in production to detect unexpected failures.

---

## Common Mistakes

**Mixing authorization logic in controllers** — leads to untestable code and audit-blind decisions. Always delegate to Policies.

**Forgetting to register policies for auto-discovered models** — results in silent authorization bypass where `authorize()` always passes. Verify policy registration in `AuthServiceProvider`.

**Over-relying on `Gate::before()` for role-based access** — `before()` runs on every gate check and can mask missing policy definitions. Use it only for true super-admin bypasses.

---

## Failure Modes

- **Policy method returns no value (null):** Laravel treats this as denied. Ensure all policy methods return explicit `true` or `false`.
- **Unregistered model policy:** `Gate::check()` returns false silently. Use `Gate::policies()` in tests to verify registration.
- **Missing `AuthorizesRequests` trait on controller:** `authorize()` call fails with a bad method call error. Verify the trait is imported.

---

## Ecosystem Usage

Laravel's own Forge and Vapor use Gate-based authorization for team management. Nova applies policies for resource visibility and action authorization. Spatie's `laravel-permission` and `laravel-nova` integrate directly with the Gate system. First-party packages like Horizon and Telescope use Gates for user authorization to queue monitoring and debug pages.

---

## Related Knowledge Units

### Prerequisites
- Laravel Service Container
- Laravel Middleware Pipeline
- Eloquent ORM Basics

### Related Topics
- Spatie Permission (role-permission package integration)
- OPA/OpenPolicyAgent (external policy engine for advanced use cases)
- Laravel Authentication workflows

### Advanced Follow-up Topics
- Zero Trust Architecture with Policy Enforcement
- Policy Caching for High-Throughput Systems
- Attribute-Based Access Control (ABAC) Extensions

---

## Research Notes

Laravel's Gate/Policy system is inherently an RBAC (Role-Based Access Control) implementation with ABAC extensibility via `before()` callbacks. The framework's design prioritizes convention over configuration, making it accessible but requiring deliberate architectural discipline for complex compliance scenarios. The policy auto-discovery mechanism (introduced in Laravel 5.8) relies on `Gate::guessPolicyNamesUsing()` which can be customized for non-standard model directories.
