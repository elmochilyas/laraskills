# Metadata

Domain: Security & Identity Engineering
Subdomain: Authorization
Knowledge Unit: ABAC attribute-based authorization
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Attribute-Based Access Control (ABAC) evaluates authorization decisions based on attributes of the user (department, clearance), resource (classification, owner), action (read, write), and environment (time, location, device). Unlike RBAC's binary "user has role → role has permission" model, ABAC evaluates boolean expressions combining multiple attributes: `user.department == resource.department AND user.clearance >= resource.classification AND time.business_hours`. ABAC is not natively supported in Laravel — it requires custom implementation or an external Policy Decision Point (PDP) like Permit.io. It is the correct model when authorization rules are too dynamic or context-dependent for RBAC's static role→permission mapping.

---

# Core Concepts

- **Attributes**: Subject (user: department, role, clearance), Resource (classification, owner, region), Action (read, write, delete), Environment (time, IP, device type).
- **PDP (Policy Decision Point)**: The engine that evaluates attribute-based rules. Can be embedded (custom Laravel service) or external (Permit.io, OPA, Casbin).
- **PEP (Policy Enforcement Point)**: The middleware or gate that intercepts requests and queries the PDP. In Laravel, this is typically a custom Gate or middleware.
- **Policy**: A set of rules combining attributes. Example: `ALLOW read ON document IF user.department == document.department AND user.clearance >= document.classification`.

---

# Mental Models

- **Boolean Expression Engine**: ABAC is a DSL for authorization. Each policy is a boolean expression evaluated against the current context. `if (A and B) or (C and not D)`.
- **RBAC as ABAC Subset**: RBAC is a special case of ABAC where the only attribute is the user's role. If you find yourself adding "if user is in department X" to your RBAC checks, you're already doing ABAC — without the infrastructure.

---

# Patterns

## Attribute Context Service Pattern
- **Purpose**: Centralize attribute collection for consistent evaluation.
- **Implementation**: `AuthorizationContext` class that gathers user attributes (from User model), resource attributes (from model), environment attributes (from request), and action attributes (from route). Passed to PDP for evaluation.
- **Benefits**: Single source of truth for attribute values; easy to extend with new attributes.

## Embedded PDP with Policy Objects Pattern
- **Purpose**: Implement ABAC evaluation within Laravel without external services.
- **Implementation**: Policy classes that receive user and model and include attribute checks. Combine with policies as invokable action classes.
- **Benefits**: No external dependencies; full control over evaluation logic.
- **Tradeoffs**: Policy distribution across codebase; no centralized policy view.

## External PDP (Permit.io) Pattern
- **Purpose**: Centralized policy management across services.
- **Implementation**: Permit.io PDP as a sidecar service. Laravel queries the PDP via REST/gRPC with attributes. Permit.io dashboard manages policies.
- **Benefits**: No-code policy changes; audit trail; multi-service consistency.
- **Tradeoffs**: External dependency; network latency per authorization check; cost at scale.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Embedded vs external PDP | Single service vs multi-service architecture | Embedded for monolith Laravel; external for microservices with consistent auth |
| Custom attribute service vs ad-hoc attribute gathering | Large team vs small codebase | Centralized context service for 5+ developers; ad-hoc is acceptable for small teams |
| Policy-as-code vs policy-as-config | Developer-driven vs operations-driven | Policy-as-code for Laravel-centric teams; policy-as-config for cross-functional policy management needs |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Fine-grained, context-aware authorization | Attribute-based rules are harder to audit than RBAC | "Who can access what?" becomes a non-trivial query across attribute dimensions |
| Dynamic policy changes without code deployment (external PDP) | External PDP introduces latency and availability risk | Authorization failures during PDP downtime — implement local caching with fail-open/closed policy |
| Flexible rules support complex business requirements | Testing combinatorial attribute scenarios is expensive | Full coverage requires factorial test matrices (user types × resource types × actions × environments) |

---

# Performance Considerations

- Every PDP evaluation adds 1-50ms (embedded) or 20-200ms (external HTTP/gRPC).
- Cache evaluation results per (user, resource, action) key. TTL depends on attribute volatility. Environment attributes (time) require short TTL or skip caching.
- Attribute collection queries add DB load. Eager-load attributes in context service.
- External PDP: circuit breaker pattern to fail-open (grant access on PDP timeout) or fail-closed (deny access). Choose based on security requirements.

---

# Production Considerations

- **Policy Audit**: Every ABAC decision should be logged with the full attribute context for debugging and compliance.
- **Policy Versioning**: Attribute rules change over time. Version policies and support parallel evaluation during migration.
- **Fail Behavior**: Define clear behavior when the PDP is unreachable or attributes are missing. Fail-closed (deny) for sensitive resources; fail-open (grant) for public resources.
- **Testing**: Use property-based testing for ABAC policies to cover attribute combinations that manual tests miss.

---

# Common Mistakes

- **Treating ABAC as RBAC with more columns**: ABAC requires a policy engine, not just additional user/resource fields. Without a PDP, attribute checks scattered across controllers become untestable.
- **Over-engineering**: 90% of authorization needs are met by RBAC. ABAC adds complexity that only pays off when rules genuinely depend on runtime context (time, location, relationship depth).
- **Missing attribute context in audit logs**: When an ABAC decision is denied, the audit log must include the full attribute set. Without it, debugging denials is nearly impossible.
- **Not caching PDP decisions**: ABAC evaluation is expensive. Cache aggressively; invalidate on attribute changes (user role changes, resource reclassification).

---

# Failure Modes

- **Missing Attribute**: If an attribute referenced in a policy is null or undefined, the expression evaluation fails. The PDP may return deny (safe) or throw an error (unsafe). Always provide default values.
- **Attribute Drift**: Attributes in the policy engine diverge from the actual application data model. Old policies reference deleted attributes → evaluation always fails. Version policies with data model.
- **PDP Unavailability**: External PDP times out. All authorization decisions fail. Mitigation: circuit breaker + local cache + fallback to RBAC.

---

# Related Knowledge Units

- Prerequisites: RBAC design, Gates/Policies, Spatie Permission
- Related: ReBAC (relationship-based authorization), Policy Decision Point architecture
- Advanced Follow-up: Permit.io Laravel integration, Custom PDP implementation with boolean expression engine, Attribute-based policy testing strategies

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
