# Metadata

Domain: Security & Identity Engineering
Subdomain: Authorization
Knowledge Unit: ReBAC relationship-based authorization
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Relationship-Based Access Control (ReBAC) authorizes actions based on the relationships between users and resources, rather than static attributes or roles. Inspired by Google Zanzibar, ReBAC models authorization as a graph: users are nodes, resources are nodes, and edges represent relationships (owner, editor, viewer). A user can perform an action if a path exists in the graph connecting them to the resource with the required relationship. ReBAC is the most expressive authorization model but also the most complex to implement. In Laravel, ReBAC is typically implemented via external PDPs (Permit.io, Auth0 FGA) or custom graph-based authorization services.

---

# Core Concepts

- **Relationship Graph**: Directed edges between subjects (users) and resources. `user:1 OWNER document:42`, `user:2 EDITOR document:42`, `team:engineering VIEWER document:42`.
- **Edge Expansion**: Relationships can propagate through the graph. If `user:1 MEMBER team:engineering` and `team:engineering VIEWER document:42`, then `user:1 VIEWER document:42` via transitivity.
- **Tuple**: A (object, relation, subject) triple: `(document:42, viewer, user:1)`.
- **Zanzibar Model**: Google's ReBAC system (2023 OSDI paper). Defines namespaces, relations, and permission checks as graph traversal. Most ReBAC implementations reference Zanzibar.
- **Check**: `can(user:1, viewer, document:42)` → traverse graph from document:42 following edges backward to user:1. If a path exists with matching relation, return allowed.

---

# Mental Models

- **Graph Traversal**: Think of ReBAC as "can user reach resource through permission edges?" Like a social graph where privacy settings determine visibility.
- **RBAC → ABAC → ReBAC**: RBAC answers "who are you?" ABAC answers "what are the attributes?" ReBAC answers "how are you connected?"

---

# Patterns

## Organizational Hierarchy ReBAC
- **Purpose**: Users in parent org inherit permissions from child org resources.
- **Implementation**: `org:parrent PARENT org:child`, `org:child VIEWER document:42`. Check: `can(user:1, viewer, document:42)` → traverses `user MEMBER org:parent PARENT org:child VIEWER document:42`.
- **Benefits**: Automatic permission inheritance through org structure.
- **Tradeoffs**: Graph depth affects query performance.

## Team-Based Sharing ReBAC
- **Purpose**: Resource shared with a team, all team members inherit access.
- **Implementation**: `team:engineering VIEWER document:42`, `user:1 MEMBER team:engineering`.
- **Benefits**: One relationship assignment grants access to all team members.

## Ownership ReBAC
- **Purpose**: Owner has full control; can delegate viewer/editor roles.
- **Implementation**: `document:42 OWNER user:1`. Owner can add `document:42 EDITOR user:2`.
- **Benefits**: Resource-level delegation without admin intervention.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Custom ReBAC vs external PDP | In-house expertise vs speed of implementation | Custom for core competency in authorization; external (Permit.io FGA, Auth0 FGA) for rapid adoption |
| Graph DB (Neo4j) vs relational store | Performance vs operational simplicity | Graph DB for large-scale ReBAC (>1M tuples); relational with adjacency lists for smaller deployments |
| ReBAC vs RBAC + custom code | Genuine need for relationship resolution | Start with RBAC. Add ReBAC only when relationship traversal cannot be expressed in RBAC or ABAC |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Natural model for shared resources (Google Docs, Dropbox) | Graph traversal complexity | "Who has access to this resource?" requires full graph walk — expensive for large permission sets |
| Relationship inheritance reduces permission assignment overhead | Cascade rules are hard to debug | A user gains access through a chain of 5 edges — tracing why requires traversing the entire chain |
| Fine-grained, dynamic permission model | No native Laravel support | Must implement or integrate an external PDP — cannot use Gates/Policies alone |

---

# Performance Considerations

- Graph traversal depth is the primary performance factor. Limit to 3-5 hops in production.
- Cache `check()` results with TTL. Invalidate on relationship changes (edge addition/removal).
- For large deployments, precompute permission sets on relationship changes rather than computing on every `check()`.
- Database indexes: composite indexes on (object, relation) and (subject, relation) for efficient edge lookups.

---

# Production Considerations

- **Edge Consistency**: ReBAC models are eventually consistent in production. Between the time an edge is added and the cache is invalidated, a user may see inconsistent authorization. Accept this window or use strong consistency with performance penalty.
- **Audit Trail**: Log every relationship change (who added/removed what edge). ReBAC changes are permission changes and must be auditable.
- **Graph Visualization**: Build an admin UI to visualize the relationship graph. Without it, debugging authorization issues is near-impossible.
- **Edge Propagation Limits**: Prevent recursive relationship assignments that cause infinite traversal. Limit depth.

---

# Common Mistakes

- **Using ReBAC when RBAC suffices**: ReBAC is complex. If "user can edit documents they own" is expressible as `$user->id === $document->user_id`, do not use ReBAC.
- **Not limiting graph traversal depth**: Unbounded traversal can time out or crash. Always set max depth.
- **Assuming ReBAC replaces all other auth**: ReBAC handles relationship-based checks. Combine with RBAC for role-based checks and ABAC for attribute-based checks.
- **Circular relationships**: `user:1 MANAGES user:2` and `user:2 MANAGES user:1` — traversal gets stuck. Detect and break cycles.

---

# Failure Modes

- **Cycle in Relationship Graph**: `A IS_PARENT_OF B IS_PARENT_OF A` — infinite recursion during traversal. Implement cycle detection with visited-set tracking.
- **Cache Stale After Edge Removal**: A removed edge still exists in cache. User retains access until cache expiry. Short cache TTL for sensitive resources.
- **Orphaned Resource**: Resource with no ownership edge — no user has owner-level access. Resource is effectively locked. Enforce at-least-one-owner constraint.

---

# Related Knowledge Units

- Prerequisites: RBAC design, ABAC attribute-based authorization
- Related: Policies (model authorization), Spatie Permission (team-scoped permissions)
- Advanced Follow-up: Zanzibar protocol implementation, ReBAC with Neo4j in Laravel, Permit.io FGA integration

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
