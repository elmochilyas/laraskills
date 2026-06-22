# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | Team-scoped Spatie Permission depth for SaaS |
| Difficulty | Advanced |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Spatie/laravel-permission, Laravel Gates & Policies, Multi-tenant architecture |
| Related KUs | Authorization test matrix for SaaS, Laravel Policies & Gates, Roles & Permissions, Multi-tenant authentication |
| Source | domain-analysis.md |

# Overview

Spatie Permission's team support requires careful configuration: guard name consistency, current team context resolution, permission cache invalidation per team, and clear separation of global roles vs team-scoped roles. Without explicit attention to these details, permissions leak across teams or silently fail to apply. Team-scoped permissions must be complemented by a separate entitlement system for plan-based access — do not encode subscription plan features as Spatie permissions.

# Core Concepts

- **Spatie Permission team support**: Enabled via `'teams' => true` in `config/permission.php`. Adds a `team_foreign_key` column to the permissions and roles tables. When team mode is active, every permission check includes the team context.
- **Guard name consistency**: All roles and permissions must use the same guard (`'web'` or `'api'`). Mismatched guards silently fail — a role assigned with guard `web` cannot be checked with guard `api`, even for the same user and team.
- **Current team context**: `setPermissionsTeamId($teamId)` must be called before every permission check in a team-scoped context. The team context can be stored in the session or resolved from the request. It must be invalidated when the user switches teams.
- **Global roles vs team-scoped roles**: Super-admin and platform-admin roles should be global (not assigned via team). Use `Gate::before()` to grant these roles universal access. Team-scoped roles (owner, admin, member, viewer) are assigned per-team.
- **Platform admin vs team owner**: Platform admins should bypass team scope entirely via `Gate::before()`. Team owners have full access but only within their team. Do not give platform admins team-scoped permissions — they don't belong to every team.
- **Permission cache invalidation**: Spatie caches resolved permissions for performance. When the team changes, the cache must be invalidated. `$user->forgetCachedPermissions()` or clearing the cache tag is required on every team switch.
- **Permission leakage across teams**: If `setPermissionsTeamId()` is not called before a permission check, Spatie may return permissions from the previously set team — a cross-team data leak.
- **Separate roles from entitlements**: Do not encode subscription plan features as Spatie permissions. Use a separate FeatureGate or Entitlement service for plan-based access. `User::can('export-reports')` checks team role; `$plan->allows('reports')` checks subscription plan.

# When To Use

- Multi-tenant SaaS applications where users belong to one or more teams
- When each team has its own internal role hierarchy (owner, admin, member, viewer)
- When team members have different capabilities within the team
- When platform-level admins need to manage or support any team

# When NOT To Use

- For single-tenant applications (use standard Spatie Permission without teams)
- For encoding subscription plan features as permissions (use a separate Entitlement/FeatureGate service)
- When team roles never change within a team (everyone is equal — no role hierarchy needed)
- When you are using a separate multi-tenant database strategy (schema-per-tenant or database-per-tenant) that already provides isolation

# Best Practices (WHY)

- **Always call `setPermissionsTeamId()` before permission checks**: Reason: Without it, Spatie permissions may reference the wrong team, causing cross-team permission leakage or denial of access.
- **Use `Gate::before()` for platform admin bypass**: Reason: Platform admins should never need team-scoped permissions. Their access is global and should be checked outside the team context to avoid edge cases.
- **Invalidate permission cache on team switch**: Reason: Spatie caches resolved permissions aggressively. Switching teams without clearing the cache means the user retains permissions from the previous team — a security bug.
- **Do not encode plan features as permissions**: Reason: Roles and permissions describe who can do what within a team. Plans describe what features a team has access to. Mixing them creates confused authorization logic (e.g., "admin can't export reports because free plan" should NOT mean removing the `reports:export` permission from the admin role).
- **Separate permission checks (role/team) from entitlement checks (plan/subscription)**: Reason: Two different authorization dimensions. Use Policies for role-based checks. Use a separate Entitlement/FeatureGate service for plan-based checks.

# Architecture Guidelines

- **Team context middleware**: Create a middleware that resolves the current team from the request (subdomain, path, session, or header) and calls `setPermissionsTeamId()`. This middleware must run before any authorization check.
- **Team switch flow**: When a user switches teams, (1) validate they belong to the target team, (2) call `setPermissionsTeamId($newTeamId)`, (3) call `$user->forgetCachedPermissions()`, (4) regenerate the session.
- **Global roles in `Gate::before()`**: `if ($user->hasRole('super-admin')) return true;` in `AuthServiceProvider::boot()`. This bypasses all team-scoped checks for platform admins. Do NOT assign `super-admin` via team — it is a global role.
- **Entitlement service**: A separate service that checks the team's subscription plan for feature access. `$entitlement->allows('advanced-reporting', $team)`. This is called alongside (not instead of) permission checks.
- **Database schema**: Spatie's team mode adds `team_foreign_key` to `roles`, `permissions`, and `model_has_roles`/`model_has_permissions` pivot tables. Ensure the `team_foreign_key` column references your teams table.

