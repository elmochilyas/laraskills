# Anti-Patterns for Spatie Permission Decision Matrix

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Spatie Permission Decision Matrix |
| Anti-Pattern Count | 4 |

---

## Anti-Pattern Inventory

| ID | Anti-Pattern | Severity | Frequency |
|----|-------------|----------|-----------|
| AP-SPT-001 | Permission Explosion | Critical | High |
| AP-SPT-002 | Dynamic Permission Creation | Critical | Medium |
| AP-SPT-003 | Spatie for Everything (Feature Flags, A/B Tests, Plan Limits) | High | Medium |
| AP-SPT-004 | Team Permission Memory Leak | Critical | Medium |

---

## Repository-Wide Anti-Patterns

The following anti-patterns from related KUs are also relevant here:
- AP-WNB-001 (Not-Invented-Here Syndrome) — from KU 05
- AP-ESC-001 (The Bottomless Escape Hatch) — from KU 04
- AP-FNA-004 (Assumption Override Optimism) — from KU 02

---

## AP-SPT-001: Permission Explosion

### Category
Architecture | Authorization

### Description
Creating a permission for every conceivable action instead of designing a role hierarchy and grouping permissions meaningfully. The permission set grows to 200+ individual permissions with no structure — `can_edit_post_title`, `can_edit_post_body`, `can_edit_post_tags`, `can_delete_own_post`, `can_delete_any_post` — making the authorization system unmanageable, unauditable, and incomprehensible to administrators.

### Why It Happens
- "More granular permissions = more secure" — confusing granularity with security
- Product managers request every action as a separate permission without understanding authorization architecture
- Developers create permissions ad-hoc for each new feature instead of fitting new features into existing permission groups
- No permission design review process — permissions are created at will

### Warning Signs
- Permission count exceeds 50 for an application with fewer than 20 features
- Permission names are sentences: `can_edit_posts_that_are_published_and_owned_by_user`
- Admin role assignment takes 30 minutes because there are 200 permissions to check
- "I'm not sure which permission controls that feature" — said by the developer who built it
- Wildcard permissions are never used because each permission is uniquely named

### Why Harmful
200 permissions is not more secure than 20 well-designed roles. Administrators cannot effectively manage a 200-permission system — they either grant "all" (defeating granularity) or make mistakes (granting incorrect access). Every new feature adds 3-5 permissions, compounding the problem. Permission audits become impossible because nobody can reason about what 200 individual permissions actually allow. The system achieves the opposite of its goal: less security through overwhelming complexity.

### Real-World Consequences
- A SaaS platform creates a permission for every UI element: `can_view_dashboard_chart_1`, `can_view_dashboard_chart_2`, `can_export_csv`, `can_export_pdf`. After 18 months, there are 180 permissions. Role setup for a new customer takes 2 hours of permission toggling. Administrators give up and assign all permissions to everyone. The "granular" system becomes effectively unmanaged.

### Preferred Alternative
Design a role hierarchy with 5-10 roles. Each role groups related permissions. Use the `{resource}:{action}` naming convention with wildcards: `posts:*` grants all post permissions to the "editor" role. Keep the total permission count under 30 for applications with fewer than 20 features. When a new feature needs a new permission, ask: "Does this fit under an existing permission or role?" before creating a new one. A permission that only one role will ever have should be folded into that role, not exposed as a standalone permission.

### Refactoring Strategy
1. Audit all existing permissions. Group them by resource (posts, users, reports, settings).
2. Identify permissions that only exist because of UI granularity — merge them into broader permissions.
3. Implement wildcards: replace `posts:read`, `posts:create`, `posts:edit`, `posts:publish` with `posts:*` for roles that need all four.
4. Remove permissions that have never been assigned to any role.
5. Set a permission ceiling: no more than 50 total permissions without architecture review.

### Detection Checklist
- [ ] Permission count exceeds 50
- [ ] Permission names describe UI elements rather than business capabilities
- [ ] Admin role assignment requires checking more than 20 permissions
- [ ] New features always add 3+ new permissions without consolidation
- [ ] Wildcards are not used — every permission is individually named

### Related Rules
- Use the `{resource}:{action}` Permission Naming Convention

### Related Skills
- Calibrated Package Recommendation Writing (KU 01)

---

## AP-SPT-002: Dynamic Permission Creation

### Category
Security | Configuration Management

### Description
Creating permissions at runtime through an admin UI or API, rather than seeding them via a version-controlled seeder. Permissions become runtime data instead of version-controlled configuration. Staging has different permissions than production. New permissions bypass code review.

### Why It Happens
- "Admins should be able to create their own permissions" — confusing flexibility with good architecture
- The admin UI is built before the permission architecture is designed, so runtime creation is the default
- Quick workaround: "I'll just add this permission in the admin panel for now and seed it later" (never seeded)
- Misunderstanding: treating permissions as user-generated content rather than security configuration

