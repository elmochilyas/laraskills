# Anti-Patterns: Team-Scoped Spatie Permission Depth

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | Team-Scoped Spatie Permission Depth for SaaS |
| Audience | Developers, Architects, Security Engineers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-TSP-01 | Stale Permission Cache on Team Switch | Critical | High | Low |
| AP-TSP-02 | Guard Mismatches on Roles and Permissions | Critical | Medium | Medium |
| AP-TSP-03 | Cross-Team Permission Leakage (Missing setPermissionsTeamId) | Critical | High | Low |
| AP-TSP-04 | Plan-as-Permission (Encoding Subscription Tiers as Spatie Permissions) | High | Medium | High |
| AP-TSP-05 | Global Role via Team Membership | High | Medium | Medium |
| AP-TSP-06 | Inline team_id Override from Request | Critical | Medium | Low |

---

## Repository-Wide Anti-Patterns

- **Forgetting team context entirely**: Using Spatie Permission without enabling team mode or calling `setPermissionsTeamId()` — all permissions are global, no team isolation
- **Plan-as-permission across the codebase**: Multiple places encoding subscription tiers as Spatie permissions, creating a tangled web of role-plan synchronization
- **Cache everywhere, invalidate nowhere**: Aggressive permission caching without corresponding invalidation on role changes, team switches, or permission updates

---

## 1. Stale Permission Cache on Team Switch

### Category
Security · Cache Integrity

### Description
Switching a user's active team without invalidating Spatie's permission cache. `setPermissionsTeamId($newTeamId)` is called, but `$user->forgetCachedPermissions()` is omitted. The cache still holds resolved permissions from the previous team's context. The user retains admin access in the new team — or, conversely, retains viewer-level restrictions despite being an owner.

### Why It Happens
Spatie Permission caches resolved permissions aggressively for performance. When team mode is active, the cache key includes the team ID — but after switching teams, the new cache key may not have an entry yet, and the old cache entry is still valid for its key. Developers focus on setting the new team ID and forget that the cache layer is separate from the context layer.

### Warning Signs
- User switches from Team A (owner) to Team B (viewer) but can still delete documents in Team B
- User switches from Team B (viewer) to Team A (owner) but gets 403 on admin actions
- `php artisan cache:clear` temporarily fixes the issue
- Permission changes made by a team owner don't take effect until hours later
- The bug is intermittent — sometimes the cache expires naturally and the bug disappears

### Why Harmful
This is a privilege escalation vulnerability in both directions. A user demoted from admin to viewer retains admin access via stale cache — they can delete resources, access sensitive data, and manage team members in a team where they should be restricted. A user promoted from viewer to admin is denied access — they cannot perform their job function. The cache window can be hours long.

### Real-World Consequences
- User leaves Team A (owner) and joins Team B (viewer) — but retains full access to Team A
- Team owner demotes a problematic member from admin to viewer — the member can still delete all team documents
- New admin promoted but cannot access the admin panel — escalation to support, trust in the platform erodes
- Security audit finds cached permissions not reflecting current role assignments — compliance failure

### Preferred Alternative
Always call `$user->forgetCachedPermissions()` immediately after `setPermissionsTeamId($newTeamId)` in the team switch flow. Register observers on Role and Permission models that broadcast cache invalidation on any change.

### Refactoring Strategy
1. Audit every team switch path (controller, middleware, CLI command) — ensure `forgetCachedPermissions()` is called
2. Add a test that verifies cache invalidation: switch team, assert user has new team's permissions not old team's
3. Register model observers on Role and Permission to trigger cache invalidation for affected users
4. Add `php artisan permission:cache-reset` to deployment scripts after role/permission seeders
5. Consider adding a `switchTeam()` helper method that always pairs `setPermissionsTeamId()` with `forgetCachedPermissions()`

