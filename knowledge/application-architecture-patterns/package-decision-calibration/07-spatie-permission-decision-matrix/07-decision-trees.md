# Decision Trees for Spatie Permission Decision Matrix

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Spatie Permission Decision Matrix |
| Related KUs | 01-calibrated-package-recommendation, 02-package-fit-non-fit-analysis, 04-package-escape-hatch-strategy |

---

## Decision Inventory

| ID | Decision | Priority |
|----|----------|----------|
| DT-SPT-001 | Spatie Permission or native Laravel Gates? | P0 |
| DT-SPT-002 | How should permissions be stored and managed? | P0 |
| DT-SPT-003 | How should the permission cache be configured? | P0 |
| DT-SPT-004 | Should team permissions be used? | P1 |

---

## DT-SPT-001: Spatie Permission or Native Laravel Gates?

### Decision Context
The team needs authorization. The choice between Spatie Permission (full RBAC with roles, permissions, caching, Blade directives) and native Laravel Gates (lightweight, code-based, no database dependency) depends on the complexity of the authorization model and the number of distinct roles.

### Decision Criteria
- How many distinct roles will exist? (1 = Gates; 3+ = Spatie)
- Are permissions managed by admins (not developers)?
- Is team/tenant-scoped authorization needed?
- Are wildcard permissions needed?
- Do Blade templates need role-based directives (`@role`, `@hasrole`)?

### Decision Tree

```
How many distinct roles will the application have?
├── 0-1 (just "admin" or no roles) → USE NATIVE GATES. Spatie adds 4 tables for no value.
├── 2 (e.g., "admin" and "editor") → Are these roles managed by admins via a UI?
│   ├── YES → Consider Spatie for the admin management features.
│   └── NO → USE NATIVE GATES. Two roles + a Gate is simpler than Spatie.
├── 3+ → Do any of the following apply?
    ├── Team/tenant-scoped permissions needed? → YES → USE SPATIE.
    ├── Wildcard permissions needed (`posts:*`)? → YES → USE SPATIE.
    ├── Admin UI for role/permission management needed? → YES → USE SPATIE.
    ├── Blade `@role` directives needed? → YES → USE SPATIE.
    └── None of the above → NATIVE GATES MAY SUFFICE.
        └── BUT: if roles may grow or permissions may become granular, Spatie's upfront cost is lower than a mid-project migration.
```

### Rationale
Spatie's value is proportional to the authorization model's complexity. For a single "admin" role, Spatie adds complexity (4 tables, caching, middleware, seeders) with zero benefit — `Gate::define('admin', fn ($user) => $user->is_admin)` is 1 line of code. For 3+ roles with granular permissions, wildcards, and team scoping, Spatie's features (caching, Blade directives, team permissions, wildcard matching) provide immediate value that would take weeks to rebuild with native Gates.

### Recommended Default
**Default to native Gates for single-role systems. Default to Spatie for 3+ roles with granular permissions. For 2-role systems: Spatie only if admin-managed roles or team scoping is needed.**

### Risks Of Wrong Choice
- **Spatie for single boolean**: Added complexity (4 tables, caching, middleware) for zero architectural value. Team spends time learning Spatie's API for `$user->hasRole('admin')` when `$user->is_admin` would suffice.
- **Gates for complex RBAC**: Team rebuilds role management, caching, wildcards, team scoping, and Blade directives from scratch — 3-4 weeks of work Spatie provides out of the box.

### Related Rules
- Do Not Use Spatie for Simple Boolean Admin Checks
- Use the `{resource}:{action}` Permission Naming Convention

### Related Skills
- Calibrated Package Recommendation Writing (KU 01)

---

## DT-SPT-002: How Should Permissions Be Stored and Managed?

### Decision Context
Permissions can be seeded (version-controlled, idempotent, reviewed in PRs) or created at runtime through an admin UI (flexible, but creates environment drift). The choice affects security auditability, deployment consistency, and the team's ability to reason about the permission set.

### Decision Criteria
- Are permissions part of the application's security boundary (authZ for features)?
- Do permissions change frequently (weekly) or rarely (quarterly)?
- Are compliance audits required (SOC2, HIPAA)?
- Is there a multi-tenant requirement where tenants define custom permissions?

### Decision Tree

```
Are permissions part of the application's security boundary?
├── YES (most applications) → SEED PERMISSIONS. Version-controlled, idempotent, reviewed in PRs.
│   └── Runtime permission creation is a security risk — un-reviewed permissions can grant unintended access.
├── NO (permissions are purely organizational, not enforcing security) → Are compliance audits required?
    ├── YES → SEED PERMISSIONS. Auditors require a canonical permission set.
    └── NO → Do tenants need to define custom permissions?
        ├── YES → HYBRID: seed base permissions, allow tenant-scoped custom permissions within a namespace.
        │   └── Custom permissions must be namespace-scoped (e.g., `tenant:{id}:report:{name}`).
        └── NO → SEED PERMISSIONS. Even without compliance, seeded permissions prevent environment drift.
```

### Rationale
Seeded permissions provide a canonical, version-controlled permission set. Every environment (dev, staging, production) has the same permissions. PRs review permission changes. Auditors can verify the permission set against the seed file. Runtime permission creation creates drift: staging has different permissions than production. A runtime-created permission could grant `admin:*` access with no code review. The only legitimate use case for runtime permission creation is tenant-scoped custom permissions in multi-tenant SaaS — and even those must be namespace-scoped.

### Recommended Default
**Seed all permissions. Never allow runtime permission creation through an admin UI or API.** The admin UI manages role-permission assignments, not permission definitions.

