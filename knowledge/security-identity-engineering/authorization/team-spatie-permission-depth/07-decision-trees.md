# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authorization
**Knowledge Unit:** Team-Scoped Spatie Permission Depth for SaaS
**Generated:** 2026-06-22

---

# Decision Inventory

* Decision 1: Global roles vs team-scoped roles — where should a role live?
* Decision 2: Spatie Permission checks vs native Laravel Gates for team authorization
* Decision 3: Roles (Spatie permissions) vs entitlements (subscription plan features) for authorization decisions

---

# Architecture-Level Decision Trees

---

## Decision: Global Roles vs Team-Scoped Roles

---

## Decision Context

Determine whether a given role should be global (checked via `Gate::before()`, bypasses team scope) or team-scoped (assigned per-team via Spatie Permission with `team_foreign_key`).

---

## Decision Criteria

* security considerations: global roles bypass all team isolation — must be limited to trusted identities
* architectural considerations: team-scoped roles require `setPermissionsTeamId()` to be called before every check
* maintainability considerations: global roles are easier to audit (fewer assignments); team-scoped roles scale with teams
* practical considerations: can a user with this role legitimately need access to every team, or only specific teams?

---

## Decision Tree

Does this role need access to resources in any team, regardless of team membership?
↓
YES → Is the user in this role trusted at the platform level (employee, support staff, system account)?
    YES → **GLOBAL ROLE** — check via `Gate::before()` in `AuthServiceProvider::boot()`
        ↓
        What level of access?
        Full unrestricted → Return `true` in `Gate::before()` (e.g., `super-admin`)
        View-only for support → Return `true` only for `view` ability (e.g., `platform-support`)
        Feature-specific → Check specific ability names before bypassing
        Example: `if ($user->hasRole('super-admin')) return true;`
    NO → **RE-EVALUATE** — if the user isn't platform-trusted, they shouldn't have cross-team access
        Consider: should this user be added to specific teams with team-scoped roles instead?
NO → Does the user's access vary per team (admin in team A, viewer in team B)?
    YES → **TEAM-SCOPED ROLE** — assign via Spatie with `team_foreign_key`
        ↓
        Role assignment strategy:
        `$user->assignRole('admin', $team->id);` — tied to a specific team
        `setPermissionsTeamId($team->id)` required before permission checks
        Checked via Policies: `$user->hasPermissionTo('resource:action')` (team-scoped automatically)
    NO → Is the role for a user who belongs to exactly one team and has uniform access?
        YES → **TEAM-SCOPED ROLE** — still use Spatie team mode for consistency
            Single-team users still benefit from team isolation and audit trails
        NO → **GLOBAL ROLE** — user needs platform-level access that's independent of team membership
            Example: billing system account, background job runner, monitoring agent
    ↓
    Does the role interact with team-specific resources in Policies?
    YES → **TEAM-SCOPED** — must have team context for `$resource->team_id === getPermissionsTeamId()` checks
    NO → **GLOBAL** — no need for team context; role operates at platform level

---

## Rationale

Global roles bypass team isolation — they are powerful and dangerous. Only platform-trusted identities (employees, system accounts) should hold global roles. Team-scoped roles are the default for all customer-facing users. The distinction prevents privilege escalation where a team admin accidentally gains cross-team access through a misconfigured global role.

---

## Recommended Default

**Default:** Team-scoped roles for all customer-facing users. Global roles only for platform staff and system accounts.

**Reason:** The principle of least privilege demands that access is scoped to the minimum necessary. A customer's admin in Team A should never have implicit access to Team B. Team-scoped roles enforce this by design.

---

## Risks Of Wrong Choice

Global role for customer user: cross-team data access, privilege escalation, SOC2/GDPR compliance violation. Team-scoped role for platform admin: admin must be added to every team (unscalable, creates permission explosion, creates false audit trail of admin "membership" in customer teams).

---

## Related Rules

- Rule 4 (05-rules.md): Use Gate::before() Only for Truly Global Roles — Never for Team-Scoped Logic
- Rule 1 (05-rules.md): Always Call setPermissionsTeamId() Before Every Permission Check

---

## Related Skills

- Implement Team-Scoped Spatie Permission in SaaS (06-skills.md)

---

## Decision: Spatie Permission Checks vs Native Laravel Gates for Team Authorization