### Detection Checklist
- [ ] Is `forgetCachedPermissions()` called immediately after `setPermissionsTeamId()` in every team switch path?
- [ ] Does the team switch test verify that old team's permissions are not retained?
- [ ] Are observers registered on Role, Permission, and pivot model changes?
- [ ] Is cache reset part of the deployment pipeline?
- [ ] Can a role change made in the admin panel take effect within one request?

### Related Rules/Skills/Trees
- Rule 2 (05-rules.md): Invalidate Permission Cache on Every Team Switch
- Implement Team-Scoped Spatie Permission in SaaS (06-skills.md)

---

## 2. Guard Mismatches on Roles and Permissions

### Category
Framework Usage · Security

### Description
Creating roles and permissions with different guard names (e.g., `admin` role with guard `web` but `api:access` permission with guard `api`). Spatie checks the guard name during authorization — a role assigned with guard `web` cannot be checked against a user authenticated with guard `api`, even for the same user and team. The check silently returns `false`.

### Why It Happens
Laravel applications often use multiple authentication guards (`web` for session-based, `api` for token-based). When creating roles, the default guard from `config/permission.php` is used — but developers may explicitly specify a different guard, or the guard name may differ between development and production configurations.

### Warning Signs
- `$user->hasRole('admin')` returns `false` despite the role being clearly assigned in the database
- Permission check works in web context but fails in API context for the same user
- Spatie's `role` and `permission` middleware passes for some routes but fails for others with the same user
- Debugging reveals the `guard_name` column differs between the role and the user's auth guard
- The issue appears after changing authentication configuration or switching between Breeze/Sanctum/Passport

### Why Harmful
Guard mismatches are silent failures — no exceptions, no warnings, no logs. The permission check simply returns `false`. A user who should have access is denied. This is especially dangerous for admin users who lose the ability to manage the system. The bug is difficult to diagnose because the role is visible in the database but doesn't work at runtime.

### Real-World Consequences
- Admin user cannot access admin panel after API guard is added — hours of debugging before discovering guard mismatch
- New permission added to editor role — works in web tests, fails in API tests because the seeder used the wrong guard
- Production incident: all admin users locked out after authentication config change
- Multiple guards added over time — the `guard_name` column has `web`, `api`, and `null` entries; behavior is unpredictable

### Preferred Alternative
Use a single, consistent guard name for all roles and permissions. In most Laravel applications, this is `web`. Configure the default guard in `config/permission.php` and never override it. When multiple auth guards are necessary, all roles and permissions should still use the same Spatie guard — Spatie's Gate integration handles the auth guard independently.

### Refactoring Strategy
1. Audit the `guard_name` column in `roles` and `permissions` tables — all values must be identical
2. Fix mismatched entries: `UPDATE roles SET guard_name = 'web' WHERE guard_name != 'web';`
3. Set `'guard_name' => 'web'` in `config/permission.php` and never override
4. Update all seeders to use the consistent guard name
5. Add an architecture test: `expect('App')->not->toUse(['guard_name' => 'api'])` or a migration check

### Detection Checklist
- [ ] Do all roles in the database have the same `guard_name`?
- [ ] Do all permissions in the database have the same `guard_name`?
- [ ] Is the default guard in `config/permission.php` consistent across all environments?
- [ ] Do any seeders or factories override the guard name?
- [ ] Does a permission check work identically in web and api contexts for the same user?

### Related Rules/Skills/Trees
- Implement Team-Scoped Spatie Permission in SaaS (06-skills.md)
- 04-standardized-knowledge.md: Guard name consistency

---

## 3. Cross-Team Permission Leakage (Missing setPermissionsTeamId)

### Category
Security · Data Isolation

### Description
Forgetting to call `setPermissionsTeamId()` before a permission check, causing Spatie to use a stale team context from a previous request or default to `null` (global-only). A user who is an admin in Team A may have their `hasPermissionTo('documents:delete')` evaluated against Team A's context even when accessing Team B's resources — because the middleware didn't set the correct team.

### Why It Happens
`setPermissionsTeamId()` is a global function call that is easy to forget. Developers assume the team context "just works" or persists across requests. In long-running processes (Laravel Octane), the team context from one request may leak into the next. Ad-hoc permission checks in controllers or services may miss the team context setup that exists in middleware.

