# Authorization Core

## Objective

Define the fundamental architecture, principles, and models for authorization in Laravel applications. This document establishes the authorization philosophy that all other authorization skill documents build upon.

## Core Philosophy

Authorization determines what an authenticated identity can do. It must be explicit, granular, testable, and auditable. Authorization must never rely on authentication alone — they are separate concerns.

## Architecture Standards

### Authorization Models

#### RBAC (Role-Based Access Control)

Users are assigned roles. Roles have permissions. Permissions grant access to resources.

```
User ──> Role ──> Permission ──> Resource
```

**When to use:** Simple hierarchies, clear job functions, moderate scale.

#### ABAC (Attribute-Based Access Control)

Access decisions use attributes of the user, resource, action, and environment.

```
Policy(User.role, Resource.owner, Action.type, Environment.time) → Grant/Deny
```

**When to use:** Complex rules, multi-tenant, fine-grained control, high scale.

#### PBAC (Policy-Based Access Control)

Centralized policies define access rules independently of users and roles.

```
Policy {
  Effect: Allow,
  Action: read,
  Resource: document:*,
  Condition: user.department == resource.department
}
```

**When to use:** Large organizations, compliance-heavy, cross-system.

#### ReBAC (Relationship-Based Access Control)

Access is determined by relationships between users and resources.

```
User ──> owns ──> Document
User ──> collaborates ──> Document (via team membership)
```

**When to use:** Social, collaborative, hierarchical (Google Docs, GitHub).

### Authorization Layer Architecture

```
┌──────────────────────────────────┐
│        Presentation Layer        │  — Controllers, Middleware, Blade
├──────────────────────────────────┤
│      Authorization Layer         │  — Gates, Policies, Middleware
├──────────────────────────────────┤
│        Decision Layer            │  — RoleResolver, PermissionResolver
├──────────────────────────────────┤
│        Evaluation Layer          │  — Rule engines, ABAC evaluator
├──────────────────────────────────┤
│        Data Layer                │  — Roles, Permissions, Policies tables
└──────────────────────────────────┘
```

### Decision Flow

```
Request ──> Authenticate ──> Authorize ──> Execute
                │                │
          401 Unauthorized   403 Forbidden
```

## Best Practices

### Least Privilege

Every user, service, and process must operate with the minimum permissions necessary.

```php
// Good — specific permission
Gate::define('approve-report', fn (User $user) => $user->can('reports:approve'));

// Bad — blanket admin check
Gate::define('approve-report', fn (User $user) => $user->is_admin);
```

### Separation of Duties

No single user should have conflicting permissions (e.g., creating and approving a purchase order).

```php
class SeparationOfDuties
{
    public function canApprove(User $approver, PurchaseOrder $po): bool
    {
        // Creator cannot approve their own PO
        if ($approver->id === $po->created_by) {
            return false;
        }

        // Must have approve permission
        if (!$approver->can('po:approve')) {
            return false;
        }

        // Must not be in same department as creator
        if ($approver->department_id === $po->creator->department_id) {
            return false;
        }

        return true;
    }
}
```

### Permission Inheritance

Permissions should inherit through role hierarchies:

```php
// Role hierarchy: Super Admin > Admin > Editor > Viewer
// Each role inherits all permissions from roles below it
class RoleHierarchy
{
    private array $hierarchy = [
        'super_admin' => ['admin', 'editor', 'viewer'],
        'admin' => ['editor', 'viewer'],
        'editor' => ['viewer'],
        'viewer' => [],
    ];

    public function getInheritedRoles(string $role): array
    {
        $roles = [$role];
        foreach ($this->hierarchy[$role] as $child) {
            $roles = array_merge($roles, $this->getInheritedRoles($child));
        }
        return array_unique($roles);
    }
}
```

## Clean Code Rules

1. Authorization logic must never be in controllers
2. Each authorization concern must have a single responsibility
3. Authorization rules must be unit-testable without HTTP
4. Policy names must match resource names (PostPolicy for Post)
5. Gate names must use verb-noun convention (`update-post`, `delete-comment`)
6. Authorization failures must be explicit (not swallowed exceptions)
7. Permission checks must use the `User` model, not helper functions

## Scalability Considerations