---

## Decision Context

When checking authorization within a team-scoped SaaS, determine whether to use Spatie's `hasPermissionTo()` / `hasRole()` (which respects team context when `setPermissionsTeamId()` is called) or Laravel's native `Gate::allows()` / `$user->can()` (which integrates with Spatie via Gate but is independent of team context at the Gate level).

---

## Decision Criteria

* architectural considerations: Spatie checks are database-driven and team-aware; native Gates require explicit team context in the Gate definition
* security considerations: Spatie checks automatically scope to the set team; native Gates must manually verify team context
* maintainability considerations: Spatie checks are simpler for team-scoped logic; native Gates are simpler for non-team logic
* testing considerations: Spatie checks require `setPermissionsTeamId()` in test setup; native Gates are testable in isolation

---

## Decision Tree

Does the authorization check need to verify team membership or team scope?
↓
YES → Does the authorization logic combine team scope with role checks?
    YES → **POLICY WITH SPATIE** — check team_id match first, then `$user->hasPermissionTo()`
        ↓
        Structure in Policy:
        1. `$document->team_id === getPermissionsTeamId()` — team isolation guard
        2. `$user->hasPermissionTo('resource:action')` — role check (auto-scoped by Spatie)
        3. Additional checks (ownership, sharing status)
        Example: DocumentPolicy with team_id validation before permission check
    NO → Is the check purely "does user belong to this team?"
        YES → **NATIVE GATE** — `$user->belongsToTeam($team)` or pivot check
            No Spatie permission needed — this is team membership verification, not role authorization
        NO → **SPATIE DIRECT** — `$user->hasPermissionTo('admin:access')` when team context is set
NO → Is the authorization check independent of teams (global feature, profile setting, billing)?
    YES → **NATIVE GATE** — define in `AuthServiceProvider::boot()` without team context
        ↓
        Is the check Spatie-aware (checks roles/permissions)?
        YES → Use `$user->hasRole('super-admin')` or `$user->can('export-reports')` (Spatie integrates with `can()`)
        NO → Use `Gate::define('access-billing', fn ($user) => $user->subscribed())`
    NO → Is this an entitlement check (subscription plan feature, not role)?
        YES → **ENTITLEMENT SERVICE** — not Spatie, not native Gate
            Use a separate `EntitlementService` with `$entitlement->allows('feature', $team)`
            This is a plan check, not a permission check

---

## Rationale

Spatie Permission and Laravel's native Gate system are complementary, not competing. Spatie integrates with `$user->can()` via Gate, so Policies using `$user->can('permission')` work with both systems. The decision is about where the team scope is enforced: Spatie's `hasPermissionTo()` respects `setPermissionsTeamId()` automatically; native Gates must implement team scope manually in the Gate definition. Use Policies with Spatie for team-scoped authorization; use native Gates for team-independent checks.

---

## Recommended Default

**Default:** Use Policies with Spatie permission checks for all team-scoped resource authorization. Use native Gates for team-independent authorization (global features, profile settings, billing). Use EntitlementService for plan-based feature checks.

**Reason:** Separation of concerns. Policies handle the intersection of team scope + role + resource ownership. Gates handle context-free authorization. Entitlement service handles plan-based access. Each has a clear responsibility boundary.

---

## Risks Of Wrong Choice

Spatie for everything: Gates with no team scope dependencies become unnecessarily complex with `setPermissionsTeamId()` overhead. Native Gate for team-scoped checks: team isolation must be manually implemented and is easily forgotten. Mixing both without clear boundaries: authorization logic is scattered across Policies, Gates, Spatie direct calls, and inline checks — impossible to audit.

---

## Related Rules

- Rule 1 (05-rules.md): Always Call setPermissionsTeamId() Before Every Permission Check
- Rule 3 (05-rules.md): Do Not Encode Subscription Plan Features as Spatie Permissions

---

## Related Skills

- Implement Team-Scoped Spatie Permission in SaaS (06-skills.md)

---

## Decision: Roles (Spatie Permissions) vs Entitlements (Subscription Plan Features) for Authorization Decisions

---

## Decision Context

When an authorization decision depends on both the user's role within a team AND the team's subscription plan, determine which axis is checked by which system. This decision prevents conflating role-based access (who can do what) with plan-based access (what features the team has paid for).

