# Anti-Patterns: Spatie laravel-permission

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | Spatie laravel-permission |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-SP-01 | Missing HasRoles Trait | Critical | Medium | Low |
| AP-SP-02 | hasRole Instead of can | High | High | Medium |
| AP-SP-03 | Dynamic Permission Creation | High | Medium | Medium |
| AP-SP-04 | Stale Permission Cache | High | Medium | Low |
| AP-SP-05 | Direct Permission on Users | Medium | High | Medium |

---

## Repository-Wide Anti-Patterns

- **Spatie for Simple is_admin Flag**: Using Spatie when a boolean column would suffice
- **No Permission Seeder**: Permissions created ad-hoc in migrations or controllers
- **Checking Roles in Blade Instead of Permissions**: `@role('editor')` instead of `@can('edit-articles')`

---

## 1. Missing HasRoles Trait

### Category
Framework Usage · Critical

### Description
Installing `spatie/laravel-permission` but forgetting to add the `HasRoles` trait to the User model, causing all permission methods and Gate integration to be unavailable.

### Why It Happens
The installation instructions include adding the trait, but it's easy to miss in a multi-step setup. The package installs, migrations run, and the config publishes without errors. The first sign of trouble is when `$user->can('permission')` doesn't check Spatie permissions — but this may go unnoticed because `$user->can()` still works (falls through to native Gates).

### Warning Signs
- `$user->hasPermissionTo('edit-articles')` throws an error
- `$user->assignRole('editor')` method not found
- `$user->can('edit-articles')` returns unexpected results (uses native Gate instead of Spatie)
- Spatie middleware (`permission`, `role`) may still work if using User model
- No methods from `HasRoles` trait available on User instances

### Why Harmful
Without the `HasRoles` trait, the package is non-functional. All role and permission methods are unavailable. `$user->can()` falls back to Laravel's native Gate system, which doesn't know about Spatie permissions. Roles cannot be assigned. Permissions cannot be checked. The application runs without any authorization from the installed package.

### Real-World Consequences
- `$user->assignRole('editor')` throws `BadMethodCallException`
- Admin panel cannot assign roles — user management broken
- Permission checks always return incorrect results
- Hours of debugging before discovering the missing trait
- CI tests fail because roles cannot be assigned in test setup

### Preferred Alternative
Add the `HasRoles` trait to the User model immediately after installing the package, before any other setup steps.

### Refactoring Strategy
1. Add `use Spatie\Permission\Traits\HasRoles;` to the User model
2. Add `use HasRoles;` inside the User class
3. Verify that `$user->assignRole()`, `$user->hasPermissionTo()`, and `$user->can()` work correctly
4. Check that Spatie's Gate integration is active

### Detection Checklist
- [ ] Is the `HasRoles` trait imported and used on the User model?
- [ ] Do `assignRole()` and `givePermissionTo()` work?
- [ ] Does `$user->can()` check Spatie permissions?
- [ ] Are Spatie middleware routes working?
- [ ] Was the package installed recently and the trait possibly missed?

### Related Rules/Skills/Trees
- Add HasRoles Trait to User Model From Setup (05-rules.md)
- Implement Spatie laravel-permission for Database-Driven Roles and Permissions (06-skills.md)

---

## 2. hasRole Instead of can

### Category
Architecture · Maintainability

### Description
Using `$user->hasRole('editor')` in application code instead of `$user->can('edit-articles')`, tying authorization to role names instead of stable permission primitives.

### Why It Happens
The most natural question is "does this user have the editor role?" `hasRole()` returns a boolean and seems like the right check. Developers may not understand that Spatie integrates with `$user->can()` via Gate integration, making permission checks the standard approach.

### Warning Signs
- `$user->hasRole('admin')`, `$user->hasRole('editor')` in controllers or services
- `@role('admin')` or `@hasRole('editor')` in Blade templates
- Permission added to a role but code checks the old role name
- Renaming a role requires searching the codebase

### Why Harmful
Role names change — `editor` may become `content-manager`. Every `hasRole('editor')` check breaks on rename. More importantly, a user might have the `edit-articles` permission through a different role, but `hasRole('editor')` doesn't know about it. Checks are too coarse and too fragile.

### Real-World Consequences
- Role renamed — 47 `hasRole()` calls must be updated
- User with a different role that includes `edit-articles` is denied
- New role created with same permissions — `hasRole()` checks only the old role name
- Permission audit impossible because authorization is role-name-based

### Preferred Alternative
Always use `$user->can('permission-name')` in application code.

### Refactoring Strategy
1. Audit all `hasRole()` calls in application code
2. Replace each with `$user->can('permission-name')`
3. For Blade, replace `@role('editor')` with `@can('edit-articles')`
4. Verify that renamed roles don't break authorization

### Detection Checklist
- [ ] Are there `hasRole()` calls in application code?
- [ ] Are `@role` directives used in Blade?
- [ ] Would renaming a role break authorization?
- [ ] Are permission checks used consistently?
- [ ] Does the code use `$user->can()` for authorization?

### Related Rules/Skills/Trees
- Use $user->can() for Permission Checks — Not hasRole() (05-rules.md)
- Implement Spatie laravel-permission for Database-Driven Roles and Permissions (06-skills.md)

---

## 3. Dynamic Permission Creation

### Category
Maintainability · Security

### Description
Creating permissions dynamically in application code instead of defining them in seeders, leading to uncontrolled permission growth and audit challenges.

