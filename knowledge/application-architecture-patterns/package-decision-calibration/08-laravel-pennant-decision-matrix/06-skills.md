# Skill: Laravel Pennant Feature Flag Implementation

## Purpose
Deploy Laravel Pennant for application-level feature flags with class-based resolution, plan entitlement integration, gradual rollouts, and proper separation from authorization — while avoiding flag bloat, cache-confused kill switches, and the "Pennant as sole entitlement store" trap.

## When To Use
- Feature flags in a single Laravel application (not cross-service)
- Gradual rollouts (10% → 50% → 100% of users)
- A/B testing with simple on/off or value-based flags
- SaaS plan feature gating (pro plan users get feature X — Pennant reads plan config)
- Environment-specific flags (staging enabled, production disabled)
- When flag resolution logic should be versioned in the codebase (class-based features)

## When NOT To Use
- Flags must work across multiple services (Laravel + Node.js + Go) — use LaunchDarkly or Flagsmith
- LaunchDarkly, Flagsmith, or another dedicated flag service is already in use
- Non-Laravel applications need to consume the same flags
- Kill switches that must work when the application database is down — use env vars or Redis
- Flags need to be toggled instantly without cache delay or deployment
- Complex targeting rules (geolocation, device type, behavior history) beyond simple user attributes
- Flag analytics and experimentation tracking are primary requirements

## Prerequisites
- Laravel 13+ with PHP 8.3+
- Understanding of the difference between feature flags and authorization (Gates/Policies)
- SaaS plan configuration defined separately (database or config file) — Pennant reads it, doesn't define it
- Familiarity with the Calibrated Package Recommendation framework (KU 01)

## Inputs
- List of features to be flagged with rollout strategy for each
- SaaS plan entitlement configuration (if applicable)
- Feature flag cleanup schedule (quarterly review dates)
- Kill switch escalation path (non-database fallback mechanism)

## Workflow
1. **Define plans separately from Pennant** — Before any flags: define SaaS plan entitlements in a config file (`config/plans.php`) or database. Pennant features read plan data to determine flag state; plan data is the source of truth.
2. **Create feature classes in `app/Features/`** — One class per feature. Never define flags as closures in `AppServiceProvider`. Feature classes are self-contained, testable, and discoverable via IDE.
3. **Implement resolution logic** — Each feature class's `resolve(User $user)` method returns the flag value. Structure as: admin override → plan check → gradual rollout → default. Each condition is independently testable.
4. **Add removal date comments** — Every feature class gets a docblock with the rollout timeline and a `REMOVE AFTER` date. This prevents stale flag accumulation.
5. **Separate authZ from feature flags** — Always add Gates/Policies alongside Pennant middleware. Feature flag controls visibility; authorization controls access. `->middleware(['auth', 'can:view-reports', 'feature:advanced-reports'])`.
6. **Configure kill switches outside Pennant** — For emergency toggles that must bypass caching and database, use environment variables or Redis keys. Pennant's database-backed cache adds latency to kill switch toggling.
7. **Test both flag states** — Every test that depends on a feature flag must test BOTH states (flag on AND flag off). Flag-off tests are the most commonly missed.

## Validation Checklist
- [ ] Pennant is used for feature gating, not as the primary entitlement store
- [ ] Plan entitlements are defined separately from Pennant flags (config or database)
- [ ] Feature flags use feature classes in `app/Features/`, not closures in service providers
- [ ] Every flag has a removal plan or expiration comment (`REMOVE AFTER: YYYY-MM-DD`)
- [ ] Kill switches have a non-database fallback mechanism (env vars or Redis)
- [ ] Pennant is not used for cross-service feature flags
- [ ] Pennant is not used as a substitute for authorization (Gates/Policies are also present)
- [ ] Tests cover both flag-on and flag-off states for every flag
- [ ] Flag cleanup process is established (quarterly review)
- [ ] Cache TTL is configured (5-15 minutes) with a manual flush mechanism

## Common Failures
- Defining plan entitlements entirely in Pennant flags — changing plans requires code changes
- Creating 50+ flags with no cleanup process — half are dead, nobody knows which are active
- Using `Feature::active()` without explicit scope — fails in queued jobs and commands with no auth user
- Using Pennant middleware as the sole access control — feature flag + no auth = security vulnerability
- Using Pennant for emergency kill switches with 15-minute cache TTL — toggle doesn't take effect
- Defining flags as closures in `AppServiceProvider` — unreadable, untestable at scale
- Expecting Pennant flags to work in a Node.js or Go service — they don't

## Decision Points
- **Pennant vs. LaunchDarkly**: Pennant for single-app flags, LaunchDarkly for cross-service, instant toggle, experimentation
- **Feature class vs. closure**: Feature class for permanent/semi-permanent flags, closure for <2-week temporary flags
- **Cache TTL**: 5-15 minutes balances performance with toggle responsiveness
- **Kill switch mechanism**: Environment variables or Redis for instant toggle, Pennant for gradual rollouts

## Performance Considerations
- Pennant stores resolved flags in the `features` table — each uncached resolution hits the database
- For high-traffic apps, preload flags in middleware and pass to views via `View::share()`
- 50+ resolved flags per request will degrade performance — group related flags or resolve lazily
- `Feature::active()` without explicit scope uses `auth()->user()` — fails in queue and CLI contexts

## Security Considerations
- Feature flags ARE NOT authorization — always pair with Gates/Policies on protected routes
- Flag values are cached in the database — do not put sensitive data in flag values
- Kill switches must work independently of the database — use env vars or Redis as fallback
- The `features` table can accumulate cached flag values with PII-adjacent data — monitor access

## Related Rules (from 05-rules.md)
- Use Pennant for Feature Gating — Not as the Primary Entitlement Store
- Use Feature Classes, Not Closures in Service Providers
- Commit Feature Flag Cleanup with Every Flag
- Feature Flags Are Not Authorization

## Related Skills
- Package Escape Hatch Strategy (KU 04)
- Calibrated Package Recommendation Writing (KU 01)
- Package Wrapper/Boundary Pattern (KU 03)

## Success Criteria
- SaaS plan changes (adding/removing a feature from a plan) require zero code changes — only config/DB updates. Every flag has a removal date that is checked quarterly. Kill switches bypass cache. Routes use both `can:` and `feature:` middleware. All flags have flag-on and flag-off tests.
