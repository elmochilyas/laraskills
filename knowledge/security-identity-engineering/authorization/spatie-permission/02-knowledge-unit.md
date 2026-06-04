# Metadata

Domain: Security & Identity Engineering
Subdomain: Authorization
Knowledge Unit: Spatie laravel-permission (roles, permissions)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Spatie `laravel-permission` is the de facto standard package for database-driven role and permission management in Laravel. It provides `HasRoles` trait for the User model, pivot tables for role/permission assignments, middleware for route-level enforcement, and Blade directives. The package caches permissions per request (default 24-hour TTL), auto-refreshes on mutations through built-in functions, and supports team-scoped permissions, wildcard permissions, and multiple guard configurations. The ecosystem principle is: check permissions, not roles — `$user->can('edit articles')` not `$user->hasRole('editor')`.

---

# Core Concepts

- **Permission**: Atomic action (`edit articles`, `delete users`). Can be assigned directly to users or grouped into roles.
- **Role**: Group of permissions (`editor` role contains `edit articles`, `publish articles`). Users are assigned roles; roles have permissions.
- **HasRoles Trait**: Added to User model. Provides `givePermissionTo()`, `assignRole()`, `hasPermissionTo()`, `hasRole()`, `hasAnyRole()`, `getAllPermissions()`.
- **Cache**: Permission data is cached with 24-hour TTL. Auto-refreshed when using built-in functions (`givePermissionTo()`, `assignRole()`, etc.). Manual reset via `php artisan permission:cache-reset`.
- **Middleware**: `role`, `permission`, `role_or_permission` middleware for route-level checks.
- **Blade Directives**: `@role('admin')`, `@hasrole('admin')`, `@hasanyrole($roles)`, `@can($permission)`, `@cannot($permission)`.
- **Gate Integration**: The package hooks into Laravel's `Gate` via `Gate::before()` in the `PermissionRegistrar`. All permissions are registered as Gates automatically.

---

# Mental Models

- **Permission Check > Role Check**: The modern convention is to check permissions, never roles. Roles are container abstractions that can change; permissions are atomically stable. `$user->can('edit articles')` survives role restructuring.
- **Database-Driven Gates**: Spatie translates stored permissions into Laravel Gates automatically. `$user->can('edit articles')` works without any `Gate::define()` call — it reads from the `permissions` table.
- **Teams as Scoping Layer**: With team support enabled, the same user can have different roles/permissions in different teams. The team context must be set before permission checks.

---

# Internal Mechanics

- `PermissionRegistrar` loads all permissions and their assigned roles into cache on first request.
- `HasRoles->hasPermissionTo($permission)` checks: direct permission assignment → role-with-permission assignment → wildcard permission match → returns boolean.
- Cache structure: serialized array of permissions with their associated role IDs. Deserialized into Eloquent models on cache retrieval.
- Gate integration: `PermissionRegistrar` calls `Gate::before()` which checks if the user has the requested permission via `hasPermissionTo()`. If true, returns `true`. If false, returns `null` (delegates to any defined Policy or Gate).
- Octane safety: v6.22.0+ fixes a TOCTOU race condition in permission loading for concurrent environments. Set `config('permission.register_octane_reset_listener') => true` to flush cache between requests.

---

# Patterns

## Permission-Based Gate Checks (Preferred)
- **Purpose**: Check permissions, not roles.
- **Implementation**: `@can('edit articles')` in Blade, `$this->authorize('edit articles')` in controllers, `->middleware('permission:edit articles')` on routes.
- **Benefits**: Role-agnostic; survives role hierarchy changes.
- **Tradeoffs**: Requires explicit permission naming convention.

## Team Scoped Permissions
- **Purpose**: Users have different permissions in different teams/projects.
- **Implementation**: Enable `'teams' => true` in config. Migrate to add `team_foreign_key`. Set `$user->team_id` before permission checks.
- **Benefits**: Multi-tenant authorization without separate user records.
- **Tradeoffs**: Must manage team context per request; cache needs team-aware prefix.

