# Decision Trees for Laravel Pennant Decision Matrix

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Laravel Pennant Decision Matrix |
| Related KUs | 01-calibrated-package-recommendation, 02-package-fit-non-fit-analysis, 04-package-escape-hatch-strategy |

---

## Decision Inventory

| ID | Decision | Priority |
|----|----------|----------|
| DT-PEN-001 | Pennant or dedicated feature flag service (LaunchDarkly, Flagsmith)? | P0 |
| DT-PEN-002 | Where should plan entitlements be defined? | P0 |
| DT-PEN-003 | How should emergency kill switches be implemented? | P0 |
| DT-PEN-004 | When should a feature flag be removed? | P1 |

---

## DT-PEN-001: Pennant or Dedicated Feature Flag Service (LaunchDarkly, Flagsmith)?

### Decision Context
Pennant is a first-party, database-backed feature flag package for single Laravel applications. Dedicated services (LaunchDarkly, Flagsmith) provide cross-service flags, instant toggling, experimentation, and complex targeting — at the cost of an external dependency and (for LaunchDarkly) a paid service.

### Decision Criteria
- Do flags need to work across multiple services (Laravel + Node.js + Go)?
- Is instant toggling required (flags must take effect within seconds, not minutes)?
- Is experimentation/analytics tracking a primary requirement?
- Does the team already pay for or use a dedicated flag service?
- Is budget for a paid service available?

### Decision Tree

```
Do flags need to work across multiple services?
├── YES → USE LAUNCHDARKLY or FLAGSMITH. Pennant is single-application only.
├── NO → Is instant toggling required (flags MUST take effect within seconds)?
    ├── YES → Is a paid service budgeted?
    │   ├── YES → USE LAUNCHDARKLY. Instant toggling + experimentation + cross-service.
    │   └── NO → USE PENNANT with short TTL (1-5 min) OR custom Redis flags.
    ├── NO → Is experimentation/analytics tracking a primary requirement?
        ├── YES → USE LAUNCHDARKLY. Pennant has no built-in experimentation.
        └── NO → USE PENNANT. For single-app, non-instant, non-experiment flags, Pennant is ideal.
            └── ALWAYS: define a FeatureFlagGateway interface so you can migrate later.
```

### Rationale
Pennant's single-application, database-backed design is its strength (simplicity, no external dependencies, version-controlled flag logic) and its limitation (no cross-service, cache-dependent toggling, no experimentation). For the majority of Laravel applications, Pennant's limitations don't matter — flags are single-app, toggling latency of 5-15 minutes is acceptable, and experimentation is not required. The gateway interface costs 20 minutes to set up and preserves the option to migrate to LaunchDarkly later.

### Recommended Default
**Default to Pennant for Laravel-only feature flags. Only reach for LaunchDarkly/Flagsmith when cross-service flags, instant toggling, or experimentation are explicit, documented requirements (not "we might need it someday").**

### Risks Of Wrong Choice
- **Pennant for cross-service**: Flags diverge between services. Node.js doesn't know about Pennant. Duplicated flag logic, inconsistent behavior.
- **LaunchDarkly for simple single-app flags**: External dependency, paid service cost, SDK complexity for flags that a 20-line feature class could handle.

### Related Rules
- Use Pennant for Feature Gating — Not as the Primary Entitlement Store

### Related Skills
- Package Wrapper/Boundary Pattern (KU 03)
- Package Escape Hatch Strategy (KU 04)

---

## DT-PEN-002: Where Should Plan Entitlements Be Defined?

### Decision Context
SaaS applications gate features by plan. The entitlement definitions — "enterprise plan includes advanced search, API access, white label" — can live in Pennant flags, a config file, or a database table. Where they live determines who can change them and how quickly.

### Decision Criteria
- Who needs to view and modify plan entitlements? (developers only, or sales/support too?)
- How frequently do plan entitlements change? (quarterly or weekly?)
- Do plan changes require code review and deployment? (should they?)
- Is there a single plan or multiple plans?

### Decision Tree

```
Does the application have multiple subscription plans with different feature sets?
├── NO (single plan or no plans) → Pennant flags alone are sufficient. No separate entitlement store needed.
├── YES → Who needs to modify plan entitlements?
    ├── DEVELOPERS ONLY → Define in CONFIG FILE (config/plans.php).
    │   └── Pennant reads config to resolve flags. Plan changes = PR + deploy.
    ├── SALES / SUPPORT / OPS → Define in DATABASE TABLE (plans table with JSON features column).
    │   └── Build an admin UI for plan management. Pennant reads DB to resolve flags.
    │   └── Plan changes take effect immediately (or after cache TTL).
    └── Do plan changes require code review for compliance/security?
        ├── YES → CONFIG FILE. Code review for plan changes.
        └── NO → DATABASE TABLE. Faster iteration without deployment.
```

### Rationale
Separating plan entitlements from Pennant flags is the cardinal rule: Pennant reads plan data, it doesn't define it. This separation means: (1) sales can answer "does pro plan include feature X?" by reading the config/database, not asking engineering, (2) plan changes don't require hunting through 20 feature class files, and (3) Pennant flags can be removed (post-100% rollout) without affecting plan definitions.

### Recommended Default
**Config file for developer-managed plans. Database table for admin-managed plans. Never Pennant alone for multi-plan SaaS.**