### Risks Of Wrong Choice
- **Runtime creation**: Staging and production diverge. A feature works in staging but fails in production because a required permission was created at runtime in staging and never seeded. Auditors cannot verify the permission set.
- **Seeded only (no admin UI for assignment)**: Role-permission assignments require code changes and deployments. Admin operations (granting a role a new permission) are developer-dependent.

### Related Rules
- Seed Permissions — Never Create Them at Runtime

### Related Skills
- Calibrated Package Recommendation Writing (KU 01)

---

## DT-SPT-003: How Should the Permission Cache Be Configured?

### Decision Context
Spatie caches resolved permissions per user. The cache configuration — TTL, invalidation strategy, and key granularity — determines how fast role changes take effect and how much database load the permission system generates. Getting this wrong creates either security vulnerabilities (stale permissions) or performance problems (cache stampedes).

### Decision Criteria
- How frequently do roles/permissions change? (hourly vs. monthly)
- What is the security sensitivity of permission changes? (demoted admin must lose access immediately)
- What is the expected request volume? (cache stampede risk on global flush)
- Are there long-lived processes (Octane, Horizon) that hold cached permissions?

### Decision Tree

```
How frequently do roles or permissions change in production?
├── Frequently (multiple times per day) → Short TTL (5-15 min) + immediate user-level invalidation.
│   └── Invalidate the specific user's cache on change: $user->forgetCachedPermissions().
├── Rarely (weekly or less) → Longer TTL (30-60 min) + immediate user-level invalidation.
│   └── Same: invalidate the specific user's cache on change.
├── Never (roles set at user creation, never modified) → Long TTL (1-2 hours) with global flush on deploy.
│   └── Cache stampede on deploy is acceptable because it's rare.

ALWAYS: When a user's role changes, call $user->forgetCachedPermissions() IMMEDIATELY.
NEVER: Rely solely on TTL to expire stale permissions for security-sensitive changes.
```

### Rationale
The security risk of stale permissions (demoted admin retains access for TTL duration) far outweighs the performance cost of targeted cache invalidation. The combination of a reasonable TTL (5-60 min depending on change frequency) + immediate targeted invalidation on change provides the best security/performance balance. Global cache flushes (`Cache::forget('spatie.permission.cache')`) are a blunt instrument — they invalidate ALL users' caches, causing a cache stampede on the next requests. Use them only when necessary (e.g., a new permission is added that affects all users).

### Recommended Default
**TTL: 15 minutes. Invalidation: immediate user-level on role/permission change. Global flush only on deploy or when a new permission is seeded.**

### Risks Of Wrong Choice
- **Long TTL + no targeted invalidation**: Demoted admin retains access for up to TTL duration. Security incident.
- **Short TTL + frequent global flushes**: Cache stampede on every permission change. Database hammered with permission queries. Performance degradation.

### Related Rules
- Invalidate Permission Cache on Role/Permission Changes

### Related Skills
- Package Escape Hatch Strategy (KU 04)

---

## DT-SPT-004: Should Team Permissions Be Used?

### Decision Context
Spatie supports team-scoped permissions via a `team_id` on the permission pivot. A user can be "admin" in Team A and "viewer" in Team B. This is powerful but introduces complexity: the team context must be set and reset correctly, and team permission queries add an extra join. This decision tree evaluates whether team permissions are worth the complexity.

### Decision Criteria
- Does the application have multiple teams/tenants with distinct authorization per team?
- Can a user belong to multiple teams simultaneously?
- Is a user's role truly different per team, or is it the same everywhere?
- Does the team use Octane or Horizon (long-lived processes that require context reset)?

### Decision Tree

```
Does the application have multiple teams/tenants?
├── NO → DO NOT USE TEAM PERMISSIONS. Global permissions are simpler and sufficient.
├── YES → Can a user belong to multiple teams simultaneously?
    ├── NO (user is in exactly one team) → DO NOT USE TEAM PERMISSIONS.
    │   └── Use a global role scoped to their single team. Team permissions add complexity for no benefit.
    ├── YES (user can be in Team A and Team B) → Is the user's role DIFFERENT in different teams?
        ├── NO (same role everywhere) → DO NOT USE TEAM PERMISSIONS. Global role assignment is simpler.
        ├── YES (admin in Team A, viewer in Team B) → USE TEAM PERMISSIONS.
            └── MANDATORY: implement context reset in ALL long-lived processes.
            └── MANDATORY: test context isolation with cross-team access attempts.
```

### Rationale
Team permissions solve a specific problem: a user who has different roles in different teams. If a user is always in one team or always has the same role, team permissions add complexity (context management, extra join, reset requirements) without benefit. The complexity is most dangerous in long-lived processes (Octane, Horizon workers) where the team context persists between requests unless explicitly reset. A forgotten `setPermissionsTeamId(null)` causes cross-tenant permission leakage.

### Recommended Default
**Only use team permissions when a user genuinely has DIFFERENT roles in DIFFERENT teams AND belongs to multiple teams simultaneously. For single-team or same-role-everywhere scenarios, use global permissions.**

### Risks Of Wrong Choice
- **Team permissions for single-team app**: Added complexity (context middleware, reset logic, test setup) for zero benefit.
- **Global permissions for multi-team app with different roles**: Cross-tenant permission leakage. Admin in Team A can access Team B resources because global permissions don't scope to teams.

### Related Rules
- Set Team Permission Context in Middleware — Reset It After Use

### Related Skills
- Package Escape Hatch Strategy (KU 04)