### Warning Signs
- User in Team A (admin) can access Team B resources by manipulating URLs
- Permission check succeeds for a resource in a team the user doesn't belong to
- The bug is intermittent — appears more frequently under load (Octane request reuse)
- Adding `setPermissionsTeamId()` to the affected code path fixes the issue
- Cross-team isolation tests fail, but only for certain resource types

### Why Harmful
This is a direct cross-team data breach. A user in Team A can read, modify, or delete resources in Team B by simply knowing (or guessing) the resource ID. The permission check returns `true` because it was evaluated against the wrong team's roles. This is the most dangerous class of authorization bug in multi-tenant SaaS — it breaks the fundamental isolation guarantee.

### Real-World Consequences
- User in Team A reads Team B's financial documents by guessing document IDs
- User in Team A deletes Team B's production data through a seemingly harmless API call
- Security audit finds cross-team access — SOC2/GDPR compliance failure
- Customer churn because data isolation cannot be trusted

### Preferred Alternative
Implement a `ResolveTeamContext` middleware that calls `setPermissionsTeamId()` on every request before any authorization check runs. This middleware must validate team membership and never accept a `team_id` from untrusted user input. Register the middleware globally or on all team-scoped route groups.

### Refactoring Strategy
1. Create a `ResolveTeamContext` middleware that runs on every request
2. Register it in the kernel before the `auth` and `authorize` middleware
3. In the middleware, resolve team from session, validate membership, and call `setPermissionsTeamId()`
4. For any ad-hoc team context setting (CLI commands, queued jobs), ensure `setPermissionsTeamId()` is called
5. Add a global test that verifies `setPermissionsTeamId()` is called before any permission check in team context

### Detection Checklist
- [ ] Is `setPermissionsTeamId()` called in a middleware that runs on every request?
- [ ] Does the middleware validate team membership before setting the context?
- [ ] Are there any controllers or services that set team context ad-hoc instead of via middleware?
- [ ] Do cross-team isolation tests pass for every resource type?
- [ ] Is the team context cleared when a user logs out or has no valid team membership?

### Related Rules/Skills/Trees
- Rule 1 (05-rules.md): Always Call setPermissionsTeamId() Before Every Permission Check
- Rule 5 (05-rules.md): Validate Team Membership Before Setting the Team Context
- Implement Team-Scoped Spatie Permission in SaaS (06-skills.md)

---

## 4. Plan-as-Permission (Encoding Subscription Tiers as Spatie Permissions)

### Category
Architecture · Authorization Design

### Description
Encoding subscription plan features as Spatie permissions. Creating permissions like `pro-plan`, `enterprise-plan`, `advanced-reporting`, or `priority-support` and assigning them to roles. When a team's plan changes, Spatie permissions must be added or removed from roles — a database operation that must be transactional, cache-invalidated, and synchronized across all team members.

### Why It Happens
Spatie Permission is already in the application and is the "permission system." Subscription plan features are also "permissions" — it feels natural to unify them under one system. The temptation is strong: one `$user->can()` call to check both role and plan. Developers prioritize implementation speed over architectural clarity.

### Warning Signs
- Permission names that match plan tiers: `pro-plan`, `enterprise-plan`, `free-plan`
- Permission names that match feature gates: `advanced-reporting`, `priority-support`, `api-access`
- Role seeder includes plan-specific permissions
- Plan upgrade/downgrade code touches Spatie permission tables
- Admin on free plan gets a generic 403 with no mention of plan upgrade path

### Why Harmful
Roles and plans have different lifecycles and different meanings. A role describes who a user is within a team. A plan describes what features the team has purchased. Mixing them creates confused authorization: an admin on the free plan shouldn't lose their `reports:export` permission (they are still an admin), but the plan should deny the export with a "please upgrade" message. Encoding plans as permissions means revoking the permission from the admin role — the admin now can't do other things that require the same permission, and the denial message is a generic 403 instead of an upgrade prompt.

