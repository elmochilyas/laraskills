# Anti-Patterns: Role-Based Access Control (RBAC)

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | Role-Based Access Control (RBAC) |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-RB-01 | Checking Roles Instead of Permissions | High | High | Medium |
| AP-RB-02 | Dynamic Permission Creation | High | Medium | Medium |
| AP-RB-03 | Direct Permission Assignment to Users | Medium | Medium | Medium |
| AP-RB-04 | Stale Permission Cache | High | Medium | Low |
| AP-RB-05 | Single Admin Role With All Permissions | Medium | High | High |

---

## Repository-Wide Anti-Patterns

- **$user->hasRole() in Application Code**: Using role checks instead of permission checks in business logic
- **No Permission Seeder**: Permissions created ad-hoc instead of seeded
- **Wildcard * Permission on Non-Admin Roles**: Granting broad access beyond the super-admin role

---

## 1. Checking Roles Instead of Permissions

### Category
Architecture · Maintainability

### Description
Using `$user->hasRole('editor')` or `@role('editor')` in application code instead of checking `$user->can('edit-articles')`, tying authorization to role names instead of stable permission primitives.

### Why It Happens
Role names are immediately available and intuitive. The question "Is this user an editor?" feels more natural than "Does this user have the edit-articles permission?" Role-based checks are the first pattern developers reach for when implementing authorization.

### Warning Signs
- `$user->hasRole('admin')`, `$user->hasRole('editor')` in controllers or services
- `@role('admin')` or `@hasRole('editor')` in Blade templates
- Permission added to a role but code still checks the old role name
- Renaming a role requires searching codebase for all references
- UI does not update when role permissions change

### Why Harmful
Role names are organizational conveniences that change over time. An `editor` role might be renamed to `content-manager` or split into `author` and `publisher`. Every `hasRole('editor')` check breaks on rename. More importantly, role checks are too coarse — a user might have the `edit-articles` permission through a different role, but the code that checks `hasRole('editor')` doesn't know about it.

### Real-World Consequences
- Role renamed from `editor` to `content-manager` — 47 references to `hasRole('editor')` must be updated
- User with `author` role that includes `edit-articles` permission is denied access because code checks `hasRole('editor')`
- Adding `edit-articles` to a new role doesn't grant access because code checks the old role name
- Permission audit is impossible because authorization is tied to roles, not permissions

### Preferred Alternative
Always use `$user->can('permission-name')` in application code. Reserve `hasRole()` for admin UI pages that manage role assignments.

### Refactoring Strategy
1. Audit all `hasRole()` and `@role` calls in the codebase
2. Replace each with the corresponding `$user->can('permission-name')` or `@can('permission-name')`
3. Ensure the permission name used matches what the old role check was protecting
4. For Blade, replace `@role('editor')` with `@can('edit-articles')`
5. Add tests to verify permission-based checks work correctly

### Detection Checklist
- [ ] Are there `hasRole()` calls in application code?
- [ ] Are `@role` or `@hasRole` directives used in Blade?
- [ ] Would renaming a role break authorization anywhere?
- [ ] Can a user with a non-obvious role perform the action?
- [ ] Are permission checks used consistently instead of role checks?

### Related Rules/Skills/Trees
- Check Permissions, Never Roles, in Application Code (05-rules.md)
- Design Role-Based Access Control with Permission-Centric Authorization (06-skills.md)

---

## 2. Dynamic Permission Creation

### Category
Maintainability · Security

### Description
Creating permissions dynamically in application code, controllers, or migrations instead of defining all permissions in database seeders.

### Why It Happens
Dynamic creation seems convenient — "if the permission doesn't exist, create it." It avoids the discipline of maintaining a seeder. The permission is created on first use and works immediately. The developer doesn't see the downstream consequences: auditability, version control, and cache consistency.

### Warning Signs
- `Permission::firstOrCreate(['name' => 'report.export'])` in controllers or services
- Permissions table has entries not found in any seeder file
- New permissions appear in the database without corresponding code changes
- Permission names are inconsistent or duplicated
- Permission cache needs frequent clearing because permissions are added outside seeders

### Why Harmful
Dynamic permission creation makes it impossible to know which permissions exist without querying the database. Permissions are not version-controlled — rolling back a deployment doesn't remove dynamically created permissions. The permissions table grows uncontrollably as different code paths create permissions with slightly different names. Auditing permissions requires comparing database state to code paths.