### Warning Signs
- Admin panel has a "Create Permission" button
- `Permission::create(['name' => $request->input('name')])` appears in a controller
- Staging and production have different permission sets
- "I added a permission but it's not showing up" — because it exists in one environment but not another
- The PermissionSeeder doesn't exist or is empty

### Why Harmful
Runtime-created permissions bypass code review. A malicious or mistaken admin could create a permission named `admin:*` and assign it to themselves. Environment drift means staging tests don't match production — a feature passes staging tests but fails in production because a required permission doesn't exist. Compliance audits fail because there's no canonical, version-controlled permission set. The audit question "what permissions exist in production?" cannot be answered from version control — it requires a database query.

### Real-World Consequences
- An admin creates a permission called `system:*` via the admin UI to "give myself access to debug something." They forget to remove it. Six months later, a security audit discovers the permission and traces it back to an admin who left the company. The permission was never reviewable because it was created at runtime. The audit finding: "Unauthorized access vector present for 6 months with no traceability."

### Preferred Alternative
All permissions are seeded via `PermissionSeeder` using `Permission::findOrCreate()`. The seeder is version-controlled and reviewed in PRs. The admin UI manages role-permission assignments (which roles have which permissions), not permission definitions (which permissions exist). If a new permission is needed, it goes through a PR: add to the seeder, review the permission name and scope, merge, deploy. Only then does it appear in the admin UI for role assignment.

### Refactoring Strategy
1. Export all runtime-created permissions from the production database.
2. Add them to the PermissionSeeder (after reviewing each for appropriateness).
3. Remove the "Create Permission" functionality from the admin UI.
4. Run the seeder in all environments to establish a canonical permission set.
5. Add a CI check: if the production database has permissions not in the seeder, fail the build.

### Detection Checklist
- [ ] `Permission::create()` appears outside of a seeder or migration
- [ ] Admin panel includes a "Create Permission" button or API endpoint
- [ ] The PermissionSeeder doesn't exist, is empty, or doesn't cover all permissions
- [ ] "What permissions exist?" requires a database query, not reading a file
- [ ] Permissions differ between staging and production

### Related Rules
- Seed Permissions — Never Create Them at Runtime

### Related Skills
- Calibrated Package Recommendation Writing (KU 01)

---

## AP-SPT-003: Spatie for Everything (Feature Flags, A/B Tests, Plan Limits)

### Category
Architecture | Separation of Concerns

### Description
Using Spatie's `@role` directive, `hasPermissionTo()`, and `can()` checks for non-authorization concerns: feature flags, A/B testing, plan limits, UI toggles, and configuration. The permission system becomes a dumping ground for every conditional in the application, conflating security authorization with feature gating.

### Why It Happens
- Spatie is already installed for RBAC, so it's convenient to use for all conditionals — "we already have the system"
- Permissions feel like the right abstraction: "can the user see the new dashboard?" = `can('new-dashboard')`
- Teams don't have a separate feature flag system (Pennant, LaunchDarkly) and Spatie is "good enough"
- "It's all authorization" — failing to distinguish between security authZ and feature gating

### Warning Signs
- Permission names that aren't resources: `new-dashboard`, `dark-mode`, `beta-search`, `plan-pro-limit`
- Permissions that don't follow `{resource}:{action}` because they're not actually permissions
- "Can they see the new UI?" uses `$user->can('new-dashboard')` instead of a feature flag
- Plan limits are enforced via `$user->hasPermissionTo('unlimited-exports')` instead of plan configuration
- A/B test groups are modeled as roles: `role:experiment-group-a`

### Why Harmful
Security authorization and feature gating have different lifecycles, different audiences, and different failure modes. A feature flag controls what users SEE; an authorization check controls what users can DO. When they're conflated in Spatie: (1) the permission table fills with non-security entries, making audits harder, (2) feature flags are managed through the same admin UI as security permissions, increasing the risk of misconfiguration, (3) a feature flag accidentally toggled on doesn't bypass security (if Gates/Policies are separate), but when both are in Spatie, there's no separation, and (4) the permission cache includes feature flags, so changing a flag requires cache invalidation.

### Real-World Consequences
- A SaaS uses Spatie for both authorization AND plan entitlements. The `enterprise:` permission namespace mixes security permissions (`enterprise:manage-users`) with plan features (`enterprise:white-label`). A support engineer accidentally grants `enterprise:*` to a customer trying to enable white-label, also granting them user management access. The permission system conflates a billing feature toggle with a security authorization — with predictable consequences.

### Preferred Alternative
Use Spatie exclusively for security authorization (what users can DO based on their role). Use Laravel Pennant or LaunchDarkly for feature flags (what features users can SEE). Use a plan configuration (database or config file) for plan entitlements. Use `config()` or a settings table for user preferences (dark mode, pagination size). Each concern has its own system, its own lifecycle, and its own failure mode.

