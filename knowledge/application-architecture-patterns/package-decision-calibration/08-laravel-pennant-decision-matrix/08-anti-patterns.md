# Anti-Patterns for Laravel Pennant Decision Matrix

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Laravel Pennant Decision Matrix |
| Anti-Pattern Count | 4 |

---

## Anti-Pattern Inventory

| ID | Anti-Pattern | Severity | Frequency |
|----|-------------|----------|-----------|
| AP-PEN-001 | Pennant as Authorization | Critical | High |
| AP-PEN-002 | Flag-Driven Architecture | High | Medium |
| AP-PEN-003 | Database as Kill Switch | Critical | Medium |
| AP-PEN-004 | Feature Flags for Configuration | Medium | High |

---

## Repository-Wide Anti-Patterns

The following anti-patterns from related KUs are also relevant here:
- AP-SPT-003 (Spatie for Everything) — from KU 07 (same conflation problem, different package)
- AP-ESC-001 (The Bottomless Escape Hatch) — from KU 04
- AP-CPR-003 (Recommendation Without Expiration) — from KU 01 (same staleness problem, different domain)

---

## AP-PEN-001: Pennant as Authorization

### Category
Security

### Description
Using Pennant feature flags as the sole mechanism for controlling access to protected functionality. Routes are gated with `->middleware('feature:admin-reports')` without any accompanying authorization check. A misconfigured or accidentally enabled flag grants access to features that should require authentication and authorization.

### Why It Happens
- Feature flags feel like access control: "if the flag is off, they can't access it"
- Pennant middleware is syntactically similar to auth middleware: `->middleware('feature:x')` looks like `->middleware('can:x')`
- Development convenience: "I'll add the Gate later" (never added)
- Misunderstanding that feature flags control visibility, not security

### Warning Signs
- `->middleware('feature:...')` appears on routes without `->middleware('can:...')` or `->middleware('auth')`
- Blade templates use `@feature('admin-panel')` to hide admin links without any `@can` check
- A feature flag name contains the word "can" or "admin" — blurring authorization and gating
- The team says "the flag controls who can access it" — confusing gating with authorization

### Why Harmful
Feature flags are for gradual rollouts and A/B testing — they are not security boundaries. When a feature flag is misconfigured (e.g., set to 100% instead of 10%), accidentally enabled (wrong environment), or bypassed (URL manipulation), there is no authorization check to prevent unauthorized access. A flag toggle can grant admin access to regular users. Feature flags should control what users SEE; authorization controls what users can DO. Confusing the two creates a path where flag misconfiguration becomes a security incident.

### Real-World Consequences
- An admin reports dashboard is gated with `Route::middleware('feature:admin-reports')`. A developer accidentally sets the flag to 100% rollout in production (target was staging). For 2 hours, every user can access admin reports containing revenue data and customer PII. Because there's no `can:view-admin-reports` Gate, the flag was the sole access control. The incident is a data breach.

### Preferred Alternative
Every protected route must have BOTH an authorization check AND a feature flag: `->middleware(['auth', 'can:view-reports', 'feature:advanced-reports'])`. The authorization check enforces security; the feature flag controls rollout. If the flag is misconfigured, the authorization check still prevents unauthorized access. If the authorization check is too permissive, the flag still prevents the feature from being visible. Neither is sufficient alone.

### Refactoring Strategy
1. Audit all routes using `feature:` middleware. For each, verify that `auth` and `can:` middleware are also present.
2. For any route missing authorization, add the appropriate Gate/Policy check immediately.
3. Audit Blade templates using `@feature`. Ensure `@can` checks wrap any security-sensitive content.
4. Add an architecture test: `->expect('routes')->not->toUse('feature:')` without accompanying `can:` or `auth`.

### Detection Checklist
- [ ] `->middleware('feature:...')` appears without `->middleware('can:...')` on the same route
- [ ] Feature flag names contain "admin," "can," "allow," or "permission"
- [ ] The team cannot articulate the difference between feature gating and authorization
- [ ] No architecture test enforces the dual-middleware requirement

### Related Rules
- Feature Flags Are Not Authorization

### Related Skills
- Spatie Permission Decision Matrix (KU 07)

---

## AP-PEN-002: Flag-Driven Architecture

### Category
Architecture | Complexity

### Description
Every new feature is placed behind a flag — not for gradual rollout, but as a permanent architectural pattern. Code paths are wrapped in `if (Feature::active('x'))` everywhere. The codebase becomes a combinatorial explosion of flag-dependent states that cannot all be tested.

