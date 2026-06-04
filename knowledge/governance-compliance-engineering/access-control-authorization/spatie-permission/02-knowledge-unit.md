# Spatie Permission

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** access-control-authorization
- **Knowledge Unit:** Spatie Permission
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Spatie's `laravel-permission` is the most widely adopted role-permission package in the Laravel ecosystem, providing a database-driven RBAC (Role-Based Access Control) system that integrates directly with Laravel's native Gate/Policy system. It enables fine-grained permission management through Eloquent models, middleware, and Blade directives, making it essential for multi-tenant SaaS applications and enterprise environments.

---

## Core Concepts

- **Roles** group multiple permissions together for assignment to users
- **Permissions** represent individual actions (e.g., `edit-articles`, `publish-posts`) stored in a `permissions` database table
- **Direct permissions** can be assigned to users independent of their roles for granular overrides
- **The `HasRoles` trait** adds `assignRole()`, `givePermissionTo()`, and related methods to the User model
- **Middleware guards** (`role:`, `permission:`) protect routes at the middleware level
- **Blade directives** (`@role`, `@hasrole`, `@can`) provide template-level permission checking
- **The `Gate::before()` integration** auto-connects with Laravel's Gate system through `AuthServiceProvider` registration

---

## Mental Models

- **The Badge System:** Users collect role badges, and each badge carries permission keys. Direct permissions are extra keys on the keychain. Authorization checks look for the required key across all badges.
- **The Organization Chart:** Roles map to organizational positions (Admin, Editor, Viewer), each position has defined responsibilities (permissions), and individuals in those positions inherit those responsibilities.
- **The Permission Lattice:** Permissions form a partially ordered lattice where role inheritance follows natural containment — an Editor role's permissions are a superset of Viewer's.

---

## Internal Mechanics

Spatie Permission uses four database tables: `roles`, `permissions`, `model_has_roles`, and `model_has_permissions`. The `HasRoles` trait overrides Laravel's `viaPermissions()` method to integrate with Gate resolution. Permission and role caching happens automatically — cached permissions are invalidated when roles/permissions are updated via `forgetCachedPermissions()`. The package respects Laravel's auth guard system, allowing separate permission sets for different guards (web, api). Permission names are stored as strings and matched by name — renaming a permission requires updating the database row.

---

## Patterns

**Role Hierarchy Pattern:** Define roles in a chain (Super Admin > Admin > Editor > Author > Subscriber) with cumulative permissions. Benefit: Simple mental model, easy to audit. Tradeoff: Rigid hierarchy may not fit all organizational structures.

**Direct Permission Override Pattern:** Assign specific permissions directly to users for edge cases where role permissions are too broad or narrow. Benefit: Handles exceptions without creating new roles. Tradeoff: Can lead to permission sprawl if overused.

**Wildcard Permission Pattern:** Use permission naming like `articles.*`, `articles.create`, `articles.edit`. Benefit: Hierarchical permission organization, easy to query. Tradeoff: Requires discipline in naming conventions.

---

## Architectural Decisions

Choose Spatie Permission over Laravel's native Gates/Policies when you need database-managed roles that non-developer administrators can modify. For applications with complex, multi-dimensional permissions (e.g., per-team, per-project), extend Spatie's models with custom pivot attributes. Use the `config/permission.php` file to configure table names, column names, and cache settings before the first migration. Register the `\Spatie\Permission\Middleware\RoleMiddleware::class` in `$routeMiddleware` for route-level protection. For multi-tenancy, add a `team_id` column to permission and role tables for isolation.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Database-managed roles (CRUD via admin UI) | Additional queries for permission resolution | Cache permissions to mitigate, but cache invalidation adds complexity |
| Direct integration with Laravel Gate | Package version coupling | Upgrade testing required per Laravel major release |
| Rich middleware and Blade support | Package opinion on table structure | Custom pivot columns require migrations to extend |

---

## Performance Considerations

Spatie caches permissions per guard using Laravel's cache driver (default: 60-minute TTL). The `forgetCachedPermissions()` method should be called after any role/permission changes. For high-traffic applications, consider using Redis as the cache driver. The middleware approach (`role:admin`) resolves permissions on every matching request — use route caching to mitigate middleware overhead. N+1 queries can occur when checking permissions in loops — eager-load roles and permissions via `User::with('roles.permissions')`.

---

## Production Considerations

Never assign permissions in database migrations that are also managed in code — use seeders for initial roles, then manage via admin UI. Run `php artisan permission:cache-reset` after deployments that modify permission checks in code. Audit permission assignments regularly — implement a scheduled job that reports users with unexpected permission combinations. For critical sections, implement defense-in-depth: apply middleware checks AND Blade directives AND Policy checks for the same restriction.

---

## Common Mistakes

**Assigning permissions directly to users instead of using roles** — leads to unmanageable permission sprawl. Always prefer role-based assignment; use direct permissions only for true exceptions.

**Forgetting to call `forgetCachedPermissions()` after seeding or migrations** — changes appear not to take effect. Always flush the cache after permission structure changes.

**Not configuring separate guards correctly** — permissions for the `web` guard won't apply to `api` guard users. Ensure permission assignments match the correct guard.

---

## Failure Modes

- **Permission name typos:** A permission named `edit-post` vs `edit_posts` silently fails to match. Use constants or enums for permission names.
- **Missing permission in database:** Users with the correct role but missing permission row get denied. Validate permissions exist during deployment via a console command.
- **Cache corruption:** Invalid permission cache causes temporary denial. Implement a cache reset endpoint accessible by administrators.

---

## Ecosystem Usage

Spatie Permission is used by Laravel Nova (via `spatie/laravel-nova-permission`), Filament admin panels (via `app/Filament/resources`), and countless SaaS applications. It integrates with Laravel Jetstream, Fortify, and Breeze for team-based authorization. The package is the de facto standard for role management in the Laravel ecosystem, with over 12k GitHub stars and extensive community tooling.

---

## Related Knowledge Units

### Prerequisites
- Laravel Gates & Policies
- Eloquent ORM (many-to-many relationships)
- Laravel Middleware

### Related Topics
- Laravel Gates & Policies (native authorization integration)
- Multi-Tenant Authorization with team-based permissions
- Admin Panel authorization patterns

### Advanced Follow-up Topics
- Custom Permission Guards for Microservices
- Spatie Permission with OPA/OpenPolicyAgent
- Permission Audit Trail and Compliance Reporting

---

## Research Notes

Spatie Permission v5+ supports team-based permissions via the `team_foreign_key` configuration option. The package's design follows Laravel's contract-first philosophy — the `HasRoles` trait can be applied to any authenticatable model, not just the default User model. The wildcard permission feature (`articles.*`) uses Laravel's `Str::is()` method for pattern matching against stored permission names. The package does not support row-level permissions (Row-Level Security) — for that granularity, combine with Laravel's native Policy system.