## Super Admin via Gate::before()
- **Purpose**: Override all permission checks for admin users.
- **Implementation**: In `AuthServiceProvider::boot()`: `Gate::before(fn($user) => $user->hasRole('super-admin') ? true : null)`.
- **Benefits**: No explicit permission assignment to super-admin role.
- **Tradeoffs**: The `hasRole` check is a role check — if super-admin role is renamed, bypass stops.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Direct permissions vs role-based | Granularity vs manageability | Use roles for groups of permissions; assign permissions directly only for exceptions |
| HasRoles on User only vs multiple models | Student/teacher models both need auth | Apply HasRoles to all Authenticatable models, but ensure guard_name is set per model |
| Enable team support | Multi-tenant app | Enable from the start — retrofitting teams is complex |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Permission-Gate integration: `$user->can()` works automatically | Cache TTL of 24 hours means stale permissions after direct DB manipulation | Always use built-in methods (`givePermissionTo()`) or manually reset cache |
| Role grouping reduces admin overhead | Role explosion if overused | Too many roles becomes as hard to manage as too many permissions |
| Blade and middleware support | Encourages role checks instead of permission checks | `@role('admin')` in templates is an anti-pattern — check permissions |

---

# Performance Considerations

- Permission cache loads all permissions into memory on first request. For small apps (<1000 permissions), this is negligible.
- For large apps, cache expiration (24h) means permission changes take up to 24 hours without explicit cache reset.
- Octane: Enable `register_octane_reset_listener` to flush permission cache per request. This adds a cache load per request but prevents cross-request state leaks.
- Database queries: `HasRoles` adds eager-loading relationships. Use `$user->load('roles.permissions')` when needed, not lazy-loaded per check.

---

# Production Considerations

- **Cache Reset on Deployment**: Run `php artisan permission:cache-reset` after deployments that modify permissions in seeders/migrations.
- **Database Cache Store**: If `CACHE_STORE=database`, ensure cache tables exist before using `permission:cache-reset`.
- **Testing**: Use `$this->artisan('permission:cache-reset')` in test setup. Seed permissions before testing authorization.
- **Guard Name**: Always specify `guard_name` when creating roles/permissions. The default (`web`) may conflict with admin guard.

---

# Common Mistakes

- **Checking roles instead of permissions**: `$user->hasRole('editor')` means changing role structure affects authorization logic. Use `$user->can('edit articles')`.
- **Direct database manipulation**: Inserting into `model_has_roles` directly bypasses cache. Always use `$user->assignRole()`.
- **Not resetting cache after seeder**: Permissions created in seeders are not reflected until cache is reset. Call `app()[PermissionRegistrar::class]->forgetCachedPermissions()` in seeders.
- **Team support enabled without team context**: With teams enabled, `$user->givePermissionTo('x')` requires a team context. If team context is null, permission assignment fails silently.
- **Overusing wildcard permissions**: `*.read` matches `posts.read` but not `posts.read.drafts`. Wildcard nesting can produce unexpected matches.

---

# Failure Modes

- **Cache Staleness**: Permission cache not reset after creating new permissions via DB migration. `$user->can('new-action')` returns false even though the permission exists.
- **Guard Name Mismatch**: Permissions created with `guard_name='admin'` but User model uses `guard_name='web'`. `hasPermissionTo()` never matches.
- **Team ID Not Set**: With teams enabled, checking `$user->can('x')` without setting `$user->team_id` checks against the wrong team's permissions.
- **TOCTOU Race (Octane)**: Two concurrent requests loading permissions simultaneously before cache is populated can cause stale state. Fixed in v6.22.0+.

---

# Ecosystem Usage

- **Spatie Laravel Packages**: Consistent pattern across Media Library, Tags, Activitylog — `HasRoles` follows the Spatie trait convention.
- **Filament Admin**: Ships with `SpatiePermissionServiceProvider` for Filament-native role/permission management UI.
- **Laravel Nova**: Nova user management integrates with Spatie Permission via custom fields and policies.
- **Starter Kits**: No built-in Spatie integration — always added separately. The canonical stack recommendation is Fortify + Sanctum + Spatie Permission.

---

# Related Knowledge Units

- Prerequisites: Gates (closure-based authorization), Policies (model-centric authorization)
- Related: RBAC design (hierarchical, constrained), Super-admin bypass, Blade authorization directives
- Advanced Follow-up: Spatie Permission with team scoping, Wildcard permissions advanced patterns, Large-scale permission performance tuning