### Why It Happens
- "Flags are free" — misunderstanding that every flag doubles the number of code paths to test
- Cargo-culting: a successful gradual rollout of one feature leads to flags for all features
- Fear of deployment: flags are used as a safety blanket for every change
- No flag cleanup process — flags accumulate because nobody removes them

### Warning Signs
- 30+ active flags in the codebase
- Nested feature flag checks: `if (Feature::active('a')) { if (Feature::active('b')) { ... } }`
- Tests only cover flag-on states; flag-off states are untested
- "Which combination of flags enables this behavior?" is a question the team cannot easily answer
- New developers take weeks to understand which flags are active and which are dead

### Why Harmful
Each flag doubles the number of code paths. Two flags = 4 paths. Ten flags = 1,024 paths. The test suite cannot cover all combinations. The flag-off code paths are the most commonly untested — and the most likely to contain bugs. When a flag is finally removed, the "flag off" code path (which may have been dead for months) becomes the live path — and it may have bugs that were never caught because the path was never tested.

### Real-World Consequences
- A team flags every new feature "just in case." After 18 months, there are 45 flags. 20 are permanently on (100% rollout, never cleaned up). 15 are permanently off (failed experiments, never cleaned up). 10 are actively managed. The 35 dead flags still have resolution overhead on every request. A new developer spends 3 days tracing code to understand which flags matter. The test suite only covers flag-on states for 10 active flags — the other 35 are untested in either state.

### Preferred Alternative
Flags are temporary by design. Every flag is created with a removal date. Flags for gradual rollouts are removed 2 months after 100% rollout. Flags for experiments are removed after the experiment concludes (winning variant becomes permanent, flag removed). The codebase should have fewer than 10 active flags at any time. If a "flag" is permanent, it's not a flag — it's configuration or a plan entitlement.

### Refactoring Strategy
1. Audit all flags. Categorize as: active (in rollout), dead (100% or 0% and stable), or permanent (should be config/entitlement).
2. Remove dead flags immediately. Inline the flag's constant value.
3. Migrate permanent flags to configuration or plan entitlements.
4. Set a flag ceiling: no more than 10 active flags without architecture review.
5. Add CI check: flags with REMOVE AFTER dates more than 60 days in the past fail the build.

### Detection Checklist
- [ ] Active flag count exceeds 15
- [ ] Nested feature flag checks exist in the codebase
- [ ] Flag-off test coverage is less than 80%
- [ ] More than 20% of flags have no removal date
- [ ] "Which flags are active?" requires running code, not reading documentation

### Related Rules
- Commit Feature Flag Cleanup with Every Flag

### Related Skills
- When NOT To Build Custom (KU 05)

---

## AP-PEN-003: Database as Kill Switch

### Category
Reliability

### Description
Using a Pennant feature flag (stored in the database, cached with a TTL) as an emergency kill switch for production incidents. When the kill switch is toggled, it takes 5-15 minutes to propagate (cache TTL). When the database is the problem, the kill switch cannot be toggled at all.

