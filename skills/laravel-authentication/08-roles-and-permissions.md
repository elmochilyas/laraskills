# Roles & Permissions

## Objective

Define production-grade role and permission system architecture for Laravel applications, covering hierarchical roles, dynamic permissions, team-based permissions, caching strategies, and enterprise permission management.

## Core Philosophy

Roles group permissions into meaningful sets. Permissions are the atomic unit of access control. Both must be explicit, auditable, and cacheable. Role engineering must follow the principle of least privilege.

## Architecture Standards

### Data Model

```php
// Database schema — roles & permissions (separate tables)
Schema::create('roles', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name')->unique();        // admin, editor, viewer
    $table->string('display_name');           // Administrator
    $table->text('description')->nullable();
    $table->string('guard_name')->default('web');
    $table->boolean('is_system')->default(false); // System roles cannot be deleted
    $table->timestamps();
});

Schema::create('permissions', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name')->unique();         // documents:read, documents:write
    $table->string('display_name');           // Read Documents
    $table->text('description')->nullable();
    $table->string('group')->nullable();       // documents, users, settings
    $table->string('guard_name')->default('web');
    $table->timestamps();
});

Schema::create('role_user', function (Blueprint $table) {
    $table->foreignUuid('role_id')->constrained()->cascadeOnDelete();
    $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
    $table->primary(['role_id', 'user_id']);
});

Schema::create('permission_role', function (Blueprint $table) {
    $table->foreignUuid('permission_id')->constrained()->cascadeOnDelete();
    $table->foreignUuid('role_id')->constrained()->cascadeOnDelete();
    $table->primary(['permission_id', 'role_id']);
});

Schema::create('permission_user', function (Blueprint $table) {
    $table->foreignUuid('permission_id')->constrained()->cascadeOnDelete();
    $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
    $table->primary(['permission_id', 'user_id']);
});
```

### Permission Naming Convention

```
{resource}:{action}       # Standard
{domain}:{resource}:{action}  # Cross-domain

# Actions
{resource}:read           # View listing or single item
{resource}:write          # Create or update
{resource}:create         # Create only
{resource}:update         # Update only
{resource}:delete         # Delete
{resource}:restore        # Restore soft-deleted
{resource}:publish        # Publish/approve
{resource}:manage         # All actions (admin-level)

# Examples
documents:read
documents:write
documents:delete
users:manage
reports:export
admin:settings
```

## Role Systems

### Hierarchical Roles

```php
class RoleService
{
    private array $hierarchy = [
        'super-admin' => ['admin', 'editor', 'viewer'],
        'admin' => ['editor', 'viewer'],
        'editor' => ['viewer'],
        'viewer' => [],
    ];

    public function getEffectivePermissions(Role $role): Collection
    {
        $roles = $this->getInheritedRoles($role->name);

        return Permission::whereHas('roles', fn ($q) =>
            $q->whereIn('name', $roles)
        )->get();
    }

    private function getInheritedRoles(string $roleName): array
    {
        $roles = [$roleName];
        foreach ($this->hierarchy[$roleName] ?? [] as $child) {
            $roles = array_merge($roles, $this->getInheritedRoles($child));
        }
        return $roles;
    }
}
```

### Role Assignment Strategies

```php
// Strategy 1: Direct assignment (most common)
$user->assignRole('editor');

// Strategy 2: Role by department
$user->assignRole($department->default_role);

// Strategy 3: Role by plan (SaaS)
$user->assignRole($plan->role);

// Strategy 4: Temporary elevation
$user->assignRole('admin', expiresAt: now()->addHours(4));

// Strategy 5: Contextual role (tenant-specific)
$user->assignRole('admin', tenant: $tenant);

// Removal
$user->removeRole('editor');
$user->syncRoles(['admin', 'editor']); // Replace all roles
$user->syncPermissions(['documents:read', 'documents:write']);
```

### Team-Based Permissions

```php
class TeamPermissionManager
{
    public function getTeamPermissions(User $user, Team $team): Collection
    {
        return $user->teamRoles()
            ->wherePivot('team_id', $team->id)
            ->first()?->permissions ?? collect();
    }

    public function assignTeamRole(User $user, Team $team, Role $role): void
    {
        $user->teamRoles()->attach($role, ['team_id' => $team->id]);
    }

    public function removeTeamRole(User $user, Team $team, Role $role): void
    {
        $user->teamRoles()->wherePivot('team_id', $team->id)->detach($role);
    }
}
```

## Dynamic Permissions

### Feature Flags as Permissions

```php
class FeaturePermissionProvider
{
    public function getFeaturePermission(string $feature): string
    {
        return "feature:{$feature}";
    }

    public function hasFeatureAccess(User $user, string $feature): bool
    {
        return $user->can($this->getFeaturePermission($feature));
    }
}
```

### Computed Permissions

```php
class ComputedPermissionEvaluator
{
    public function evaluate(User $user, string $permission): bool
    {
        return match ($permission) {
            'reports:view-own' => true, // All users can view own reports
            'reports:view-all' => $user->department === 'analytics',
            'reports:export' => $user->hasVerifiedEmail() && $user->can('reports:read'),
            'admin:impersonate' => $user->hasRole('super-admin'),
            default => $user->hasDirectPermission($permission),
        };
    }
}
```

