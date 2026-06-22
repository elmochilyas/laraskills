# Rules — Team-Scoped Spatie Permission Depth for SaaS

## Rule 1: Always Call setPermissionsTeamId() Before Every Permission Check
| Field | Value |
|-------|-------|
| **Name** | Always Call setPermissionsTeamId() Before Every Permission Check |
| **Category** | Security — Data Isolation |
| **Rule** | In a multi-tenant SaaS using Spatie Permission with team mode, `setPermissionsTeamId($teamId)` must be called before every authorization check. This must happen in a middleware that runs on every request, not ad-hoc in individual controllers. Without it, Spatie may return permissions from a previously set team — a cross-team data leak. |
| **Reason** | Spatie Permission with team mode uses a global function `setPermissionsTeamId()` to establish the current team context. If this is not called, the library may use a stale team ID from a previous request (in Octane) or default to `null` (returning global roles only). In either case, permission checks are evaluated against the wrong team. A user who is an admin in Team A might have their `hasPermissionTo('documents:delete')` evaluated against Team A's context even when accessing Team B's resources — because the middleware didn't set the correct team. |
| **Bad Example** | ```php
class DocumentController {
    public function destroy(Document $document) {
        // No setPermissionsTeamId() — uses stale team or global context
        Gate::authorize('delete', $document);
    }
}
``` |
| **Good Example** | ```php
// App\Http\Middleware\ResolveTeamContext
class ResolveTeamContext {
    public function handle(Request $request, Closure $next) {
        if ($user = $request->user()) {
            $teamId = session('current_team_id') ?? $user->last_active_team_id;
            if ($teamId && $user->belongsToTeam($teamId)) {
                setPermissionsTeamId($teamId);
            }
        }
        return $next($request);
    }
}
``` |
| **Exceptions** | Global-only operations where team context is intentionally absent — for example, platform admin dashboards, user profile settings, or when a user hasn't selected a team yet. In these cases, explicitly ensure `setPermissionsTeamId(null)` is called to clear any stale context. |
| **Consequences Of Violation** | Cross-team permission leakage. User in Team A (where they are admin) can access Team B resources because permission checks resolve against Team A's context. User in Team C (where they were demoted from admin to viewer) retains admin access because stale team context hasn't been updated. This is a P0 security vulnerability in multi-tenant SaaS applications. |

## Rule 2: Invalidate Permission Cache on Every Team Switch
| Field | Value |
|-------|-------|
| **Name** | Invalidate Permission Cache on Every Team Switch |
| **Category** | Security — Cache Integrity |
| **Rule** | When a user switches teams, call `$user->forgetCachedPermissions()` immediately after `setPermissionsTeamId($newTeamId)`. Never skip this step. Spatie's permission cache is aggressive and long-lived — switching teams without invalidating the cache means the user retains the resolved permissions from the previous team. |
| **Reason** | Spatie Permission caches the full list of resolved permissions (roles + direct permissions + inherited permissions) per user in a single cache key. When team mode is active, the cache key includes the team ID. After switching teams, the cache key changes — but the old cache entry is still valid and could be returned if the new team's permissions haven't been cached yet. Explicit invalidation ensures the next permission check triggers a fresh resolution against the new team's roles and permissions. |
| **Bad Example** | ```php
public function switchTeam(Request $request, $teamId) {
    setPermissionsTeamId($teamId);
    session(['current_team_id' => $teamId]);
    // Missing: $request->user()->forgetCachedPermissions();
}
``` |
| **Good Example** | ```php
public function switchTeam(Request $request, $teamId) {
    setPermissionsTeamId($teamId);
    $request->user()->forgetCachedPermissions(); // CRITICAL
    session(['current_team_id' => $teamId]);
    $request->session()->regenerate();
}
``` |
| **Exceptions** | When the team switch is to the same team (no-op). When switching from a team to a global/teamless context — still invalidate to clear team-scoped cache. |
| **Consequences Of Violation** | User switches from Team A (where they are owner with full access) to Team B (where they are viewer). Because the cache wasn't invalidated, `$user->can('delete', $document)` still returns true for Team B documents. The user retains full access in the new team until the cache naturally expires (often hours). This is a privilege escalation vulnerability. |

