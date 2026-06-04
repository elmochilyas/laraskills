# Metadata

Domain: Security & Identity Engineering
Subdomain: Authorization
Knowledge Unit: Policies: model-centric authorization classes
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Policies are classes that organize authorization logic per Eloquent model. Each method (`view`, `create`, `update`, `delete`, `restore`, `forceDelete`) corresponds to a user action against that model. Policies are auto-discovered by naming convention, can be registered explicitly via `$policies` array or `#[UsePolicy]` attribute, and integrate with controllers (`authorizeResource()`), route middleware (`->can()`), and Blade directives (`@can`). The industry standard is to use Policies for ALL model-specific authorization, Gates only for cross-cutting concerns.

---

# Core Concepts

- **Policy Methods**: Standard methods: `viewAny`, `view`, `create`, `update`, `delete`, `restore`, `forceDelete`. Each receives the authenticated `User` as first argument and optionally the model instance (except `viewAny`, `create`).
- **authorizeResource()**: Controller constructor method that maps CRUD actions to policy methods. `authorizeResource(Post::class, 'post')` wires `index→viewAny`, `show→view`, `create/store→create`, `edit/update→update`, `destroy→delete`.
- **Can Middleware**: Route-level protection: `Route::put('/posts/{post}', ...)->middleware('can:update,post')`.
- **Attribute Authorization**: Laravel 13+ supports `#[Authorize]` attribute on controller methods.
- **Before Hook**: `public function before(User $user, string $ability): bool|null` — runs before all methods. Return `true` for admin bypass, `null` to fall through.
- **Response Objects**: Methods can return `Response::allow()` or `Response::deny('Custom message')` for detailed authorization responses.

---

# Mental Models

- **CRUD per Model**: A Policy is the authorization mirror of a resource controller. For every CRUD action on a model, there is a matching policy method.
- **Contract, Not Implementation**: The policy defines who CAN do what. The how is the controller's job. Policies should be thin — delegate complex rules to service classes.

---

# Internal Mechanics

- **Resolution**: `Gate::before()` (global) → Policy `before()` → specific Policy method → `Gate::after()` (global).
- **Auto-discovery**: Laravel scans `app/Policies/` for classes matching `{Model}Policy` naming convention. Checks `app/Models/Policies/` then `app/Policies/`. Model `App\Models\Post` → Policy `App\Policies\PostPolicy`.
- **Explicit Registration**: `$policies = [Post::class => PostPolicy::class]` in `AuthServiceProvider`. Overrides auto-discovery.
- **#[UsePolicy]**: PHP attribute on the model: `#[UsePolicy(PostPolicy::class)]`.
- **authorizeResource() Mapping**: `index→viewAny`, `show→view`, `create→create`, `store→create`, `edit→update`, `update→update`, `destroy→delete`.

---

# Patterns

## Thin Policy, Rich Service
- **Purpose**: Keep policies clean by delegating complex rules.
- **Implementation**: Policy methods call an injected service (e.g., `AuthorizationService`). Policy reads like a table of contents.
- **Benefits**: Testable authorization logic independent of the policy class.

## Explicit `#[UsePolicy]` Attribute
- **Purpose**: Make model-policy relationship visible on the model itself.
- **Implementation**: `#[UsePolicy(PostPolicy::class)]` above the model class.
- **Benefits**: Immediate visibility without checking `AuthServiceProvider` or guessing auto-discovery conventions.

## Restore/ForceDelete Protection
- **Purpose**: Only admins can restore or permanently delete.
- **Implementation**: `restore` and `forceDelete` methods check for admin role. Standard resource CRUD methods check ownership.
- **Benefits**: Granular control over sensitive operations beyond basic CRUD.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Auto-discovery vs explicit registration | Standard naming vs custom namespaces | Auto-discovery for convention-following projects; explicit registration otherwise |
| `authorizeResource()` vs manual `authorize()` calls | Full resource controller vs irregular routing | `authorizeResource()` for standard CRUD; manual checks for non-standard actions |
| `can` middleware vs controller authorize | Route-level vs controller-level enforcement | Middleware for consistency; controller method for conditional logic |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Centralized model auth — change one method, affects all entry points | Must remember to authorize in all entry points | Controllers without `authorizeResource()` or `authorize()` are unprotected |
| Auto-discovery reduces boilerplate | Non-standard namespaces silently skip auto-discovery | Policy with different namespace than model is never invoked — silently returns false |
| Before hook provides clean admin bypass | Before hook returning true on one policy does NOT affect other policies | Must repeat admin bypass logic per policy or use global `Gate::before()` |

---

# Performance Considerations

- Policy resolution is cached after first lookup in `Gate::$policyCache`. No repeated filesystem scanning.
- Policy method call overhead is negligible (one additional PHP method call).
- Database queries within policy methods (ownership check, subscription status) dominate performance.

---

# Production Considerations

- **authorizeResource() in Laravel 11+**: The slim base controller does not include `AuthorizesRequests` trait by default. Add it to `Controller` base class.
- **Policy Testing**: `$this->assertTrue((new PostPolicy())->update($user, $post))`. Unit-testable without HTTP.
- **Soft Deletes**: Define `restore` and `forceDelete` methods explicitly. Don't rely on auto-CRUD mapping for soft-delete actions.

---

# Common Mistakes

- **Not importing AuthorizesRequests trait**: `$this->authorize()` throws `BadMethodCallException`. Laravel 11+ base controller lacks the trait.
- **Forgetting `viewAny`**: Resource controllers call `viewAny` for `index` routes, not `view`. If undefined, `false` is returned — users see blank index pages.
- **Authorizing only in Blade**: Policy method never runs if only `@can('update', $post)` is used in the view. Server enforcement via `authorizeResource()` or `->can()` middleware is mandatory.
- **Complex logic in policy methods**: Policies with 200+ lines of conditions indicate the need for extracted service classes.

---

# Failure Modes

- **Unregistered Policy Silent Failure**: If a Policy is not registered and auto-discovery fails, `$this->authorize('update', $post)` returns `false` (403). No error or warning — the developer may not realize the policy is missing.
- **Before Hook Accidental Denial**: `before()` returning `false` denies all actions for that user even if specific methods would allow them.
- **authorizeResource() Wrong Route Key**: `authorizeResource(Post::class, 'post_id')` but the route parameter is `{post}` → implicit binding fails → the policy receives null → access denied.

---

# Related Knowledge Units

- Prerequisites: Gates (closure-based authorization), Auth guards/providers architecture
- Related: Policy auto-discovery by naming convention, Super-admin bypass, Blade authorization directives
- Advanced Follow-up: Policy security patterns, Testing authorization, Policy + Spatie Permission integration

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
