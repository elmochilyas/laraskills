# Metadata

Domain: Security & Identity Engineering
Subdomain: Authorization
Knowledge Unit: Policy auto-discovery by naming convention
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Laravel automatically discovers Policy classes by matching model names to policy names with the `Policy` suffix, scanning `app/Policies/` and `app/Models/Policies/` directories. This eliminates manual registration for convention-following projects. Alternative registration methods include the `$policies` array on `AuthServiceProvider` and the `#[UsePolicy]` attribute on the model class (Laravel 13+). Auto-discovery is the recommended default; explicit registration overrides it when conventions diverge.

---

# Core Concepts

- **Convention**: `Post` model → `PostPolicy` in `app/Policies/PostPolicy.php`. The suffix `Policy` is required. The directory can be `app/Policies/` or `app/Models/Policies/`.
- **Scan Order**: Laravel checks `app/Models/Policies/` first, then `app/Policies/`. First match wins.
- **Explicit Override**: If auto-discovery finds a policy but should not, register a different policy via `$policies` array or `#[UsePolicy]`.
- **Gate::guessPolicyNamesUsing()**: Custom callback to override the entire discovery logic for advanced scenarios (custom namespaces, naming patterns).

---

# Mental Models

- **Convention Over Configuration**: If your model is in `app/Models/Post.php` and your policy is in `app/Policies/PostPolicy.php`, Laravel finds the connection automatically. No config, no attribute, no registration array.
- **Last Resort Resolution**: Auto-discovery runs only if no explicit registration exists. Explicit `$policies` entries and `#[UsePolicy]` attributes take priority.

---

# Internal Mechanics

- Laravel's `Gate` class checks `$policies` array first (keyed by model class).
- If not found, it checks the model class for `#[UsePolicy]` attribute.
- If still not found, auto-discovery runs: `Gate::getPolicy()` calls `Gate::guessPolicyName()` which transforms the model class name to the policy class name (e.g., `App\Models\Post` → `App\Policies\PostPolicy`), then checks both directory locations via `class_exists()`.
- The resolved policy is cached in `Gate::$policyCache` for the remainder of the request.
- Custom discovery via `Gate::guessPolicyNamesUsing()` overrides the default name transformation.

---

# Patterns

## #[UsePolicy] Attribute Pattern
- **Purpose**: Explicit model-policy mapping visible on the model.
- **Implementation**: `#[UsePolicy(\App\Policies\PostPolicy::class)]` on the `Post` model class.
- **Benefits**: No guessing; survives refactoring and namespace changes.

## Custom Namespace Discovery Pattern
- **Purpose**: Policies in non-standard directory structure.
- **Implementation**: `Gate::guessPolicyNamesUsing(fn($modelClass) => 'App\\Auth\\Policies\\'.class_basename($modelClass).'Policy')`.
- **Benefits**: Full control over policy location naming.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Auto-discovery vs explicit registration | Standard project vs complex namespace mapping | Auto-discovery for new projects; explicit registration when retrofitting into existing codebase |
| #[UsePolicy] vs $policies array | Attribute preference vs service provider preference | #[UsePolicy] for visibility on the model; $policies array for central audit |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Zero configuration for new policies | Silent fallback if convention is broken | Model `Admin` with policy `AdminPanelPolicy` in wrong directory → authorization silently returns false |
| #[UsePolicy] attribute is explicit and IDE-friendly | Dependencies policy class from model | Model file must import the policy class — added dependency |

---

# Common Mistakes

- **Wrong directory**: Policy in `app/Http/Policies/` instead of `app/Policies/` or `app/Models/Policies/` — not discovered.
- **Wrong suffix**: `PostAuth.php` instead of `PostPolicy.php` — not discovered.
- **Case Sensitivity**: `postpolicy.php` (lowercase) on case-sensitive filesystems — class not found.
- **Assuming auto-discovery works in tests**: If `AuthServiceProvider` is not loaded in a test environment, auto-discovery doesn't run. Load the provider or register policies explicitly in test setup.

---

# Failure Modes

- **Namespace Mismatch**: If the `User` model was moved from `App\User` to `App\Models\User` but the policy is in `App\Policies\UserPolicy` expecting `App\User`, auto-discovery looks for `App\Models\UserPolicy` — doesn't find it.
- **Model Inheritance**: If `PremiumPost extends Post`, auto-discovery looks for `PremiumPostPolicy`. If not found, no policy — all authorization on `PremiumPost` returns false.
- **Multiple Models, One Policy**: `Video` and `Audio` models share `MediaPolicy`. Auto-discovery only matches `VideoPolicy` or `AudioPolicy`. Must use explicit registration.

---

# Related Knowledge Units

- Prerequisites: Policies (model-centric authorization classes)
- Related: Gates (closure-based authorization), Super-admin bypass
- Advanced Follow-up: Custom Gate::guessPolicyNamesUsing implementation, Testing policy discovery with alternate namespaces

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

## Performance Considerations

- **Authentication overhead**: Each authentication request adds 5-50ms for credential verification, session creation, and token generation. Cache session data in Redis to reduce database load.
- **Authorization check cost**: Policy and gate checks execute on every request. Policy auto-discovery adds negligible overhead (cached after first resolution). For high-throughput endpoints, cache permission results with user-based cache keys.
- **Encryption performance**: Encryption/decryption operations add 0.1-2ms per field. For high-throughput APIs, encrypt only sensitive fields rather than entire payloads.
- **Rate limiting overhead**: In-memory rate limiting (Cache::driver('array')) is faster than Redis-backed limiting. Use Redis-based limiting for distributed deployments; array-based for single-server setups.
- **Session storage**: File-based sessions degrade under high concurrency. Use Redis or database sessions for production deployments with multiple web servers.
- **Header processing**: Security headers (CSP, HSTS, etc.) are set once per response and add negligible overhead. However, CSP policy size affects browser parsing time. Keep CSP directives focused on actual requirements.

## Production Considerations

- **HTTPS enforcement**: Redirect all HTTP traffic to HTTPS. Use HSTS header with preload directive for domain-wide HTTPS enforcement. Configure HSTS max-age of at least 6 months (31536000 seconds).
- **Session security**: Use secure and httpOnly cookie flags. Set SameSite=Lax or Strict for session cookies. Regenerate session ID after login to prevent session fixation.
- **Security monitoring**: Monitor authentication failures, rate limit hits, and suspicious IP addresses. Set up alerts for brute force patterns and unusual login geographies.
- **Regular dependency audits**: Run composer audit in CI/CD to detect known vulnerabilities. Subscribe to security advisories for Laravel and major packages.
- **Breach response plan**: Document procedures for credential leaks, API key exposure, and session hijacking incidents. Include communication templates and rollback procedures.
- **Penetration testing**: Conduct regular security assessments, including automated scanning (OWASP ZAP, Burp Suite) and manual penetration testing for critical applications.