### Real-World Consequences
- Team upgrades from Free to Pro — Spatie permissions must be added to every role in the team (migration risk)
- Team downgrades from Pro to Free — Spatie permissions must be removed from every role (destructive operation, hard to roll back)
- Admin on Free plan cannot access any admin features because the `admin` role's permissions were gutted to match the Free plan
- Plan-pivot logic pollutes role definitions — roles mean different things on different plans
- Audit logs conflate permission changes (someone was demoted) with plan changes (the team upgraded)

### Preferred Alternative
Use a separate `EntitlementService` or `FeatureGate` for subscription plan checks. Keep Spatie permissions for role-based authorization within the team. Compose the checks: first verify the user has the role permission (Spatie), then verify the team has the plan feature (Entitlement). Denial messages should distinguish: role-based denial is a silent 403, plan-based denial includes an upgrade prompt.

### Refactoring Strategy
1. Identify all Spatie permissions that encode plan tiers or feature gates
2. Create an `EntitlementService` with methods like `allows('feature', $team)` and `getTier('feature', $team)`
3. For each plan-as-permission, add the corresponding plan check in the Action/Controller alongside the role check
4. Remove plan-specific permissions from Spatie seeders and database
5. Update tests: role tests check Spatie permissions; plan tests check Entitlement service; integration tests check both

### Detection Checklist
- [ ] Are there any Spatie permissions named after plan tiers or feature gates?
- [ ] Does plan upgrade/downgrade code modify Spatie permission assignments?
- [ ] Do denial messages distinguish between role-based and plan-based denials?
- [ ] Is there a separate Entitlement/FeatureGate service for plan checks?
- [ ] Would changing a team's plan require a database migration on Spatie permission tables?

### Related Rules/Skills/Trees
- Rule 3 (05-rules.md): Do Not Encode Subscription Plan Features as Spatie Permissions
- Roles vs Entitlements decision tree (07-decision-trees.md)
- Implement Team-Scoped Spatie Permission in SaaS (06-skills.md)

---

## 5. Global Role via Team Membership

### Category
Architecture · Authorization Design

### Description
Assigning a global role (like `super-admin` or `platform-support`) to a user within each team instead of checking it globally via `Gate::before()`. The super-admin is added to every team with the `super-admin` role assigned per-team. As the number of teams grows, the admin's permission assignments explode.

### Why It Happens
The Spatie Permission team system provides a natural way to assign roles per-team. It's tempting to use it for everything — including platform-level roles. Developers may not be aware of `Gate::before()` as an alternative, or they may think "adding the admin to every team" is the only way to give them access.

### Warning Signs
- Super-admin user has `team_id` entries in `model_has_roles` for every team in the system
- New team creation triggers adding the super-admin to that team
- Super-admin's permission cache is enormous (roles x teams)
- Platform admin cannot access a newly created team until explicitly added
- The super-admin appears as a "member" of customer teams in the UI

### Why Harmful
Platform admin doesn't belong in customer teams. Adding them creates false audit trails (admin appears to be a team member), permission explosions (N teams x M permissions), and operational complexity (every new team requires adding the admin). More critically, if the admin's team membership is ever revoked or deactivated in one team, they lose access — but they should have access via their global role regardless.

### Real-World Consequences
- Platform admin cannot support a new customer because they haven't been added to the team yet
- Admin's permission cache exceeds memory limits (500 teams x 20 permissions = 10,000 entries)
- Customer sees "platform support" as a team member in their member list — confusion and privacy concern
- Audit trail shows admin actions attributed to team membership, not platform role
- SOC2 audit: "Why does your support staff appear as members of customer teams?"

### Preferred Alternative
Do not assign global roles via teams. Use `Gate::before()` in `AuthServiceProvider::boot()` to check for global roles. `if ($user->hasRole('super-admin')) return true;` — this bypasses team scope entirely. Global roles should have `team_id = NULL` in the database.