### Real-World Consequences
- Permissions table has 200 entries, 50 of which are typos or duplicates from dynamic creation
- Rollback doesn't remove dynamically created permissions — they persist in the database
- QA can't enumerate permissions because they're created at runtime
- Security audit can't verify permission coverage without understanding every code path
- Staging and production have different permission sets due to different usage patterns

### Preferred Alternative
Define all permissions in database seeders. Use `Permission::create()` in a seeder that runs during deployment.

### Refactoring Strategy
1. Export all existing permissions from the database to a seeder file
2. Remove duplicate and typo permissions during export
3. Create a `RolePermissionSeeder` that creates all permissions
4. Replace dynamic `firstOrCreate` calls with references to seeded permissions
5. Add `php artisan db:seed --class=RolePermissionSeeder` to deployment pipeline
6. Remove dynamic creation code

### Detection Checklist
- [ ] Are permissions created dynamically in application code?
- [ ] Is there a seeder file that defines all permissions?
- [ ] Can permissions be audited from code review alone?
- [ ] Are there duplicate or typo-ed permission names?
- [ ] Does rolling back a deployment remove newly created permissions?

### Related Rules/Skills/Trees
- Seed All Permissions — Never Create Dynamically in Code (05-rules.md)
- Design Role-Based Access Control with Permission-Centric Authorization (06-skills.md)

---

## 3. Direct Permission Assignment to Users

### Category
Architecture · Maintainability

### Description
Assigning permissions directly to individual users via `$user->givePermissionTo()` instead of creating roles and assigning users to roles.

### Why It Happens
For one-off situations, direct permission assignment is faster than creating a role. "This user just needs one extra permission" — creating a role seems like overkill. Over time, direct assignments accumulate, and the role model is bypassed for a growing number of users.

### Warning Signs
- `$user->givePermissionTo('report.export')` in controllers or admin code
- Users have permissions assigned directly (visible in `model_has_permissions` table)
- No role corresponds to common permission combinations
- Auditing "who has the report.export permission" requires scanning all user records
- Roles exist but are unused — most permissions are assigned directly

### Why Harmful
Direct permission assignment bypasses the role model. When a permission needs to be revoked from a group of users, there's no role to update — each user must be individually identified and updated. Permission audits become difficult because permissions are scattered across user records rather than grouped into roles. The RBAC system degrades into a flat permission-per-user model.

### Real-World Consequences
- New compliance requirement: revoke `report.export` from all customer support staff — no role exists, must find and update each user individually
- Audit: "Who has the admin-level permission?" — must query all users' direct permissions because roles don't cover it
- User leaves the company — removing their role doesn't remove direct permissions assigned separately
- Permission management UI is confusing: roles and direct permissions are mixed

### Preferred Alternative
Assign permissions to roles, and assign roles to users. Reserve direct permission assignment for documented temporary access with expiry.

### Refactoring Strategy
1. Identify common direct permission combinations that define implicit roles
2. Create roles for these combinations
3. Assign the role to users who have the corresponding direct permissions
4. Remove direct permissions from users after role assignment
5. Update admin UI to manage roles instead of direct permissions
6. Add a policy that prevents new direct permission assignments without approval

### Detection Checklist
- [ ] Are permissions assigned directly to users?
- [ ] Do roles exist that group common permissions?
- [ ] Can permission changes be applied to groups of users?
- [ ] Is the `model_has_permissions` table populated (direct assignments)?
- [ ] Can permission audits be done via role analysis alone?

### Related Rules/Skills/Trees
- Assign Permissions to Roles, Never Directly to Users (05-rules.md)
- Design Role-Based Access Control with Permission-Centric Authorization (06-skills.md)

---

## 4. Stale Permission Cache

### Category
Maintainability · Reliability

### Description
Changing role-permission assignments without clearing the Spatie permission cache, causing changes to not take effect until the cache expires or is manually cleared.

### Why It Happens
Spatie laravel-permission caches permissions in Laravel's cache driver. After seeding or modifying roles, the cache contains stale data. Developers may not know about the cache or may forget to run `php artisan permission:cache-reset`. The changes appear to have no effect, leading to confusion.

