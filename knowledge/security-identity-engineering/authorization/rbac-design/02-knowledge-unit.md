# Metadata

Domain: Security & Identity Engineering
Subdomain: Authorization
Knowledge Unit: RBAC design (hierarchical, constrained)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Role-Based Access Control (RBAC) in Laravel is typically implemented via Spatie `laravel-permission`, but the design patterns extend beyond package configuration. Hierarchical RBAC allows roles to inherit permissions from parent roles (e.g., `Editor` inherits `Viewer` permissions plus edit permissions). Constrained RBAC enforces separation-of-duty constraints (e.g., same user cannot be both `Purchaser` and `Approver`). The fundamental principle: permissions are atomic, roles group permissions, and authorization code checks permissions — not roles. RBAC is the most common authorization model for Laravel SaaS applications, with ABAC and ReBAC used for more complex attribute-driven or relationship-driven scenarios.

---

# Core Concepts

- **Role Hierarchy**: Roles arranged in a tree where child roles inherit parent role permissions. Example: `Admin > Editor > Viewer`. Viewer can read; Editor can read and write; Admin can read, write, and delete.
- **Constrained RBAC (Separation of Duty)**: Static (SoD): mutually exclusive roles defined at design time (a user cannot have both `Auditor` and `Admin` roles). Dynamic (DSD): mutually exclusive roles at runtime (a user can approve or initiate a purchase order, but not both for the same order).
- **Permission-Centric Design**: The system checks permissions (`$user->can('approve-purchase')`), not roles (`$user->hasRole('approver')`). Roles are organizational containers for permissions.
- **Role Explosion**: Anti-pattern where fine-grained roles (e.g., `Post-Creator`, `Post-Editor`, `Post-Publisher`, `Post-Deleter`) replace direct permission assignments. Mitigation: use roles for job functions, not individual permissions.

---

# Mental Models

- **Groups vs Permissions**: Think of roles as Active Directory security groups. Users are in groups; groups have permissions. Code checks "can user do X?" not "is user in group Y?"
- **Permission as Contract**: A permission (`publish articles`) is a contract between the authorization system and the code. The code demands `publish articles`; the authorization system grants it. The role structure is irrelevant to the code.

---

# Patterns

## Core + App Permissions Pattern
- **Purpose**: Separate foundational permissions (user management, system config) from application-specific permissions (create post, publish article).
- **Implementation**: Core permissions assigned to `Admin` role. App permissions managed by feature owners. Core permissions cannot be modified at tenant level.
- **Benefits**: Platform-level control over critical operations; tenant-level flexibility for feature permissions.

## Role Hierarchy via Code (Not Database)
- **Purpose**: Hierarchical role inheritance without database schema complexity.
- **Implementation**: In `AuthServiceProvider::boot()`, define parent-child relationships: `Gate::define('edit-articles', fn($user) => $user->hasPermissionTo('edit-articles') || $user->hasRole('admin'))`.
- **Benefits**: Explicit, visible hierarchy. No additional DB tables.
- **Tradeoffs**: Hierarchy logic lives in code, not configuration.

## Separation-of-Duty Enforcement Pattern
- **Purpose**: Prevent single user from having conflicting roles.
- **Implementation**: Validation rule in role assignment: check if user already has any role in the excluded set. Enforce at the controller/service layer.
- **Benefits**: Compliance with financial authorization requirements (SOX, SOC2).
- **Tradeoffs**: Additional validation logic; must handle role assignment and unassignment flows.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Flat roles vs hierarchical roles | Simple app vs complex permission inheritance | Start flat, add hierarchy only when permission duplication becomes unmanageable |
| Code-based hierarchy vs DB hierarchy | Explicit control vs runtime configurability | Code for stable hierarchies; DB for customer-configurable role trees |
| SoD enforcement at UI vs DB vs middleware | Defense in depth layers | Enforce at service layer (business logic), validate at UI layer (UX), harden at DB (constraints) |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Role grouping simplifies permission management | Role explosion if modeling is too granular | Too many roles is as hard to manage as raw permissions |
| Hierarchy reduces redundant permission assignments | Inheritance creates implicit permission relationships | Developer adds permission to parent role, unexpectedly granting access to all child roles |
| SoD prevents conflict of interest | SoD constraints complicate user management | Admin cannot easily reassign a user from Purchaser to Approver without removing the original role first |

---

# Performance Considerations

- Hierarchical role checks require additional DB/cache lookups per permission check. Chain depth increases query count linearly.
- Cache hierarchy: `PermissionRegistrar` caches permission→role mappings. Hierarchy evaluation is in-memory.
- SoD validation adds a query on role assignment. Negligible for single assignments; batch assignments may need optimization.

---

# Production Considerations

- **Role Naming Convention**: Use `kebab-case` for role names (`super-admin`, `content-editor`). Consistent with permission naming.
- **Permission Naming Convention**: Use `{resource}:{action}` format (`articles:create`, `users:delete`). Compatible with Spatie wildcard permissions.
- **Role Seeding**: Seed all roles and permissions in `RolesAndPermissionsSeeder`. Run `php artisan db:seed --class=RolesAndPermissionsSeeder` on every environment sync.
- **Audit Role Changes**: Log all role assignments and unassignments via Spatie Activitylog or custom event listeners.

---

# Common Mistakes

- **Checking roles in business logic**: `if ($user->hasRole('editor'))` — brittle. Role structure changes break authorization. Check permissions.
- **Over-hierarchizing**: `Admin > Editor > Reviewer > Author > Contributor > Subscriber`. Five-level hierarchy with one permission difference between levels. Flatten.
- **Skipping SoD constraints until compliance audit**: Retrofitting separation-of-duty into a permission system that assumed no constraints is expensive. Design for SoD from the start if regulations require it.
- **Allowing role self-assignment**: Users with role management permissions assigning themselves conflicting roles.

---

# Failure Modes

- **Circular Role Hierarchy**: `Admin` inherits from `Editor`, `Editor` inherits from `Admin`. Creates infinite loop in permission resolution. Spatie's flat model avoids this, but custom hierarchy implementations must guard against it.
- **Role Deletion Without Reassignment**: Deleting a role that users currently have — those users lose all permissions from that role. No automatic reassignment. Notify affected users.
- **Permission Drift**: Permissions are renamed or removed but roles still reference old names. `$user->can('old-permission')` returns false if the permission no longer exists in the DB, but no error is raised — it silently fails.

---

# Related Knowledge Units

- Prerequisites: Spatie laravel-permission (roles, permissions), Gates/Policies
- Related: ABAC attribute-based authorization, ReBAC relationship-based authorization
- Advanced Follow-up: RBAC hierarchy with wildcard permissions, SoD constraint implementation patterns, Migration from flat to hierarchical RBAC

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
