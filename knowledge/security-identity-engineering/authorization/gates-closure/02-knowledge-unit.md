# Metadata

Domain: Security & Identity Engineering
Subdomain: Authorization
Knowledge Unit: Gates: closure-based authorization
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Gates are closures registered via `Gate::define()` that act as simple, named authorization checks. They receive the authenticated user as the first argument and optionally the relevant resource. Gates are best suited for non-model-specific actions: admin panel access, feature flags, subscription tier checks. They are the functional counterpart to Policy classes (which organize authorization per model). The ecosystem consensus is to use Gates sparingly — only for cross-cutting concerns — and move model-specific logic to Policies.

---

# Core Concepts

- **Gate::define(name, closure)**: Registers an authorization check. The closure receives a `User` (nullable if optional) and optional parameters.
- **Gate::allows() / denies()**: Boolean-checking methods for conditional logic. Do not throw exceptions.
- **Gate::authorize()**: Throws `AuthorizationException` (HTTP 403) if denied. Use for enforcement.
- **Gate::before()**: Runs before all other checks. Return `true` to grant, `false` to deny, `null` to fall through.
- **Gate::after()**: Runs after all other checks. Receives the result and can override it.
- **Gate::forUser()**: Check authorization for a specific user (not the authenticated one).
- **Gate::allowIf() / denyIf()**: Inline authorization without a registered Gate definition.

---

# Mental Models

- **Gates as Routes, Policies as Controllers**: The Laravel docs analogy. Gates are quick closures (like route closures). Policies are structured classes (like controllers).
- **Check Permission, Not Role**: Gates check abilities ("can update post"), not roles ("is admin"). The ecosystem principle: `$user->can('edit articles')`, never `$user->hasRole('editor')`.

---

# Internal Mechanics

- Gate definitions are stored in `Illuminate\Auth\Access\Gate` as an array of callables.
- `Gate::authorize('action', $model)` → `Gate->inspect('action', $model)` → runs `before` callbacks → if none returned non-null, runs the defined gate closure → runs `after` callbacks → returns `Illuminate\Auth\Access\Response`.
- `Gate::before()` closures registered via `Gate::before()` are stored in a separate array and invoked first for ALL gate and policy checks — globally.
- The Gate resolves the authenticated user from the current guard. Uses `Auth::user()`.
- Gates support response objects: `Response::allow()` and `Response::deny($message)` for custom error messages.

---

# Patterns

## Cross-Cutting Feature Gate
- **Purpose**: Control access to a feature that spans multiple models.
- **Implementation**: `Gate::define('export-data', fn($user) => $user->subscribed())`. Checked in controllers, jobs, and Livewire components.
- **Benefits**: Single definition used everywhere; easy to change subscription logic.

## Admin Dashboard Gate
- **Purpose**: Restrict admin area access.
- **Implementation**: `Gate::define('view-admin', fn($user) => $user->isAdmin())`.
- **Benefits**: One check protects all admin routes. Changed in one place.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Gate vs Policy | Action is not model-specific | Gate. If you are passing a model instance, consider a Policy |
| `authorize()` vs `allows()` | Need 403 vs conditional branch | `authorize()` for enforcement; `allows()` for UI logic |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Simple, concise closures | Closures are anonymous — harder to test in isolation | Extract complex logic into invokable classes or inject dependencies |
| One file for all non-model auth | AppServiceProvider grows with every new gate | At 10+ gates, consider grouping into dedicated service providers |
| before/after hooks provide global interception | Indiscriminate — applies to ALL authorization checks | A before hook that returns `true` accidentally overrides intended denials |

---

# Performance Considerations

- Gate resolution is O(1) — an array lookup by name, then closure invocation.
- No database queries unless the closure queries the database.
- Cache closure results if they perform expensive checks (e.g., subscription status from billing API).

---

# Production Considerations

- **Gate::before() Super Admin**: Most common pattern for admin bypass. Return `null` for non-admins to fall through to the real check.
- **Gate::after() Audit**: `Gate::after()` can log every authorization decision for audit trails.
- **403 vs 404**: Default is 403 (Forbidden). For sensitive resources, consider returning 404 (Not Found) to avoid revealing resource existence.

---

# Common Mistakes

- **Checking roles inside Gates**: `$user->role === 'admin'`. Use `$user->can('do-admin-things')` instead. Roles are implementation details.
- **Putting model-specific logic in Gates**: If a Gate receives `$post` and checks ownership, it should be a Policy method (`update` on `PostPolicy`).
- **Relying solely on Blade `@can`**: Server-side `Gate::authorize()` is mandatory. `@can` only hides UI — it does not protect routes.
- **Returning false from before()**: `Gate::before()` returning `false` denies access even if the specific gate would allow it. Return `null` to fall through.

---

# Failure Modes

- **Missing Gate**: Calling `Gate::authorize('nonexistent')` throws `AuthorizationException` with "This action is unauthorized." The error message is unhelpful — always register gates.
- **Before Hook Override**: A `Gate::before()` returning `true` for all users grants unauthorized access. Ensure before hooks check specific conditions.
- **User Not Authenticated**: Gates receive `null` user if the route is not behind `auth` middleware. Optional type-hinting (`?User`) prevents crashes but may produce unexpected results.

---

# Related Knowledge Units

- Prerequisites: Auth guards/providers architecture, Middleware pipeline
- Related: Policies (model-centric authorization), Super-admin bypass via Gate::before(), Blade @can/@cannot/@canany directives
- Advanced Follow-up: Gate response objects with custom messages, Gate event listeners for audit logging, Gate testing patterns

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
