# Skill: Implement Team-Scoped Spatie Permission in SaaS

## Purpose

Configure and operate Spatie Permission with team mode in a multi-tenant SaaS application. This skill covers the complete implementation: team context resolution via middleware, guard name consistency enforcement, permission cache invalidation on team switch, global role bypass via Gate::before(), and strict separation of subscription plan entitlements from Spatie permissions.

## When To Use

- Multi-tenant SaaS applications where users belong to one or more teams
- Each team has its own internal role hierarchy (owner, admin, member, viewer)
- Team members have different capabilities within the team
- Platform-level admins need to manage or support any team
- Permission cache must be invalidated per-team on role changes

## When NOT To Use

- Single-tenant applications (use standard Spatie Permission without teams)
- Encoding subscription plan features as permissions (use a separate Entitlement/FeatureGate service)
- Team roles never change within a team (everyone is equal — no role hierarchy needed)
- Using a separate multi-tenant database strategy (schema-per-tenant or database-per-tenant) that already provides isolation

## Prerequisites

- Spatie/laravel-permission installed and configured with `'teams' => true` in `config/permission.php`
- `team_foreign_key` column configured in Spatie's migration tables
- Understanding of Laravel Gates and Policies for authorization building blocks
- Multi-tenant architecture with a Team model and team-user pivot table

## Inputs

- Team model with user membership (pivot table with roles/status)
- Role hierarchy: `viewer`, `member`, `admin`, `owner` (team-scoped) and `super-admin`, `platform-support` (global)
- Permission definitions: `{resource}:{action}` format (e.g., `documents:read`, `documents:write`, `documents:delete`)
- Subscription plan model with feature entitlements (separate from Spatie permissions)
- Session management configuration (driver: database or redis)

## Workflow

1. Enable team mode in `config/permission.php`: set `'teams' => true` and configure `team_foreign_key`
2. Ensure `team_foreign_key` column has an index on all Spatie permission tables (`roles`, `permissions`, `model_has_roles`, `model_has_permissions`)
3. Ensure all roles and permissions use the same guard name (`'web'`). Verify in seeders and `config/permission.php` defaults
4. Create a `ResolveTeamContext` middleware that runs on every request:
   - Resolve current team ID from the session (set during team switch)
   - Fall back to user's `last_active_team_id` or first team membership
   - Validate the user actually belongs to the resolved team with an active membership
   - Call `setPermissionsTeamId($teamId)` to establish the team context
   - Clear team context if the user has no valid team membership
5. Register the middleware in the kernel before any authorization middleware
6. Configure `Gate::before()` in `AuthServiceProvider::boot()`:
   - Only bypass for truly global roles: `super-admin` returns `true`
   - Optionally allow `platform-support` to view any resource
   - Return `null` for all other checks — let Policies decide team-scoped authorization
7. For each Policy class, validate team isolation before checking roles:
   - `$document->team_id === getPermissionsTeamId()` as the first check
   - Then check `$user->hasPermissionTo('resource:action')` which is automatically team-scoped
8. Create a `TeamSwitchController` that handles team switching:
   - Validate user belongs to target team
   - Call `setPermissionsTeamId($newTeamId)`
   - Call `$user->forgetCachedPermissions()` — never skip this step
   - Store team ID in session and update `last_active_team_id`
   - Regenerate the session
9. Create a separate `EntitlementService` for subscription plan feature checks:
   - `$entitlement->allows('advanced-reporting', $team)` returns boolean
   - Keep this completely separate from Spatie permission checks
   - Call entitlement checks alongside (not instead of) permission checks
10. Register observers on Role and Permission models to broadcast cache invalidation on changes

## Validation Checklist