### Refactoring Strategy
1. Audit all Spatie permissions. Categorize each as: security authorization, feature flag, plan entitlement, or user preference.
2. Migrate feature flags to Pennant (or LaunchDarkly). Migrate plan entitlements to a plan configuration. Migrate preferences to settings.
3. Remove migrated entries from the permissions table.
4. Remove the corresponding `$user->can()` or `@can` checks from Blade templates — replace with `Feature::active()` or plan checks.
5. The remaining Spatie permissions should be exclusively `{resource}:{action}` security authorization.

### Detection Checklist
- [ ] Permissions exist with names that aren't `{resource}:{action}` format
- [ ] Plan limits, feature flags, or A/B test groups are managed through Spatie
- [ ] "Permissions" table includes entries that an auditor wouldn't consider security permissions
- [ ] `$user->can('some-feature')` is used where a feature flag system would be more appropriate
- [ ] Plan changes require permission changes in Spatie

### Related Rules
- Use the `{resource}:{action}` Permission Naming Convention

### Related Skills
- Laravel Pennant Decision Matrix (KU 08)
- Calibrated Package Recommendation Writing (KU 01)

---

## AP-SPT-004: Team Permission Memory Leak

### Category
Security | Reliability

### Description
Setting `setPermissionsTeamId()` to scope permissions to a specific team, but failing to reset it after the operation completes. In long-lived processes (Octane, Horizon workers, scheduled commands), the team context persists between requests or jobs — causing cross-tenant permission leakage where Team A's permissions apply to Team B's data.

### Why It Happens
- The team context is a global static property — it persists for the lifetime of the PHP process
- PHP-FPM (traditional) masks this by creating a fresh process per request, so developers don't see the leak in local dev
- The `finally` block for resetting is forgotten because "the middleware resets it" (but middleware doesn't run in queued jobs)
- Octane and Horizon adoption reveals latent bugs that existed all along in the static property usage

### Warning Signs
- `setPermissionsTeamId($id)` appears without a corresponding `setPermissionsTeamId(null)` in a `finally` block
- "Sometimes user X can see Team B's data but I can't reproduce it" — intermittent because it depends on job execution order
- The bug only reproduces in production (Octane/Horizon), never locally (PHP-FPM)
- Permission checks in queued jobs sometimes pass and sometimes fail for the same data

### Why Harmful
Cross-tenant permission leakage is a critical security vulnerability in multi-tenant applications. A queued job processing Team A's order may check permissions against Team B's context (from a previous job that didn't reset), granting or denying access incorrectly. The bug is intermittent — it depends on job execution order — making it extremely difficult to reproduce and debug. In Octane, one request's admin permissions can leak to the next request if the team context isn't reset.

### Real-World Consequences
- A Horizon worker processes a job for Team A with `setPermissionsTeamId(1)`. The job completes but the `finally` block is missing — team context remains `1`. The next job is for Team B, but permission checks use Team A's context. A user from Team A is incorrectly identified as having admin access to Team B's data. The bug persists for 30 minutes until the worker is restarted, affecting dozens of jobs.

### Preferred Alternative
Every call to `setPermissionsTeamId()` MUST be paired with a reset in a `finally` block. In middleware: set at the start, reset in `finally`. In jobs: set in `try`, reset in `finally`. In commands: set in `handle()` body, reset in `finally`. Consider using a closure-based helper that guarantees the reset:

```php
function withPermissionsTeam($teamId, Closure $callback) {
    $previous = getPermissionsTeamId();
    setPermissionsTeamId($teamId);
    try {
        return $callback();
    } finally {
        setPermissionsTeamId($previous);
    }
}
```

### Refactoring Strategy
1. Search the codebase for all calls to `setPermissionsTeamId()`.
2. Verify each call has a corresponding reset (`setPermissionsTeamId(null)` or previous value) in a `finally` block.
3. For any call without a reset, add the `finally` block immediately.
4. Implement the closure-based helper and migrate existing calls to use it.
5. Add a test that simulates consecutive queue jobs with different team contexts and verifies no leakage.

### Detection Checklist
- [ ] `setPermissionsTeamId()` appears without a nearby `setPermissionsTeamId(null)` in a `finally` block
- [ ] Intermittent cross-tenant permission bugs are reported
- [ ] The application uses Octane or Horizon (long-lived processes) AND team permissions
- [ ] Queued jobs access `setPermissionsTeamId()` without resetting
- [ ] No wrapper helper exists that guarantees context reset

### Related Rules
- Set Team Permission Context in Middleware — Reset It After Use

### Related Skills
- Package Escape Hatch Strategy (KU 04)