## Permission Caching

### Cache Strategy

```php
class PermissionCacheManager
{
    private const CACHE_TTL = 3600;
    private const CACHE_PREFIX = 'permissions:';

    public function getUserPermissions(User $user): array
    {
        return Cache::remember(
            $this->cacheKey($user),
            self::CACHE_TTL,
            fn () => $this->buildPermissionSet($user),
        );
    }

    public function invalidateUser(User $user): void
    {
        Cache::forget($this->cacheKey($user));
    }

    public function invalidateAll(): void
    {
        Cache::tags(['permissions'])->flush();
    }

    private function buildPermissionSet(User $user): array
    {
        $permissions = collect();

        // 1. Role-based permissions (with inheritance)
        foreach ($user->roles as $role) {
            $permissions = $permissions->merge(
                $this->getInheritedPermissions($role)
            );
        }

        // 2. Direct permissions (override)
        $permissions = $permissions->merge(
            $user->permissions->pluck('name')
        );

        return $permissions->unique()->values()->toArray();
    }

    private function cacheKey(User $user): string
    {
        return self::CACHE_PREFIX . "user:{$user->id}";
    }
}
```

### Cache Invalidation

```php
// Invalidate on role/permission changes
class RoleObserver
{
    public function updated(Role $role): void
    {
        Cache::tags(['permissions'])->flush();
    }

    public function deleted(Role $role): void
    {
        Cache::tags(['permissions'])->flush();
    }
}

// Invalidate on user role assignment
class UserRoleObserver
{
    public function attached(User $user, $relationName, $ids): void
    {
        app(PermissionCacheManager::class)->invalidateUser($user);
    }

    public function detached(User $user, $relationName, $ids): void
    {
        app(PermissionCacheManager::class)->invalidateUser($user);
    }
}
```

## Enterprise Permission Architecture

### Admin UI Permissions

```php
class AdminPermissionGroup
{
    public function __construct(
        public readonly string $group,     // documents
        public readonly string $label,     // Documents
        public readonly array $permissions // [Permission, Permission, ...]
    ) {}
}

// Permission groups for admin panel
class PermissionRegistry
{
    public function getGroups(): array
    {
        $permissions = Permission::all()->groupBy('group');

        return $permissions->map(fn ($perms, $group) => new AdminPermissionGroup(
            group: $group,
            label: Str::title($group),
            permissions: $perms->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'display_name' => $p->display_name,
            ])->values()->toArray(),
        ))->values()->toArray();
    }
}
```

### Permission Export for Compliance

```php
class PermissionAuditExport
{
    public function generate(): array
    {
        return User::with('roles.permissions', 'permissions')
            ->get()
            ->map(fn ($user) => [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'roles' => $user->roles->pluck('name'),
                'direct_permissions' => $user->permissions->pluck('name'),
                'effective_permissions' => $user->getAllPermissions()->pluck('name'),
            ])
            ->toArray();
    }
}
```

### Bulk Permission Operations

```php
class BulkPermissionService
{
    public function assignToDepartment(Department $department, Permission $permission): void
    {
        $department->users->each(fn ($user) => $user->givePermissionTo($permission));
    }

    public function revokeFromDepartment(Department $department, Permission $permission): void
    {
        $department->users->each(fn ($user) => $user->revokePermissionTo($permission));
    }

    public function syncForRole(Role $role, array $permissionNames): void
    {
        $permissions = Permission::whereIn('name', $permissionNames)->get();
        $role->syncPermissions($permissions);
        Cache::tags(['permissions'])->flush();
    }
}
```

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Boolean flags instead of roles | `is_admin`, `is_editor` on User | Use role/permission tables |
| No permission caching | N+1 queries on every request | Cache with user-level keys |
| Overly broad permissions | Single `admin` role with everything | Granular roles with specific permissions |
| Mixing roles and permissions | `user->hasRole('documents:read')` | Roles group permissions — check permissions, not roles |
| No direct permissions | Cannot grant one-off access | Support direct permissions (bypassing roles) |
| Permissions not seeded | Missing permissions in production | Seed all permissions, use idempotent seeder |
| No permission documentation | Developers unsure what permissions exist | Registry/model with groups and descriptions |

## AI Coding Agent Rules

1. Permission names must follow `{resource}:{action}` convention
2. Roles must group multiple permissions — never use a role as a permission
3. Cache resolved permissions with user-level keys and invalidate on change
4. Support both role-based and direct permissions
5. Role hierarchies must be documented and enforced in code
6. Permission changes must invalidate relevant caches immediately
7. All permissions must be seeded and documented in a registry
8. Direct permissions must override role-based permissions
9. Team/tenant roles must be isolated from global roles
10. Permission audits must be exportable for compliance reviews

## Production Checklist

- [ ] Permission naming convention documented and enforced
- [ ] Permission seeder creates all permissions idempotently
- [ ] Permission caching implemented with invalidation on changes
- [ ] Role hierarchy defined and tested
- [ ] Direct user permissions supported (bypass roles)
- [ ] Admin UI for role/permission management exists
- [ ] Permission audit export available
- [ ] Team/tenant role isolation verified
- [ ] Role observer registered for cache invalidation
- [ ] Permission test coverage: every permission checked in at least one test