### Risks Of Wrong Choice
- **Pennant alone**: Plan changes require code deployments. Sales team cannot audit entitlements. Adding a feature to enterprise plan requires updating 5+ Pennant feature classes.
- **Database with no caching**: Every flag resolution queries the plans table. Performance degradation under load.

### Related Rules
- Use Pennant for Feature Gating — Not as the Primary Entitlement Store

### Related Skills
- Calibrated Package Recommendation Writing (KU 01)

---

## DT-PEN-003: How Should Emergency Kill Switches Be Implemented?

### Decision Context
A kill switch must immediately disable a broken feature to prevent user impact. Pennant's database-backed caching (TTL 5-15 minutes) means a Pennant-based kill switch has 5-15 minutes of latency. For genuine emergencies, this is too slow. Kill switches need an alternative mechanism.

### Decision Criteria
- Is the kill switch for a feature that could cause data corruption or financial loss if not disabled immediately?
- Does the kill switch need to work when the database is the problem (e.g., a bad migration)?
- Who needs to toggle the kill switch? (developers only, or ops/SRE?)
- Is the kill switch permanent (feature deprecated) or temporary (feature broken, will re-enable)?

### Decision Tree

```
Could delayed kill switch activation (5-15 min) cause data corruption or financial loss?
├── YES → USE ENVIRONMENT VARIABLE or REDIS. Instant toggle, no database dependency.
│   └── Env var: requires deployment but works when DB is down.
│   └── Redis: instant toggle via redis-cli or admin endpoint, works when DB is down.
│   └── BOTH: env var as ultimate fallback, Redis for instant toggle without deployment.
├── NO → Is it acceptable for the kill switch to take 5-15 minutes to propagate?
    ├── YES → USE PENNANT with a dedicated feature class. Accept cache TTL latency.
    │   └── Document that this is a "gradual kill switch," not an emergency one.
    └── NO → Could the database itself be the problem?
        ├── YES → USE ENVIRONMENT VARIABLE or REDIS. Pennant reads from DB — can't fix DB issues.
        └── NO → USE REDIS. Instant toggle via redis-cli, no deployment, no DB dependency.
```

### Rationale
Kill switches have a different SLA than feature flags. A feature flag for "new dashboard" can take 15 minutes to roll out — fine. A kill switch for "payment processing is double-charging" must take effect immediately — seconds, not minutes. The mechanism must also work when the database is the problem. Pennant satisfies neither requirement: it's cached in the database with a TTL, and it can't work when the database is down. Environment variables (no cache, no DB dependency) and Redis (no cache, external to DB) are the correct mechanisms for emergency kill switches.

### Recommended Default
**Use environment variables for permanent/emergency kill switches (no cache, no DB). Use Redis for operational kill switches that need instant toggle without deployment. Use Pennant only for gradual-rollout feature flags, not kill switches.**

### Risks Of Wrong Choice
- **Pennant kill switch**: Database-backed, cached for 15 minutes. The kill switch doesn't activate for 15 minutes. During that time, the broken feature continues causing damage.
- **Env var for frequent toggles**: Every toggle requires a deployment. For a kill switch toggled 5 times during debugging, that's 5 deployments.

### Related Rules
- Feature Flags Are Not Authorization

### Related Skills
- Package Escape Hatch Strategy (KU 04)

---

## DT-PEN-004: When Should a Feature Flag Be Removed?

### Decision Context
Feature flags are technical debt with an expiration date. When a flag's feature reaches 100% rollout and stabilizes, the flag should be removed. Flags that outlive their feature become dead code that bloats the flag registry and confuses developers.

### Decision Criteria
- Has the feature been at 100% rollout for 2+ months?
- Has the feature been stable (no critical bugs related to the flag) for that period?
- Is the flag referenced in more than just the feature class (Blade templates, middleware, tests)?
- What is the cost of removal (code changes, test updates)?

### Decision Tree

```
Has the feature been at 100% rollout for 2+ months?
├── NO → KEEP FLAG. The rollout is still in progress.
├── YES → Has the feature been stable (no P0/P1 bugs) for those 2+ months?
    ├── NO → KEEP FLAG. The kill switch capability is still valuable.
    ├── YES → Is the flag referenced in more than 5 locations?
        ├── YES → SCHEDULE REMOVAL for next cleanup sprint.
        │   └── Multiple references mean removal is non-trivial. Plan it.
        ├── NO → REMOVE NOW. The flag's REMOVE AFTER date has passed and it's stable.
            └── Steps: (1) inline the true condition, (2) remove the feature class, (3) update tests.
```

### Rationale
Every active feature flag carries a cost: (1) it adds resolution overhead on every request, (2) it creates an untested code path (flag-off, which may be dead but still exists), (3) it confuses developers who don't know which flags are active, and (4) it clutters the flag registry. The 2-month post-100% window ensures the feature is truly stable before the safety net is removed. After 2 months, the flag is dead weight.

### Recommended Default
**Remove flags 2-3 months after 100% rollout and stabilization. Run a quarterly flag cleanup sprint. Add a CI check that warns on flags with expired REMOVE AFTER dates.**

### Risks Of Wrong Choice
- **Removing too early**: The feature has a critical bug discovered after 100% rollout. The flag that could have disabled it is gone. Must deploy a revert.
- **Removing too late**: 50+ flags in the codebase, 35 are dead. Developers waste time understanding dead flags. Resolution overhead for unused flags.

### Related Rules
- Commit Feature Flag Cleanup with Every Flag

### Related Skills
- When NOT To Build Custom (KU 05)