| Strategy | Description | When to Use |
|----------|-------------|-------------|
| Permission caching | Cache resolved permissions per user | High-traffic, static roles |
| Preloaded permissions | Load all permissions at login | Moderate traffic, stable role set |
| Lazy evaluation | Check on demand | Low traffic, dynamic permissions |
| Materialized paths | Pre-compute permission paths | Large role hierarchies |

### Permission Caching

```php
class CachedPermissionResolver
{
    private const CACHE_TTL = 3600; // 1 hour

    public function getPermissions(User $user): array
    {
        return Cache::remember(
            "permissions:user:{$user->id}",
            self::CACHE_TTL,
            fn () => $this->resolvePermissions($user),
        );
    }

    public function invalidate(User $user): void
    {
        Cache::forget("permissions:user:{$user->id}");
    }

    private function resolvePermissions(User $user): array
    {
        $roles = $user->roles()->with('permissions')->get();
        $permissions = collect();

        foreach ($roles as $role) {
            $permissions = $permissions->merge(
                $role->permissions->pluck('name')
            );
        }

        // Add direct user permissions
        $permissions = $permissions->merge(
            $user->permissions->pluck('name')
        );

        return $permissions->unique()->values()->toArray();
    }
}
```

## Enterprise Considerations

### Authorization Audit Trail

```php
// Every authorization decision must be logged
class AuthorizationLogger
{
    public function logDecision(
        User $user,
        string $ability,
        mixed $arguments,
        bool $result,
        string $context = null,
    ): void {
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'authorization',
            'description' => $result ? 'Authorized' : 'Denied',
            'metadata' => [
                'ability' => $ability,
                'arguments' => $this->serializeArguments($arguments),
                'result' => $result,
                'context' => $context,
                'ip' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ],
        ]);
    }
}
```

### Compliance Requirements

- **SOC2:** Access controls must be reviewed quarterly, termination must trigger immediate deprovisioning
- **GDPR:** Authorization decisions must not rely on protected characteristics
- **HIPAA:** Minimum necessary standard — only grant access needed for job function
- **PCI-DSS:** Strict separation of duties, quarterly access reviews

## Authorization Anti-Patterns

| Anti-Pattern | Why It's Wrong | Solution |
|-------------|---------------|----------|
| AuthN/AuthZ mixing | `Auth::check()` in authorization logic | Use `$this->authorize()` always |
| Boolean flags | `is_admin`, `is_editor` on User model | Use role-based or permission-based system |
| Inline checks | `if ($user->role === 'admin')` scattered everywhere | Centralized Gates and Policies |
| Silent failures | Authorization check fails but returns generic 500 | Return explicit 403 Forbidden |
| Overly broad roles | Single "admin" role with all permissions | Granular role definitions with specific scopes |
| Permissions in session | Stale permissions after role change | Always check against database/cache |
| No permission caching | N+1 queries on every page load | Cache resolved permissions |
| Authorization in views | Business logic leaks to presentation | Use dedicated View Presenters or DTOs |

## AI Coding Agent Rules

1. Always authorize every state-changing operation — never skip
2. Use Policies for model-based authorization, Gates for non-model operations
3. Authorization logic must be in dedicated Policy classes or Gate definitions
4. Never check `Auth::check()` as a substitute for `$this->authorize()`
5. Permission names must follow `{resource}:{action}` convention
6. Cache resolved permissions with a user-level cache key
7. Log all authorization denials for security monitoring
8. Authorization failures must return `403` with no sensitive details
9. Test authorization rules in isolation (unit tests) and integration (feature tests)
10. Multi-tenant authorization must always include tenant context

## Production Checklist

- [ ] Authorization model selected (RBAC/ABAC/PBAC/ReBAC) and documented
- [ ] All state-changing operations have explicit authorization checks
- [ ] Permission caching implemented and invalidated on role changes
- [ ] Authorization audit logging is active
- [ ] Least privilege principle verified across all roles
- [ ] Separation of duties enforced for sensitive operations
- [ ] Permission inheritance documented and tested
- [ ] Authorization test coverage ≥ 90%
- [ ] Multi-tenant authorization isolation verified
- [ ] Compliance requirements mapped to authorization controls