### Why It Happens
`Permission::firstOrCreate(['name' => 'report.export'])` is convenient — it works on first use without seeder discipline. Developers prioritize quick implementation over auditability. The permission exists and works, so the consequences seem minimal.

### Warning Signs
- `Permission::firstOrCreate()` or `Permission::create()` in controllers or services
- Permissions in the database don't match seeders
- Permission table has typos or duplicate names
- Cannot audit all possible permissions without analyzing every code path

### Why Harmful
Dynamic permissions bypass seeding, caching, and version control. Rollbacks don't remove dynamically created permissions. The permission table grows with artifacts from development, testing, and edge cases. Auditing is impossible because permissions are defined at runtime, not in code.

### Real-World Consequences
- Permission table has 300 entries, 100 are duplicates and typos
- Rollback doesn't remove permissions created by old code paths
- Staging and production have different permission sets
- Security audit: "Cannot enumerate all permissions"

### Preferred Alternative
Define all permissions in seeders. Run seeders on deployment.

### Refactoring Strategy
1. Export all existing permissions to a seeder
2. Clean up duplicates and typos
3. Replace `firstOrCreate` calls with references to seeded permissions
4. Add seeder to deployment pipeline
5. Remove dynamic creation code

### Detection Checklist
- [ ] Are permissions created dynamically in application code?
- [ ] Is there a seeder defining all permissions?
- [ ] Can permissions be audited from code alone?
- [ ] Are there permission name typos in the database?
- [ ] Do staging and production have consistent permission sets?

### Related Rules/Skills/Trees
- Seed All Permissions — Never Create Dynamically (05-rules.md)
- Implement Spatie laravel-permission for Database-Driven Roles and Permissions (06-skills.md)

---

## 4. Stale Permission Cache

### Category
Maintainability · Reliability

### Description
Changing roles or permissions without clearing Spatie's cache, causing changes to not take effect until the cache expires.

### Why It Happens
Spatie caches permissions for performance. After seeding or modifying roles, the cache retains stale data. Developers may not know about the cache or forget the `permission:cache-reset` command. Changes appear ineffective, leading to confusion.

### Warning Signs
- Permission changes in seeder don't take effect after seeding
- `php artisan permission:cache-reset` resolves the issue
- Deployment scripts don't include cache reset
- Admin panel role changes don't take effect immediately
- Revoked permission still grants access

### Why Harmful
Stale cache means authorization changes don't propagate. A revoked permission still grants access. A newly assigned permission is denied. The cache window exposes the application to unauthorized access or blocks legitimate users.

### Real-World Consequences
- Security incident: revoked permission still cached for 1 hour
- New manager granted admin role — cache not cleared — cannot access anything
- Deployment: seeder runs but permissions unavailable
- Emergency revocation: change made but cached — user retains access

### Preferred Alternative
Run `php artisan permission:cache-reset` after every role/permission change.

### Refactoring Strategy
1. Add cache reset to deployment scripts after seeders
2. Trigger cache reset from admin UI after role changes
3. Add cache status indicator to admin panel
4. Document the requirement clearly

### Detection Checklist
- [ ] Is cache reset run after seeding?
- [ ] Do deployment scripts include cache reset?
- [ ] Do admin role changes take effect immediately?
- [ ] How long before permission changes propagate?
- [ ] Is there a cache status indicator?

### Related Rules/Skills/Trees
- Clear Cache After Every Permission/Role Change (05-rules.md)
- Implement Spatie laravel-permission for Database-Driven Roles and Permissions (06-skills.md)

---

## 5. Direct Permission on Users

### Category
Architecture · Maintainability

### Description
Assigning permissions directly to individual users via `givePermissionTo()` instead of creating roles and assigning users to roles.

### Why It Happens
For one-off situations, direct assignment is faster than creating a role. "This user just needs this one extra permission." Over time, direct assignments accumulate, and the role model is bypassed for a growing number of users.

### Warning Signs
- `$user->givePermissionTo('report.export')` in admin code
- Users have permissions assigned directly (in `model_has_permissions`)
- No role groups common permission combinations
- Revoking a permission requires finding all users with direct assignment

### Why Harmful
Direct assignment bypasses the role model. When a permission needs updating for a group, there's no role to modify — each user must be updated individually. Audits require scanning individual user records instead of role assignments.

### Real-World Consequences
- New compliance: revoke `report.export` from support staff — no role exists, must update 50 users individually
- Audit: "Who has admin permission?" — must check every user's direct permissions
- User leaves: removing their role doesn't remove direct permissions

### Preferred Alternative
Assign permissions to roles, assign roles to users. Reserve direct assignment for temporary, documented exceptions.

### Refactoring Strategy
1. Identify common direct permission sets — create roles for them
2. Assign roles to users who have those direct permissions
3. Remove direct permissions
4. Update admin UI to manage roles instead of direct permissions

### Detection Checklist
- [ ] Are permissions assigned directly to users?
- [ ] Do roles exist for common permission groups?
- [ ] Can permission audits be done via role analysis?
- [ ] Is `model_has_permissions` populated?
- [ ] Can bulk permission changes be done via roles?

### Related Rules/Skills/Trees
- Use Direct Permissions Sparingly, Prefer Role Assignment (05-rules.md)
- Implement Spatie laravel-permission for Database-Driven Roles and Permissions (06-skills.md)
- Direct Permission vs Role-Based Assignment decision tree (07-decision-trees.md)