- [ ] `setPermissionsTeamId()` is called before every permission check in team context
- [ ] Team context middleware resolves and validates team membership on every request
- [ ] Permission cache is invalidated on every team switch (`forgetCachedPermissions()`)
- [ ] Platform admins bypass team scope via `Gate::before()`, not via team-assigned roles
- [ ] All roles and permissions use the same guard name (no mismatched guards)
- [ ] No subscription plan features encoded as Spatie permissions
- [ ] Entitlement/FeatureGate service exists separately from Spatie Permission
- [ ] Cross-team permission leakage is tested (user in team A cannot access team B resources)
- [ ] Team context is never accepted unsanitized from user input
- [ ] `team_foreign_key` is indexed in all Spatie permission tables

## Common Failures

- Forgetting `setPermissionsTeamId()` — permission checks return results from the previous team's context, causing cross-team access
- Not invalidating cache on team switch — user retains permissions from old team after switching
- Encoding plan features as Spatie permissions (e.g., `pro-plan` permission) — conflates roles and plan entitlements
- Calling `setPermissionsTeamId()` after a permission check instead of before — stale context used for authorization
- Assigning platform admin roles per-team instead of using `Gate::before()` — admin loses access to teams they haven't joined
- Mismatched guards on roles — `$user->hasRole('admin')` returns false despite the role being assigned
- Checking team-scoped roles in `Gate::before()` where team context hasn't been set yet — silent authorization failures
- Accepting `team_id` from user input without validating membership — privilege escalation via parameter manipulation

## Decision Points

- Global vs team-scoped roles: which roles go in `Gate::before()` vs assigned per-team?
- Spatie vs native Gates: does the authorization check need team context, or is a native Gate sufficient?
- Roles vs entitlements: when does a feature check belong in Spatie permissions vs the Entitlement service?
- Cache strategy: when should the cache be invalidated beyond team switches (role changes, permission changes, plan changes)?
- Guard strategy: single guard (`web`) for all users, or separate guards for API vs web?

## Performance Considerations

- Spatie's permission cache is global by default. With team mode, the cache key includes the team ID. Cache invalidation must be per-user-per-team.
- Permission checks on every request can add overhead. The cache mitigates this by storing resolved permissions in a single cache key. A cache hit means one Redis read instead of multiple DB queries.
- Team switching is the critical cache invalidation point. If your application supports frequent team switching, ensure cache invalidation is fast and atomic.
- Large teams with many roles and permissions: the serialized permission cache for a user in a team with 50+ permissions can be large. Monitor cache memory usage.

## Security Considerations

- Team context is a security boundary. Never accept a `team_id` from user input that overrides the resolved team context without validation.
- Permission cache staleness is a security vulnerability. If a team owner revokes a user's admin role, the user must not retain admin access via stale cache.
- Cross-team permission leakage: test explicitly that a user in team A cannot access team B resources via Spatie permission checks.
- `Gate::before()` bypass is powerful. Ensure it is limited to truly global roles. Never put team-scoped logic in `Gate::before()`.
- Guard name consistency is a security concern — mismatched guards silently fail, creating authorization gaps.

## Related Rules (from 05-rules.md)

- Rule 1: Always Call setPermissionsTeamId() Before Every Permission Check
- Rule 2: Invalidate Permission Cache on Every Team Switch
- Rule 3: Do Not Encode Subscription Plan Features as Spatie Permissions
- Rule 4: Use Gate::before() Only for Truly Global Roles — Never for Team-Scoped Logic
- Rule 5: Validate Team Membership Before Setting the Team Context

## Related Skills

- Choose Global vs Team-Scoped Roles (07-decision-trees.md)
- Choose Spatie Permission vs Native Gates for Team Authorization (07-decision-trees.md)
- Choose Roles vs Entitlements for Subscription Plan Features (07-decision-trees.md)
- Build SaaS Authorization Test Matrices (authorization-test-matrix-saas/06-skills.md)

## Success Criteria

- User in Team A cannot access Team B resources via any permission check
- Team switch correctly invalidates old team's permissions and applies new team's permissions
- Platform admin can access any team's resources without being assigned to every team
- Plan entitlement checks run alongside (not instead of) role checks — admin on free plan sees "upgrade" message, not role-based 403
- Cache invalidation propagates within one request of a role or permission change