# Performance Considerations

- Spatie's permission cache is global by default. When team mode is active, the cache key includes the team ID. Cache invalidation must be per-user-per-team.
- Permission checks on every request can add overhead. The cache mitigates this by storing resolved permissions in a single cache key. A cache hit means one Redis read instead of multiple DB queries.
- Team switching is the critical cache invalidation point. If your application supports frequent team switching, ensure the cache invalidation is fast and atomic.
- Large teams with many roles and permissions: the serialized permission cache for a user in a team with 50+ permissions can be large. Monitor cache memory usage.

# Security Considerations

- Team context is a security boundary. Never accept a `team_id` from user input that overrides the resolved team context without validation.
- Permission cache staleness is a security vulnerability. If a team owner revokes a user's admin role, the user must not retain admin access via stale cache.
- Cross-team permission leakage: test explicitly that a user in team A cannot access team B resources via Spatie permission checks. The `team_foreign_key` must be set before every check.
- `Gate::before()` bypass is powerful. Ensure it is limited to truly global roles (super-admin, platform support). Never put team-scoped logic in `Gate::before()`.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Forgetting `setPermissionsTeamId()` | Assumption that team context persists | Permission checks return results from the previous team; cross-team access | Call `setPermissionsTeamId()` in a middleware that runs on every request |
| Not invalidating cache on team switch | Spatie's cache is long-lived | User retains permissions from old team after switching; sees team B data with team A permissions | `$user->forgetCachedPermissions()` on every team switch |
| Encoding plan features as Spatie permissions | Desire for unified auth checks | Admin on free plan has `reports:export` permission revoked — can't access anything requiring admin role | Separate Entitlement service for plan checks; keep Spatie permissions for role-based access |
| `setPermissionsTeamId()` after permission check | Wrong code order | Permission check executes without team context, returns wrong result | Call `setPermissionsTeamId()` BEFORE any authorization check |
| Assigning platform admin roles per-team | Desire to give support team access | Platform admin belongs to team A but not team B — can't support team B users | Use `Gate::before()` for global roles; never assign platform admin via team |
| Mismatched guards on roles and permissions | Creating roles with different guard names | `$user->hasRole('admin')` returns false even though the user has the role | All roles and permissions use the same guard (`'web'`). Check config default |
| Checking permissions without team context in `Gate::before()` | Gate callback runs before team middleware | `$user->hasRole('admin')` checks against global roles (null team_id), not team roles | `Gate::before()` should only use `hasRole()` for global roles, not team-scoped ones |

# Anti-Patterns

- **Plan-as-permission**: `Permission::create(['name' => 'pro-plan']); $role->givePermissionTo('pro-plan');`. Subscription plans change independently of roles. Encode plans as a separate domain concept.
- **Global role via team membership**: Assigning `super-admin` role to a user in every team. The user now has permission explosions as teams grow. Use `Gate::before()` for truly global access.
- **Cache staleness on permission revocation**: Revoking a permission from a role but not clearing the user cache. Use observers on role/permission changes to broadcast cache invalidation.
- **Team-switching without cache reset**: `setPermissionsTeamId($newId);` without `forgetCachedPermissions()`. The cache still holds old team's permissions.
- **Inline team_id override from request**: `setPermissionsTeamId($request->input('team_id'));`. This is a privilege escalation vector if not validated against the user's actual team memberships.

# Examples

**Team context middleware**
```php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ResolveTeamContext
{
    public function handle(Request $request, Closure $next): mixed
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // Resolve current team from session (set during team switch)
        $teamId = session('current_team_id');

        if (!$teamId) {
            // Default to user's last active team or first team
            $teamId = $user->last_active_team_id
                ?? $user->teams()->first()?->id;
        }

        if ($teamId) {
            // Verify user actually belongs to this team
            $membership = $user->teams()
                ->wherePivot('team_id', $teamId)
                ->wherePivotNull('deactivated_at')
                ->exists();

            if ($membership) {
                setPermissionsTeamId($teamId);
                session(['current_team_id' => $teamId]);
            } else {
                // User no longer belongs — clear team context
                session()->forget('current_team_id');
            }
        }

        return $next($request);
    }
}
```

**Platform admin bypass in Gate::before()**
```php
namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider;

class AuthServiceProvider extends AuthServiceProvider
{
    public function boot(): void
    {
        Gate::before(function ($user, $ability) {
            // Global super-admin bypass — not team-scoped
            if ($user->hasRole('super-admin')) {
                return true;
            }

            // Platform support can view any resource for debugging
            if ($ability === 'view' && $user->hasRole('platform-support')) {
                return true;
            }

            // For all other checks, let the Policy decide
            return null;
        });
    }
}
```