## Rule 3: Do Not Encode Subscription Plan Features as Spatie Permissions
| Field | Value |
|-------|-------|
| **Name** | Do Not Encode Subscription Plan Features as Spatie Permissions |
| **Category** | Authorization Design |
| **Rule** | Keep subscription plan entitlements (what features a team's plan includes) completely separate from Spatie permissions (what a user can do within a team). Use a dedicated Entitlement or FeatureGate service for plan-based access checks. Never create Spatie permissions like `pro-plan`, `enterprise-plan`, or `advanced-reporting` that encode plan tiers. |
| **Reason** | Roles and plans are two independent authorization axes: roles determine who can do what within a team, plans determine what features a team has access to. Mixing them creates confused authorization logic. For example, an admin on the free plan shouldn't lose their `reports:export` permission — the permission should remain, but the plan check should deny access with a clear "upgrade to Pro" message. Encoding plans as permissions means revoking permissions from roles based on plan — which requires complex synchronization logic and makes it impossible to distinguish between "you lack the role" and "your plan doesn't include this." |
| **Bad Example** | ```php
$adminRole->givePermissionTo('pro-plan');
$adminRole->givePermissionTo('advanced-reporting'); // Plan feature as permission
Gate::define('export-reports', fn ($user) => $user->can('advanced-reporting'));
// User gets 403 with no indication it's a plan limitation
``` |
| **Good Example** | ```php
// Role check (Spatie)
Gate::define('export-reports', fn ($user) => $user->hasPermissionTo('reports:export'));
// Plan check (EntitlementService — separate)
if (!$entitlement->allows('advanced-reporting', $team)) {
    abort(403, 'Advanced reporting requires a Pro plan. Please upgrade.');
}
``` |
| **Exceptions** | Single-plan applications where all teams have the same feature set. In this case, plan-based gates are unnecessary — role-based authorization alone is sufficient. |
| **Consequences Of Violation** | Changing a team's plan requires modifying their users' Spatie permissions — a database operation that must be transactional and cache-invalidated. Admins on free plans see confusing 403 errors with no upgrade path. Plan-pivot logic pollutes role definitions, making both harder to reason about. Audit logs conflate permission changes with plan changes. |

## Rule 4: Use Gate::before() Only for Truly Global Roles — Never for Team-Scoped Logic
| Field | Value |
|-------|-------|
| **Name** | Use Gate::before() Only for Truly Global Roles — Never for Team-Scoped Logic |
| **Category** | Authorization Design |
| **Rule** | `Gate::before()` must only bypass authorization for truly global roles: `super-admin` and `platform-support`. Never put team-scoped authorization logic (checking `hasRole('admin')` within a team) in `Gate::before()`. Team-scoped authorization must flow through Policies where the team context is properly established. |
| **Reason** | `Gate::before()` runs before Policies and before the team context middleware may have been applied. At this point in the request lifecycle, `setPermissionsTeamId()` may not have been called yet. A `hasRole('admin')` check in `Gate::before()` will check against global roles (where `team_id IS NULL`) rather than team-scoped roles — returning false for a user who is an admin in their current team but doesn't hold a global admin role. This creates a silent authorization failure that is extremely difficult to debug. |
| **Bad Example** | ```php
Gate::before(function ($user) {
    if ($user->hasRole('admin')) return true; // Checks global roles, not team-scoped
    if ($user->hasRole('owner')) return true; // Same problem
});
``` |
| **Good Example** | ```php
Gate::before(function ($user) {
    // Only truly global roles bypass
    if ($user->hasRole('super-admin')) return true;
    if ($user->hasRole('platform-support') && $ability === 'view') return true;
    return null; // Let the Policy decide for team-scoped users
});
``` |
| **Exceptions** | Applications without team scoping (single-tenant). In this case, all roles are global and `Gate::before()` with `hasRole()` is appropriate. |
| **Consequences Of Violation** | Team admins see 403 Forbidden on resources they own because `Gate::before()` checked global roles (where they have none) and returned null, then the Policy ran with unset team context. Alternatively, if `Gate::before()` returns true for an admin role that was globally assigned, that admin bypasses team isolation and can access any team's resources — a cross-team security vulnerability. |

## Rule 5: Validate Team Membership Before Setting the Team Context
| Field | Value |
|-------|-------|
| **Name** | Validate Team Membership Before Setting the Team Context |
| **Category** | Security — Authorization |
| **Rule** | Before calling `setPermissionsTeamId($teamId)`, verify the authenticated user actually belongs to that team with an active membership. Never accept a `team_id` from user input (request body, query parameter) that directly sets the permissions team context without validation. |
| **Reason** | If an attacker can control the `team_id` parameter that sets the team context, they can set it to any team's ID and potentially gain access if the permission check queries aren't properly isolated. Even with proper database-level team scoping, accepting untrusted team IDs creates a vector for enumeration attacks and makes the authorization model harder to reason about. |
| **Bad Example** | ```php
public function handle(Request $request) {
    $teamId = $request->input('team_id'); // Untrusted user input
    setPermissionsTeamId($teamId); // No validation
}
``` |
| **Good Example** | ```php
public function handle(Request $request) {
    $teamId = session('current_team_id') ?? $request->user()->last_active_team_id;
    $membership = $request->user()->teams()->wherePivot('team_id', $teamId)
        ->wherePivotNull('deactivated_at')->exists();
    if (!$membership) abort(403);
    setPermissionsTeamId($teamId);
}
``` |
| **Exceptions** | Platform admin support tools where an admin explicitly selects a team to impersonate or investigate — but this must be behind `Gate::before()` checks and heavily audited. The admin's authorization should still be their global role, not the target team's roles. |
| **Consequences Of Violation** | Privilege escalation via team ID manipulation. An attacker enumerating team IDs can find teams where they have elevated roles (if team membership isn't validated). Cross-team data access through forced team context switching. Audit trail shows actions attributed to the wrong team context. |
