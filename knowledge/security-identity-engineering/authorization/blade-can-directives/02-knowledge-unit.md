# Metadata

Domain: Security & Identity Engineering
Subdomain: Authorization
Knowledge Unit: Blade @can/@cannot/@canany directives
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Blade directives `@can`, `@cannot`, and `@canany` provide UI-level authorization checks in templates. They work with both Gates (`@can('view-admin')`) and Policies (`@can('update', $post)`). These directives are PRESENTATION-ONLY — they hide or show UI elements but do NOT protect routes. Server-side enforcement via `Gate::authorize()`, middleware, or `authorizeResource()` is mandatory. A common production mistake is relying solely on Blade directives for security, leaving endpoints unprotected against direct URL access.

---

# Core Concepts

- **@can('ability', $model)**: Shows content if the user is authorized. Delegates to `Gate::allows()`.
- **@cannot('ability', $model)**: Shows content if the user is NOT authorized (inverse of `@can`).
- **@canany(['ability1', 'ability2'], $model)**: Shows content if the user is authorized for ANY of the listed abilities.
- **@else**: Both `@can` and `@cannot` support `@else` branches for fallback content.
- **Authentication Requirement**: If no user is authenticated, all directives return `false` (for `@can`) or `true` (for `@cannot`), unless the Gate/Policy allows unauthenticated users via optional type-hint.

---

# Mental Models

- **UX Only, Not Security**: `@can` is a "show/hide" button. It affects what the user SEES. It does not affect what the user CAN DO via direct URL access. Think of it as the car door lock — it keeps honest people out, but a determined attacker can go around it.
- **Client-Hint, Not Server-Enforcement**: The server still enforces authorization on the route. The Blade directive is just a hint to the UI about what to render.

---

# Internal Mechanics

- `@can('update', $post)` compiles to `<?php if(app(\Illuminate\Contracts\Auth\Access\Gate::class)->check('update', $post)): ?>`.
- The directive resolves the Gate instance from the container and calls `Gate::check()`, which runs the full authorization pipeline (before hooks → gate/policy → after hooks).
- `@cannot` compiles to `<?php if(app(\Illuminate\Contracts\Auth\Access\Gate::class)->denies('update', $post)): ?>`.
- The directives are registered in `Illuminate\View\Compilers\BladeCompiler` as custom Blade statements.

---

# Patterns

## Consistent UI/Server Authorization
- **Purpose**: Ensure Blade directives mirror server-side authorization.
- **Implementation**: Use the same ability names in `@can` as in `Gate::authorize()`. Never hardcode role checks in Blade.

## Granular Component Visibility
- **Purpose**: Show/hide edit/delete buttons based on permissions.
- **Implementation**: `@can('update', $post) <button>Edit</button> @endcan`
- **Benefits**: Users only see actions they can perform.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| `@can('action')` vs `@if(auth()->user()->can('action'))` | Idiomatic vs explicit | `@can` is idiomatic; the user method is equivalent but less readable |
| `@can` with model vs without | Model-bound action vs general action | Pass model instance for resource actions; omit for general permissions |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Clean template syntax | Creates false sense of security | Developers think `@can` alone is enough — it is NOT security |
| Works for both Gates and Policies | Performance: every `@can` runs the full authorization pipeline | 20 `@can` checks on a page = 20 Gate resolution calls |
| `@canany` supports OR logic | No equivalent `@cannotany` | Must chain `@cannot` individually for inverse checks |

---

# Performance Considerations

- Each `@can` directive resolves the Gate and may query the database (if the gate/policy does). On pages with 50+ items and `@can` per item, this is 50+ authorization checks.
- For lists, use `$user->can('view', $item)` once and pass the result to the view, rather than `@can` inside loops.
- Spatie Permission checks via Blade directives are cached — the permission cache makes repeated checks fast.

---

# Production Considerations

- **Pair with Middleware**: Every route with `@can` in the template must also have server-side enforcement via `->can()` middleware or `Gate::authorize()`.
- **Guest Users**: `@can('create', Post::class)` returns `false` for guests. If you need different behavior for guests, use `@guest` / `@auth` directives.
- **No Model, General Check**: `@can('view-admin')` for general abilities — no model parameter needed.

---

# Common Mistakes

- **Using Blade directives as sole authorization**: "The button is hidden, so the endpoint is safe." False. Direct URL access bypasses the button. Always enforce server-side.
- **Checking roles in Blade**: `@if(auth()->user()->hasRole('admin'))` — brittle. Use `@can('manage-users')`.
- **Forgetting to pass model**: `@can('update', $post)` with the `$post` variable undefined → `@can` always returns false.
- **Overusing @can in loops**: `@foreach($posts as $post) @can('update', $post)...` — 100 posts = 100 Gate resolves. Pre-compute and pass as array.
- **Assuming `@can` works without authentication**: Unauthenticated requests always get `false` from `@can`. Use `@auth` wrapping for authenticated-only content.

---

# Failure Modes

- **Missing Model Object**: If `@can('update', $post)` is used but `$post` is `null` (not found), the policy receives `null` and returns `false`. The edit button is hidden even if the user could update if they had the model.
- **Authorization Exception from Directive**: If the Gate throws an exception during the check (not from `authorize()` but from an internal error), the Blade directive propagates the exception — breaking the entire page render.
- **Cached But Stale Permission Check**: With Spatie's cache, a recently granted permission may not be reflected in `@can` until cache reset.

---

# Related Knowledge Units

- Prerequisites: Gates (closure-based authorization), Policies (model-centric authorization)
- Related: Spatie Permission Blade directives, Server-side authorization enforcement patterns
- Advanced Follow-up: Pre-computing authorization for Blade views, Testing Blade directive behavior

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