## Ecosystem Usage
- **Laravel Gates**: Closure-based authorization registered via Gate::define(); integrates with controllers via $this->authorize() and Blade via @can() directives. Gates are the simplest authorization mechanism in Laravel.
- **Laravel Policies**: Class-based authorization organized per model; auto-discovered via convention or manually registered. Policies provide CRUD methods (iewAny, iew, create, update, delete, estore, orceDelete).
- **Blade Authorization Directives**: @can, @cannot, @canany, @elsecan, @cannotany for template-level authorization checks. @can integrates with Gates and Policies transparently.
- **Spatie Laravel Permission**: Role and permission management package; uses Gate::before() for super-admin bypass and provides middleware (ole:admin, permission:edit-articles) for route protection.
- **Super Admin bypass patterns**: Gate::before() callback returning true for admin users; this skips all other Gate/Policy checks, reducing authorization latency for admin operations.
- **Policy auto-discovery**: Laravel discovers policies by convention (Policy suffix, same directory structure as models); explicit Gate::policy() registration is required when conventions are broken.
- **ReBAC implementations**: External policy decision points like Permit.io, Auth0 FGA, Topaz provide ReBAC as a service; Laravel integration occurs via middleware or Gate extenders that call the external PDP.
- **ABAC implementations**: Attribute-based access control typically implemented via policy query modifications or custom Gate::before() callbacks that evaluate user, resource, and environment attributes.

## Research Notes
- Laravel 11 introduced the Gate::guessPolicyNamesUsing() callback, allowing custom policy naming conventions beyond the default ModelPolicy convention — this enables modular monolith and package-based policy organization.
- Policy auto-discovery was optimized in Laravel 12 with event caching (the event:cache command now caches discovered policies as well), improving production performance for applications with many policies.
- ReBAC (Relationship-Based Access Control) is gaining traction in the Laravel ecosystem, with external PDPs providing gRPC/REST APIs for relationship graph queries — Laravel integration requires custom Gate::before() or middleware wrappers.
- ABAC (Attribute-Based Access Control) evaluation in Laravel typically involves policy methods that evaluate user attributes, resource attributes, and environment conditions — this is more expressive than RBAC but requires careful performance optimization.
- Spatie Laravel Permission v6+ introduced team-based permissions (PermissionRegistrar::), allowing permission sets per team context within a single user account — this extends the package's multi-tenancy capabilities.
- The super-admin bypass pattern (Gate::before(fn() => ->isAdmin() ? true : null)) must return 
ull (not alse) for non-admin users to allow other Gates/Policies to evaluate — returning alse denies all other authorization checks.
- Policy method resolution uses reflection to match methods to authorization actions — custom actions beyond CRUD require explicit method naming convention or the policy() helper with callback.
- Blade authorization directives compile to raw PHP can() calls during view rendering — this means authorization checks in Blade execute every time the view renders, not pre-cached at compile time.

## Internal Mechanics
- **Gate Resolution Flow**: Gate::allows('update', ) → Gate->inspect('update', ) → calls Gate->raw('update', ) which resolves the policy for the given class (via Gate->getPolicyFor()) → if no policy found, checks for named Gate definitions → calls the callback or policy method with (, ...) → returns \Illuminate\Auth\Access\Response with llowed() or deny().
- **Policy Auto-Discovery**: Laravel scans pp/Policies directory via Gate::guessPolicyNamesUsing() with convention: model at pp/Models/User.php → policy at pp/Policies/UserPolicy.php. The PolicyFinder maps model classes to policy classes through naming convention only — no reflection or metadata file involved.
- **@can Blade Directive Compilation**: @can('update', ) compiles to <?php if (app(\Illuminate\\Contracts\\Auth\\Access\\Gate::class)->check('update', )): ?> — the authorization check happens at render time, not compile time.
- **Gate::before Execution Order**: Gate::before() callbacks are executed first for every authorization check. If a efore callback returns 	rue, the check passes immediately; if alse, it fails immediately; if 
ull, the normal Gate/Policy method executes.
- **Spatie Permission Registration**: Spatie\Permission\PermissionRegistrar registers a Gate::before() callback that checks the user's role/permission cache. If the user has the required permission via a role, the callback returns 	rue; otherwise 
ull to allow standard Gates/Policies to evaluate.
- **Policy Method Resolution**: The uthorize() method in controllers uses Gate::inspect() which resolves the policy method name by convention: iew → iew() method, create → create() method, update → update() method. Custom actions use the same method name as the ability name.
