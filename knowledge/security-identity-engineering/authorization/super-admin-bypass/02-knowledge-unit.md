# Metadata

Domain: Security & Identity Engineering
Subdomain: Authorization
Knowledge Unit: Super-admin bypass via Gate::before()
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

The `Gate::before()` method registers a closure that runs before all Gate and Policy checks. By returning `true`, it grants access regardless of the specific authorization logic. This is the canonical pattern for implementing super-admin bypass — a user with the super-admin role automatically passes all authorization checks. The critical behavior: returning `true` skips the actual policy/gate check entirely; returning `false` denies access even if the specific check would allow it; returning `null` (no return) delegates to the normal check.

---

# Core Concepts

- **Gate::before() vs Policy::before()**: `Gate::before()` is GLOBAL — applies to ALL authorization checks. `Policy::before()` is per-policy — only applies to that model's policy.
- **Return Values**: `true` = granted (access given even if specific check fails). `false` = denied (access blocked even if specific check passes). `null` = fall through to normal check.
- **Order of Evaluation**: `Gate::before()` (global) → Policy `before()` → Policy method → `Gate::after()` (global).
- **Spatie Permission Integration**: Spatie uses `Gate::before()` internally. Custom super-admin logic must be ordered carefully relative to Spatie's hook.

---

# Mental Models

- **Master Key**: `Gate::before()` returning `true` is a master key that opens every door. Use it sparingly — once you have the master key, you cannot be denied access to anything.
- **Short Circuit Gate**: Think of `before()` as a short circuit. If it returns `true`, the authorization system short-circuits to "allowed." The rest of the authorization logic never executes.

---

# Patterns

## Role-Based Super Admin
- **Implementation**: `Gate::before(fn($user) => $user->hasRole('super-admin') ? true : null)`.
- **Benefits**: Simple, clear. Change the role name in one place.
- **Tradeoffs**: Uses role check (anti-pattern per permission-centric design).

## Column-Based Super Admin
- **Implementation**: `Gate::before(fn($user) => $user->is_super_admin ? true : null)`.
- **Benefits**: No role system dependency. Direct column check.
- **Tradeoffs**: Less flexible for role-based management.

## Multi-Condition Super Admin
- **Implementation**: `Gate::before(fn($user) => ($user->isSuperAdmin() || $user->isImpersonating()) ? true : null)`.
- **Benefits**: Extensible for additional override conditions (impersonation, maintenance mode).
- **Tradeoffs**: Multiple conditions make the before hook harder to reason about.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| `Gate::before()` vs `Policy::before()` | Global vs per-model bypass | `Gate::before()` for true super-admin; `Policy::before()` for model-specific overrides (e.g., admins can manage any post) |
| `Gate::before()` vs explicit permission | Spatie super-admin via `hasRole('super-admin')` with Gate::before() | Spatie's approach is standard — `Gate::before()` returning null delegates to Spatie's internal permission check |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| One closure grants all access — trivial to implement | Cannot selectively deny super-admin access to specific resources | Super-admin bypasses all authorization — cannot be blocked from any action |
| Clean separation of super-admin logic | `Gate::before()` is opaque — it applies to all checks everywhere | New authorization checks are automatically bypassed for super-admins, possibly unintentionally |
| `null` return properly delegates to normal check | `false` return is absolute denial — overrides any normal check | Returning `false` accidentally blocks all admin actions |

---

# Performance Considerations

- `Gate::before()` runs on EVERY authorization check. The closure should be fast — avoid database queries. A role cache check is acceptable.
- If the `Gate::before()` query loads the user's roles, ensure roles are eager-loaded or cached.

---

# Production Considerations

- **Audit Logging**: `Gate::after()` can detect when a super-admin bypassed a check and log the override.
- **Testing**: Test that `Gate::before()` properly returns `true` for super-admins AND `null` for non-super-admins. Test both paths.
- **Impersonation**: When an admin is impersonating a user, `Gate::before()` should NOT return `true` — the impersonated user loses their restrictions. Use a request-scoped flag to skip super-admin bypass during impersonation.

---

# Common Mistakes

- **Returning `true` from before() without conditions**: `Gate::before(fn() => true)` — every single user is a super-admin. All authorization checks pass for everyone.
- **Returning `false` instead of `null`**: `Gate::before(fn($user) => $user->isAdmin())` — non-admin users get `false` (denied) from before(), which overrides all permissions. They cannot do anything even if explicitly permitted.
- **Not handling `null` user**: When a route is not behind `auth` middleware, `$user` is null. `$user->hasRole('super-admin')` throws an error on null.
- **Duplicate before() registrations**: Multiple `Gate::before()` calls — only the last one takes effect. Define once.

---

# Failure Modes

- **Spamming `Gate::before()` with Spatie**: If both your `Gate::before()` and Spatie's internal `Gate::before()` are registered, the order depends on service provider registration. If your before() runs before Spatie's and returns `null`, it passes to Spatie's. If Spatie's runs first and returns `true`, your before() never executes.
- **Super Admin Bypass in Admin Impersonation**: Admin impersonating a user should NOT bypass authorization. The admin can see what the user sees. Without a skip condition, the admin bypasses all checks and sees everything — defeating the purpose of impersonation.
- **Accidental Bypass of Sensitive Operations**: Super-admin bypass allows deleting any resource. If deletion should require confirmation even for admins (soft-delete with confirmation), the authority still holds. The before() bypass makes it impossible to enforce.

---

# Related Knowledge Units

- Prerequisites: Gates (closure-based authorization), Policies (model-centric authorization)
- Related: Spatie Permission (super-admin via hasRole), Blade authorization directives
- Advanced Follow-up: Gate::after() for audit logging, Impersonation-aware authorization, Partial super-admin bypass with role-specific restrictions

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