---

## Decision Criteria

* architectural considerations: roles are stable per user-per-team; plans change independently (upgrades, downgrades, cancellations)
* security considerations: mixing roles and plans creates confused authorization where revoking a plan feature accidentally revokes role permissions
* maintainability considerations: role changes and plan changes have different triggers, different audit trails, different cache invalidation
* user experience considerations: plan-based denials should show upgrade prompts; role-based denials should be silent 403s

---

## Decision Tree

What is the nature of the access restriction?
↓
IS THE USER DENIED BECAUSE THEY LACK THE RIGHT ROLE?
    Example: Viewer trying to delete a document → **ROLE CHECK (SPATIE)**
    ↓
    Use: `$user->hasPermissionTo('documents:delete')` in a Policy
    Error: `403 Forbidden` (no upgrade path — this user shouldn't have this capability)
    ↓
IS THE USER DENIED BECAUSE THE TEAM'S PLAN DOESN'T INCLUDE THE FEATURE?
    Example: Admin on Free plan trying to export reports → **PLAN CHECK (ENTITLEMENT SERVICE)**
    ↓
    Use: `$entitlement->allows('advanced-reporting', $team)` in the Action/Controller
    Error: `403 Forbidden` with "Upgrade to Pro to access advanced reporting" message
    ↓
IS THE USER DENIED FOR BOTH REASONS?
    Example: Viewer on Free plan trying to access premium API → **BOTH CHECKS**
    ↓
    Check order:
    1. Role check first (Spatie) — if they lack the role, return 403 (don't leak plan info)
    2. Plan check second (Entitlement) — if they have the role but wrong plan, return 403 with upgrade prompt
    ↓
DOES THE FEATURE EXIST IN ALL PLANS BUT BEHAVE DIFFERENTLY PER PLAN?
    Example: All plans can export, but Free plan is CSV-only, Pro is PDF+CSV → **ENTITLEMENT-DRIVEN BEHAVIOR**
    ↓
    Use: `$entitlement->getTier('export-format', $team)` → returns `'csv'` or `['csv', 'pdf']`
    Not a permission check — the user has the `reports:export` permission regardless of plan
    The plan determines what export formats are available
    ↓
IS THE PLAN CHANGE LIKELY TO AFFECT THIS AUTHORIZATION?
    YES → **ENTITLEMENT SERVICE** — plan changes should not require Spatie permission database changes
    NO → Is the check about team-internal role hierarchy?
        YES → **SPATIE PERMISSION** — stable within the team regardless of plan
            Example: "Can this user invite new team members?" (owner can, viewer can't)
        NO → Evaluate: is this a team capability or a user capability?
            Team capability → Entitlement (billed to the team's subscription)
            User capability → Spatie (granted by team role)

---

## Rationale

Roles and plans are two independent authorization axes with different lifecycles. Roles change when team members are promoted, demoted, or leave. Plans change when the team upgrades, downgrades, or cancels. Co-mingling them means a plan downgrade requires a Spatie permission migration — a database operation that must be transactional, cache-invalidated, and auditable. Keeping them separate means each axis changes independently and the authorization logic is composable: "has role AND has plan" rather than a single confused check.

---

## Recommended Default

**Default:** Build both systems independently. Every protected action checks: (1) role via Spatie permission in a Policy, and (2) plan via Entitlement service in the Action. The two checks are composable with AND logic — both must pass.

**Reason:** Clear separation of concerns. Role checks answer "who can do what within the team." Plan checks answer "what features does this team have access to." Both are necessary, neither is sufficient alone. Composability ensures neither axis can silently bypass the other.

---

## Risks Of Wrong Choice

Conflating roles and plans: an admin on Free plan has their `reports:export` permission revoked to match the plan — but now they can't perform other admin actions that happen to use the same permission. Separating but checking only one axis: right-role-wrong-plan (admin accesses premium feature without paying) or right-plan-wrong-role (viewer on Enterprise plan performs admin actions).

---

## Related Rules

- Rule 3 (05-rules.md): Do Not Encode Subscription Plan Features as Spatie Permissions

---

## Related Skills

- Implement Team-Scoped Spatie Permission in SaaS (06-skills.md)
- Build SaaS Authorization Test Matrices (authorization-test-matrix-saas/06-skills.md)