### Why It Happens
- Pennant is already installed — "why add another mechanism for kill switches?"
- Underestimating kill switch latency requirements: "15 minutes is fast enough" (it's not for data corruption)
- Not considering the "database is down" scenario: "we'll fix the database, then toggle the flag"
- No separate kill switch infrastructure exists (Redis, env vars), so Pennant is used by default

### Warning Signs
- Pennant feature class serves as a kill switch for a critical feature
- Kill switch flag has the same cache TTL as rollout flags (15 minutes)
- No Redis key or environment variable backup for the kill switch
- The team cannot disable the feature if the database is unreachable

### Why Harmful
Kill switches have an SLA of seconds, not minutes. A payment processing bug that double-charges customers causes financial damage every second it's active. Waiting 15 minutes for a Pennant cache to expire while the bug processes thousands of transactions is unacceptable. If the database itself is the problem (e.g., a bad migration corrupting data), Pennant's database dependency means the kill switch is inoperable — you can't toggle a database flag when the database is down.

### Real-World Consequences
- A team uses a Pennant flag as the kill switch for a payment processing feature. A bug causes double-charging. The engineer toggles the flag in the Pennant cache table. The flag takes 12 minutes to propagate (cache TTL). During those 12 minutes, 500 customers are double-charged. The refund process takes 3 days of customer support work. A Redis-based kill switch would have taken effect within 100ms.

### Preferred Alternative
Kill switches use environment variables (`FEATURE_PAYMENT_PROCESSING_ENABLED=true`) or Redis keys (`feature:payment-processing:enabled`) that bypass caching entirely. Env vars require deployment but work when the database is down. Redis keys can be toggled instantly via `redis-cli` or an admin endpoint. Pennant is for gradual rollouts; Redis/env vars are for emergency toggles. Build a `FeatureFlagResolver` that checks Redis/env vars first (kill switches), then falls back to Pennant (rollout flags).

### Refactoring Strategy
1. Identify all Pennant flags that serve as kill switches.
2. For each, create a Redis key or environment variable equivalent.
3. Update the `FeatureFlagResolver` to check Redis/env var first, Pennant second.
4. Document the kill switch toggle procedure for the ops team.
5. Test the kill switch path: verify it takes effect within 1 second and works when the database is down.

### Detection Checklist
- [ ] Pennant flag names contain "kill," "disable," "emergency," or "circuit-breaker"
- [ ] No Redis or env var fallback exists for feature flags that could need emergency toggling
- [ ] The time to disable a broken feature equals the Pennant cache TTL
- [ ] The team cannot disable the feature if the database is unreachable

### Related Rules
- Feature Flags Are Not Authorization

### Related Skills
- Package Escape Hatch Strategy (KU 04)

---

## AP-PEN-004: Feature Flags for Configuration

### Category
Architecture | Separation of Concerns

### Description
Using Pennant feature flags for application configuration that has nothing to do with feature rollouts: `Feature::active('pagination-size-20')`, `Feature::active('dark-mode')`, `Feature::active('email-notifications')`. These are user preferences and system configuration, not feature flags. The flag registry becomes a dumping ground for every configurable value.

### Why It Happens
- Pennant's `Feature::for($user)->active('x')` API looks like a user-configuration system
- "Pennant can resolve per-user, so let's use it for all per-user settings"
- No separate user preferences system exists
- "If it's in Pennant, I can toggle it without a deployment" — using flags as a config hot-reload mechanism

### Warning Signs
- Pennant feature names that aren't feature names: `pagination-size`, `dark-mode`, `notification-preference`
- Feature classes that read user settings instead of checking rollout percentages or plan entitlements
- "Go to the Pennant table to change your preferences" — said to users or support
- The features table has entries that an auditor wouldn't recognize as feature flags

### Why Harmful
Configuration and feature flags have different lifecycles. Configuration is user-specific, changed frequently, and doesn't need gradual rollouts. Feature flags are temporary, developer-managed, and control rollout percentages. Using Pennant for configuration: (1) clutters the flag registry with non-flag data, (2) adds the cache TTL to configuration changes — user toggles dark mode but it doesn't take effect for 15 minutes, (3) requires database writes for simple configuration changes, and (4) prevents configuration from being exported or backed up separately from feature flags.

### Real-World Consequences
- A team uses Pennant for all "user-configurable" settings: 40+ "feature" flags that are actually user preferences. A user changes their notification preferences, but the change doesn't take effect for 15 minutes (Pennant cache TTL). The user changes it again, thinking the first change didn't work. Support tickets flood in about "settings not saving." Meanwhile, the flag registry has 60 entries — a developer trying to find actual feature flags must filter through 40 config entries.

### Preferred Alternative
Use `config()` for system configuration. Use a `user_settings` JSON column or a `settings` table for user preferences. Use a plan configuration for entitlement-based settings. Use Pennant ONLY for temporary feature rollouts, A/B tests, and gradual rollouts. If a "flag" is never going to be removed, it's not a flag — it's configuration.

### Refactoring Strategy
1. Audit all Pennant features. Flag any that aren't temporary feature rollouts.
2. Migrate user preferences to a dedicated preferences system (JSON column on users, or a separate table).
3. Migrate system configuration to config files or a settings table.
4. Remove the migrated entries from the Pennant features table.
5. Add a naming convention check: Pennant feature names must describe features being rolled out, not configuration values.

### Detection Checklist
- [ ] Pennant feature names describe preferences or configuration, not features
- [ ] Feature classes read user settings rather than checking rollout criteria
- [ ] "Change X in Pennant" is a support procedure
- [ ] The features table contains entries that are permanent (will never be removed)
- [ ] User-reported "settings not saving" bugs trace to Pennant cache TTL

### Related Rules
- Use Pennant for Feature Gating — Not as the Primary Entitlement Store

### Related Skills
- Calibrated Package Recommendation Writing (KU 01)