### Refactoring Strategy
1. Remove super-admin and platform-support role assignments from all teams
2. Set `team_id = NULL` for these roles in the database (they are global roles)
3. Add `Gate::before()` check in `AuthServiceProvider::boot()` for global role bypass
4. Audit any code that assumes platform admins belong to teams
5. Update admin support tools to use platform admin's global access, not team membership

### Detection Checklist
- [ ] Do any users have the same global role assigned across multiple teams?
- [ ] Are platform-level roles assigned with a `team_id` in `model_has_roles`?
- [ ] Is `Gate::before()` used for global role bypass?
- [ ] Do global roles have `team_id = NULL` in the roles table?
- [ ] Does new team creation trigger adding any user to that team automatically?

### Related Rules/Skills/Trees
- Rule 4 (05-rules.md): Use Gate::before() Only for Truly Global Roles — Never for Team-Scoped Logic
- Global vs Team-Scoped Roles decision tree (07-decision-trees.md)
- Implement Team-Scoped Spatie Permission in SaaS (06-skills.md)

---

## 6. Inline team_id Override from Request

### Category
Security · Authorization

### Description
Accepting a `team_id` from request input (query parameter, request body, or header) and using it directly as the argument to `setPermissionsTeamId()` without validating that the authenticated user actually belongs to that team. This allows an attacker to manipulate the team context and potentially gain access to another team's resources.

### Why It Happens
Team switching UIs often send the target team ID as a request parameter. The controller receives it and sets it as the current team. If validation is omitted — either through oversight or because "the UI only shows teams the user belongs to" — the endpoint becomes a privilege escalation vector. Client-side validation is not security.

### Warning Signs
- `setPermissionsTeamId($request->input('team_id'))` or similar in controllers or middleware
- Team ID from URL segment used directly without membership check: `setPermissionsTeamId($request->route('team'))`
- No database query verifying the user's membership in the target team
- API endpoint accepts `team_id` in the request body without validation

### Why Harmful
An attacker can enumerate team IDs and set their context to any team. If Spatie permission checks don't independently verify team resource ownership (relying only on `setPermissionsTeamId()` for isolation), the attacker gains access to another team's resources. Even with resource-level team validation, accepting untrusted team IDs creates an enumeration attack vector and makes the authorization model harder to reason about.

### Real-World Consequences
- Attacker enumerates team IDs via API, finds a team where they have elevated access (through a previous membership or misconfiguration)
- Attacker sets their team context to a target team, accesses resources through API endpoints that don't independently verify team ownership
- Security audit finds the endpoint accepts arbitrary team IDs — fails penetration test
- Cross-team data access even though the frontend "only shows the user's teams"

### Preferred Alternative
Always resolve the team context from trusted sources: session data (set during authenticated team switch), or the authenticated user's `last_active_team_id`. Never accept a `team_id` from user input that directly sets the permissions team context without first validating the user's membership.

### Refactoring Strategy
1. Identify every place where `setPermissionsTeamId()` receives input from the request
2. For team switch endpoints, validate the target team ID against the user's actual memberships before applying
3. For middleware, resolve team from session or user's default team — never from request input
4. For API endpoints that need to operate on a specific team's behalf, use a dedicated `X-Team-Id` header that is validated against memberships
5. Add an architecture test: `expect('App')->not->toUse('setPermissionsTeamId($request->input')`)

### Detection Checklist
- [ ] Is `setPermissionsTeamId()` ever called with data from `$request->input()` or `$request->route()`?
- [ ] Does the team switch endpoint validate membership before applying the new team context?
- [ ] Is the team context in middleware resolved from the session, not the request?
- [ ] Can an attacker change their team context by modifying a request parameter?
- [ ] Do API endpoints independently validate team resource ownership?

### Related Rules/Skills/Trees
- Rule 5 (05-rules.md): Validate Team Membership Before Setting the Team Context
- Implement Team-Scoped Spatie Permission in SaaS (06-skills.md)