### Warning Signs
- Role permissions changed in seeder but users still have old permissions
- New permission assigned to a role but `$user->can('new-permission')` returns false
- `php artisan permission:cache-reset` resolves permission issues
- Deployment script does not include cache reset
- Admin UI changes to roles don't take effect immediately

### Why Harmful
Stale cache means authorization changes don't propagate. A revoked permission still grants access. A newly assigned permission is still denied. This creates a window where unauthorized users have access or authorized users are blocked. In production, this window lasts until the cache TTL expires or someone manually clears it.

### Real-World Consequences
- Security incident: revoked permission still cached for 1 hour — former employee retains access
- Support ticket: "I granted admin role to the new manager but they can't access anything"
- Deployment: seeder adds new permissions but they're unavailable until cache cleared manually
- Emergency permission revocation: change made but cached — user still has access

### Preferred Alternative
Run `php artisan permission:cache-reset` after every role/permission change. Include it in deployment scripts.

### Refactoring Strategy
1. Add `php artisan permission:cache-reset` to deployment pipeline after seeders
2. For admin UI changes, trigger cache reset after role/permission modifications
3. Add a cache status check to admin panel: "Permissions last cached: 2 hours ago"
4. Document the cache reset requirement in runbooks
5. Consider using a lower cache TTL for permission data in development

### Detection Checklist
- [ ] Is `php artisan permission:cache-reset` run after seeding?
- [ ] Do deployment scripts include cache reset?
- [ ] Do admin UI role changes take effect immediately?
- [ ] Is there a visible indication of cache state in admin panel?
- [ ] How long does it take for permission changes to propagate?

### Related Rules/Skills/Trees
- Clear Permission Cache After Role/Permission Changes (05-rules.md)
- Design Role-Based Access Control with Permission-Centric Authorization (06-skills.md)

---

## 5. Single Admin Role With All Permissions

### Category
Architecture · Maintainability

### Description
Having a single "admin" role that contains all permissions, defeating the purpose of granular RBAC and making it impossible to create limited admin roles.

### Why It Happens
The simplest RBAC implementation creates an `admin` role with wildcard or all permissions, and a `user` role with basic permissions. This binary model mirrors the "admin vs regular user" pattern. As the application grows, the admin role becomes a catch-all that cannot be split into meaningful sub-roles.

### Warning Signs
- Only two roles exist: `admin` and `user` (or similar)
- Admin role has all permissions or uses `*` wildcard
- Cannot create a "support admin" or "reports-only admin" role
- Admin role has 50+ permissions directly assigned
- Any new permission is automatically given to the admin role

### Why Harmful
A single admin role is effectively an `is_admin` boolean flag with a database table. It provides no RBAC benefits — you cannot grant partial admin access, audit which admins have which permissions, or create limited admin roles. The granularity of the permission system is wasted. Compliance requirements for separation of duties cannot be met.

### Real-World Consequences
- Customer support needs admin access but the admin role is all-or-nothing
- Cannot grant "reports only" access without giving full admin permissions
- Security audit flags "admin role has too many permissions" as a finding
- Compliance requires read-only admin role — impossible with binary admin/user model
- Creating a junior admin role requires refactoring the entire permission system

### Preferred Alternative
Design multiple admin-level roles with specific permission sets: `admin.reports`, `admin.users`, `admin.content`, `admin.system`.

### Refactoring Strategy
1. Audit admin permissions — identify permission groups by domain
2. Create specific admin roles: `admin.reports`, `admin.users`, `admin.content`
3. Assign appropriate permission groups to each role
4. Remove the monolithic admin role or reduce it to system-level permissions only
5. Update admin user assignments to use specific roles
6. Implement separation of duties for conflicting admin roles

### Detection Checklist
- [ ] Is there a single admin role with all permissions?
- [ ] Can limited admin roles be created?
- [ ] Are there defined admin sub-roles for different functions?
- [ ] Can a support agent have admin-like access without full admin permissions?
- [ ] Does the permission design allow for least-privilege admin access?

### Related Rules/Skills/Trees
- Design Permissions as Granular resource.action Strings (05-rules.md)
- Design Role-Based Access Control with Permission-Centric Authorization (06-skills.md)
- Role Hierarchy Strategy decision tree (07-decision-trees.md)
