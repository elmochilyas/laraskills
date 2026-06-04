# Skill: Generate Service Binding Inventory and Risk Matrix

## Purpose
Create an automated inventory of all service container bindings, classify each by type and state safety, produce a risk matrix, and establish CI governance to prevent regressions.

## When To Use
- Pre-Octane deployment — mandatory audit
- Post-audit maintenance — run delta audits in CI on every PR
- Third-party package evaluation
- New project initialization

## When NOT To Use
- PHP-FPM only projects (no persistent process)
- Transient binding analysis (bind() — inherently safe)
- Single-service applications with trivial bindings

## Prerequisites
- Access to Laravel application code
- Ability to create artisan commands
- CI pipeline configuration access
- Understanding of singleton vs scoped vs transient binding semantics

## Inputs
- All service provider files (application and vendor)
- Application bootstrap process
- CI configuration file

## Workflow
1. Create an artisan command (`php artisan audit:bindings`) that hooks into the container's `$bindings` and `$instances` arrays — dump every binding with its abstract, concrete, type (singleton/scoped/bind/instance), and shared status
2. Run the command and store the output as the baseline inventory — include vendor-provided bindings from packages
3. For each shared binding (singleton/scoped/instance), manually inspect the service class for mutable per-request state — check constructor-injected dependencies recursively (dependency graph trace)
4. Classify each binding into: Safe Singleton (stateless/immutable), Unsafe Singleton (mutable per-request state), Safe Transient (new instance per resolve), Needs Review (unclear from static analysis)
5. Score unsafe bindings by risk: CRITICAL (auth, tenant, session — data leak risk), HIGH (payment, config — financial/config drift), MEDIUM (caching layers), LOW (logging, formatting)
6. Create remediation plan prioritized by risk score — fix CRITICAL first regardless of difficulty
7. Add CI lint step scanning PR diffs for new `singleton()` registrations — flag every new singleton for human review with required classification comment

## Validation Checklist
- [ ] Binding inventory command dumps all registered bindings with type, concrete, and shared status
- [ ] Vendor-provided bindings included in inventory (not just application code)
- [ ] For each singleton, constructor dependency graph traced to 2+ levels
- [ ] Each shared binding classified into risk category with documented rationale
- [ ] CRITICAL bindings (auth, tenant, session) identified as highest remediation priority
- [ ] CI lint step scans PR diffs for `singleton()` calls and blocks merge without review
- [ ] Re-audit scheduled quarterly or on major package updates

## Common Failures
- Manual enumeration only — misses vendor-provided bindings from packages
- Only auditing direct bindings without tracing dependency graph — transitive leaks missed
- Assuming safe = "doesn't store user data" — any mutable data (timestamps, counters) causes behavioral differences
- Not re-auditing after package updates — new singleton bindings introduced in minor/patch versions
- Over-correction: converting every singleton to scoped — breaks lazy-loaded singletons that need persistence

## Decision Points
- Binding inventory granularity: include transient bindings (noise) vs only shared bindings (focus)
- Dependency graph depth: trace 2 levels vs full transitive closure
- Risk scoring methodology: by data sensitivity (auth > config > logging) vs by fix difficulty
- CI enforcement: block all new singletons vs flag for review vs allow with classification

## Performance Considerations
- Audit has zero runtime cost — design-time activity
- Remediation (singleton-to-scoped) adds ~0.5-2ms per binding per request — prioritize high-risk only
- Binding inventory command may resolve some services — run in isolated environment to avoid side effects
- Dependency graph caching speeds up delta audits after initial baseline

## Security Considerations
- False negative: binding that seems safe (no direct mutable state) has a dependency that stores per-request data in a static property — dependency analysis misses it because static is set externally
- Audit drift: 200 commits later, initial audit is outdated — new unsafe bindings exist with no re-audit
- Over-correction: converting every singleton to scoped breaks lazy-loaded singletons needing persistence (connection pools) — introduces new bugs

## Related Rules
- Generate an automated binding inventory before every audit (05-rules.md)
- Trace the full dependency graph, not just direct bindings (05-rules.md)
- Classify bindings into three risk categories (05-rules.md)
- Add CI lint rules for new singleton registrations (05-rules.md)
- Score and prioritize remediation by risk impact (05-rules.md)
- Re-audit after every major package update or quarterly (05-rules.md)

## Related Skills
- Audit Service Providers for Octane Singleton Safety (octane-architecture-overview)
- Identify Singleton State Leaks (singleton-state-leaks)
- Evaluate and Remediate Package Octane Compatibility (octane-package-compatibility)
- Convert Singletons to Scoped Bindings (scoped-bindings-for-octane)

## Success Criteria
- Binding inventory command produces complete list of all shared bindings including vendor packages
- Each shared binding has documented risk classification with dependency graph trace
- CRITICAL bindings are remediated (converted to scoped or redesigned) before Octane deployment
- CI pipeline blocks PRs introducing new `singleton()` registrations without human review
- Re-audit schedule is established (quarterly or on major package updates)
- Risk matrix is version-controlled and updated as part of the development workflow
