# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authorization
**Knowledge Unit:** Role-Based Access Control (RBAC)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | RBAC vs Gates/Policies vs ABAC | Choosing authorization model | architectural, maintainability, security |
| 2 | Permission Granularity Design | Defining permission scope and naming | security, maintainability |
| 3 | Role Hierarchy Strategy | How roles relate to each other | maintainability, architectural |

---

# Architecture-Level Decision Trees

---

## RBAC vs Gates/Policies vs ABAC

---

## Decision Context

Choosing the authorization architecture: RBAC (role-permission database), Gates/Policies (code-based), or ABAC (attribute-based with rules engine).

---

## Decision Criteria

* architectural
* maintainability
* security

---

## Decision Tree

Do permissions need to be managed by admins at runtime (no code deployment)?
↓
YES → RBAC (spatie/laravel-permission — database-driven roles and permissions)
NO → Are permissions model-specific (vary per resource type and ownership)?
    YES → Gates/Policies (code-based, compiled with deployment, model-specific)
    NO → Is authorization based on complex attributes (user location, time, device, risk score)?
        YES → ABAC (attribute-based rules engine — more complex)
        NO → Gates/Policies (simple boolean authorization)

Is this a simple yes/no admin check?
↓
YES → Gates or `is_admin` flag (simplest, no package needed)
NO → Do you need role-permission management UI for admins?
    YES → RBAC (spatie/laravel-permission with admin UI)
    NO → Gates/Policies (developer-managed)

---

## Rationale

RBAC is the right choice when admins need to manage roles and permissions without developer involvement. Gates/Policies are simpler for developer-managed authorization. ABAC is overkill unless authorization depends on dynamic attributes (time, location, risk). Many applications combine RBAC for role management with Policies for model-specific checks.

---

## Recommended Default

**Default:** RBAC (spatie/laravel-permission) for admin-managed permissions; Policies for model-specific logic; both can coexist
**Reason:** RBAC provides runtime permission management without code deployment. Policies handle model-specific authorization (ownership checks). The two complement each other — `$user->can()` works with both Spatie permissions and Policy methods.

---

## Risks Of Wrong Choice

- Gates/Policies for runtime-managed permissions: every permission change requires code deploy
- RBAC for simple admin check: unnecessary complexity, database queries for a boolean flag
- ABAC for simple app: rules engine complexity, harder to debug, over-engineering
- No authorization at all: any authenticated user can access any resource

---

## Related Rules

- Check Permissions, Never Roles, in Application Code (05-rules.md)
- Design Permissions as Granular resource.action Strings (05-rules.md)
- Seed All Permissions — Never Create Dynamically in Code (05-rules.md)
- Assign Permissions to Roles, Never Directly to Users (05-rules.md)

---

## Related Skills

- Design Role-Based Access Control with Permission-Centric Authorization (06-skills.md)
- Create Model Policies for Resource-Based Authorization (06-skills.md)

---

## Permission Granularity Design

---

## Decision Context

How granular to make permissions — action-level (`articles.edit`, `articles.delete`) vs resource-level (`manage-articles`).

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Do different users need different levels of access to the same resource?
↓
YES → Action-level granularity (separate permissions for each CRUD action)
NO → Resource-level permissions may be sufficient

Are there compliance requirements for separation of duties?
↓
YES → Action-level granularity (e.g., `orders.create` vs `orders.approve` must be separate users)
NO → Action-level still preferred for flexibility

Is the number of permissions manageable (<50)?
↓
YES → Action-level granularity for all resources
NO → Consider grouping less-sensitive resources with broader permissions

Are permissions exposed to end users in a settings UI?
↓
YES → Action-level granularity (users need fine-grained control)
NO → Action-level still preferred for internal management

---

## Rationale

Action-level permissions (`articles.edit`, `articles.delete`) implement the principle of least privilege. A user may need to edit articles but not delete them. Resource-level permissions (`manage-articles`) force all-or-nothing grants. The `resource.action` naming convention is self-documenting and consistent with OAuth2 scope best practices.

---

## Recommended Default

**Default:** Action-level granularity with `resource.action` naming (e.g., `articles.edit`, `articles.delete`, `articles.publish`)
**Reason:** Action-level permissions provide maximum flexibility for role design. A new role can combine any set of granular permissions. Broad permissions limit future role design possibilities without refactoring.

---

## Risks Of Wrong Choice

- Single `admin` permission: all-or-nothing, no partial access possible
- Too granular (`articles.edit.title`): overly complex, hard to manage, unlikely needed
- Resource-level for sensitive actions: cannot separate edit from delete, approve from create
- Mixing naming conventions: confusion, inconsistency, hard to audit

---

## Related Rules

- Design Permissions as Granular resource.action Strings (05-rules.md)
- Check Permissions, Never Roles, in Application Code (05-rules.md)
- Assign Permissions to Roles, Never Directly to Users (05-rules.md)

---

## Related Skills

- Design Role-Based Access Control with Permission-Centric Authorization (06-skills.md)

---

## Role Hierarchy Strategy

---

## Decision Context

How roles relate to each other — whether roles automatically inherit permissions from other roles (hierarchical) or are independent (flat).

---

## Decision Criteria

* maintainability
* security

---

## Decision Tree

Do higher-level roles include all permissions of lower-level roles?
↓
YES → Hierarchical roles (admin inherits all editor permissions, editor inherits viewer permissions)
NO → Flat roles (each role has explicit permission set, no inheritance)

Is role hierarchy transparent to permission checks?
↓
YES → Hierarchical allowed (permission checks still use `can('permission')`, not role checks)
NO → Flat roles preferred (simpler, more auditable)

Are there separation-of-duty constraints (user cannot have both auditor and admin)?
↓
YES → Flat roles (enforce at assignment time; hierarchy makes separation harder)
NO → Hierarchical or flat both work

Is role inheritance simple (single chain) or complex (DAG with multiple parents)?
↓
SIMPLE → Hierarchical roles acceptable
COMPLEX → Flat roles (hierarchy DAG is hard to maintain and audit)

---

## Rationale

Hierarchical roles reduce duplication (admin doesn't need to list all editor permissions) but can create unexpected permission grants when the hierarchy changes. Flat roles (each role with explicit permissions) are more auditable and prevent unintended permission inheritance. Spatie's package supports both via `givePermissionTo` (flat) and `$role->givePermissionTo($otherRole)` (hierarchy).

---

## Recommended Default

**Default:** Flat roles with explicit permission sets; hierarchy only when roles clearly form a strict superset chain
**Reason:** Flat roles are more auditable — you can see exactly what a role grants without tracing inheritance chains. Hierarchy is acceptable for simple chains (viewer → editor → admin) where superset relationships are stable and well-understood.

---

## Risks Of Wrong Choice

- Complex hierarchy: unintended permission grants when middle role changes, hard to audit
- Flat roles with high overlap: duplicated permission lists across roles, maintenance burden
- Hierarchy without documentation: new developers don't understand permission sources
- No super-admin role: users with maximum permissions must have every permission individually assigned

---

## Related Rules

- Check Permissions, Never Roles, in Application Code (05-rules.md)
- Seed All Permissions — Never Create Dynamically in Code (05-rules.md)
- Assign Permissions to Roles, Never Directly to Users (05-rules.md)

---

## Related Skills

- Design Role-Based Access Control with Permission-Centric Authorization (06-skills.md)