**Permission check with team scope (Policy)**
```php
namespace App\Policies;

use App\Models\User;
use App\Models\Document;

class DocumentPolicy
{
    public function view(User $user, Document $document): bool
    {
        // Team isolation: user and document must be in the same team
        // (team_id is set by the TeamContext middleware via setPermissionsTeamId)
        $currentTeamId = getPermissionsTeamId();

        if ($document->team_id !== $currentTeamId) {
            return false;
        }

        // Role check within team
        // Spatie automatically scopes this to the team set via setPermissionsTeamId()
        if ($user->hasPermissionTo('documents:read')) {
            // Ownership or sharing check
            return $user->id === $document->user_id
                || $document->sharedWith($user);
        }

        return false;
    }

    public function update(User $user, Document $document): bool
    {
        $currentTeamId = getPermissionsTeamId();

        if ($document->team_id !== $currentTeamId) {
            return false;
        }

        return $user->hasPermissionTo('documents:write')
            && $user->id === $document->user_id;
    }

    public function delete(User $user, Document $document): bool
    {
        $currentTeamId = getPermissionsTeamId();

        if ($document->team_id !== $currentTeamId) {
            return false;
        }

        // Admin/Owner can delete any team document; member can delete own
        return $user->hasPermissionTo('documents:delete')
            && ($user->hasRole('admin') || $user->hasRole('owner') || $user->id === $document->user_id);
    }
}
```

**Cache invalidation on team switch**
```php
namespace App\Http\Controllers;

use Illuminate\Http\Request;

class TeamSwitchController extends Controller
{
    public function switch(Request $request, string $teamId): RedirectResponse
    {
        $team = $request->user()->teams()
            ->where('teams.id', $teamId)
            ->wherePivotNull('deactivated_at')
            ->firstOrFail();

        // 1. Update team context
        setPermissionsTeamId($team->id);

        // 2. Invalidate permission cache — CRITICAL
        $request->user()->forgetCachedPermissions();

        // 3. Store in session
        session(['current_team_id' => $team->id]);

        // 4. Regenerate session for security
        $request->session()->regenerate();

        // 5. Track last active team
        $request->user()->update(['last_active_team_id' => $team->id]);

        return redirect()->route('dashboard');
    }
}
```

**Separate role check from plan entitlement**
```php
namespace App\Actions\Reports;

use App\Models\User;
use App\Models\Team;

class ExportReportAction
{
    public function __construct(
        private readonly EntitlementService $entitlement,
    ) {}

    public function execute(User $user, Team $team, Report $report): BinaryFileResponse
    {
        // 1. Role-based check: does the user have permission in this team?
        setPermissionsTeamId($team->id);
        Gate::authorize('export-reports');

        // 2. Plan-based check: does this team's subscription allow this feature?
        if (!$this->entitlement->allows('advanced-reporting', $team)) {
            abort(403, 'Advanced reporting requires a Pro or Enterprise plan. '
                . 'Please upgrade your subscription.');
        }

        // Proceed with export — user has both role AND plan access
        return $this->export($report);
    }
}
```

# Related Topics

- Authorization test matrix for SaaS (testing role x plan combinations)
- Laravel Policies & Gates (authorization building blocks)
- Roles & Permissions (Spatie core concepts)
- Multi-tenant authentication (tenant isolation patterns)
- After-commit events and jobs (ensuring team creation side effects)
- Spatie Permission configuration and caching

# AI Agent Notes

- When generating multi-tenant authorization code, always include `setPermissionsTeamId()` before any Spatie permission check. This is the most common source of cross-team permission bugs.
- When generating a team switching flow, always include `$user->forgetCachedPermissions()`. Never omit the cache invalidation step.
- When generating policies for team-scoped resources, always validate that the resource's team matches the current team context before checking roles.
- Do not encode subscription plan levels as Spatie permissions. Generate a separate Entitlement/FeatureGate service for plan-based access.
- Use `Gate::before()` only for truly global roles (super-admin, platform support). Never put team-scoped authorization logic in `Gate::before()`.
- When generating roles and permissions, ensure guard name consistency: all use the same guard string. Mismatched guards are a silent failure that is hard to debug.

# Verification

- [ ] `setPermissionsTeamId()` is called before every permission check in team context
- [ ] Team context middleware resolves and validates team membership on every request
- [ ] Permission cache is invalidated on every team switch (`forgetCachedPermissions()`)
- [ ] Platform admins bypass team scope via `Gate::before()`, not via team-assigned roles
- [ ] All roles and permissions use the same guard name (no mismatched guards)
- [ ] No subscription plan features are encoded as Spatie permissions
- [ ] Entitlement/FeatureGate service exists separately from Spatie Permission
- [ ] Cross-team permission leakage is tested (user in team A cannot access team B resources)
- [ ] Team context is never accepted unsanitized from user input
- [ ] `team_foreign_key` is indexed in all Spatie permission tables
