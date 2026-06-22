# Skill: Calibrated Package Recommendation Writing

## Purpose
Produce complete, risk-calibrated architectural package recommendations covering all eight dimensions (default, fit, non-fit, alternative, escape hatch, tradeoffs, testing, operations) so teams make informed package adoption decisions instead of cargo-cult selections.

## When To Use
- You need to recommend a third-party Laravel package for an architectural concern (billing, auth, search, queues)
- A team member proposes adopting a new package and needs an ADR-caliber evaluation
- You are scaffolding a greenfield project and selecting the standard technology stack
- An existing package is being re-evaluated for upgrade or replacement
- A compliance audit (SOC2, HIPAA) requires documented justification for package choices

## When NOT To Use
- Trivially small decisions (single utility class, formatting helper, markdown parser)
- Framework-native features where no package decision exists (Eloquent, Blade, routing)
- Emergency hotfixes — document the decision post-remediation instead
- Teams already deeply experienced with the package where re-evaluation is unnecessary

## Prerequisites
- Understanding of the `Package Fit/Non-Fit Analysis` framework (KU 02)
- Familiarity with the `Package Wrapper/Boundary Pattern` (KU 03)
- Familiarity with the `Package Escape Hatch Strategy` (KU 04)
- Access to the target package's GitHub repository for maintenance health assessment
- Knowledge of the project's concrete technical requirements (not just high-level goals)

## Inputs
- The package under evaluation (name, version, repository URL)
- The specific business requirement the package addresses
- The project's technology stack (PHP version, Laravel version, database)
- Any existing conflicting packages or infrastructure constraints
- The team's familiarity with the package or its underlying technology

## Workflow
1. **Research the package's maintenance health** — Check GitHub: last release date, release frequency, open vs. stale issues, PR merge rate, CI status. A package with no commits in 6+ months is abandonware regardless of star count.
2. **Identify the package's core assumptions** — What does the package assume about your stack, your business model, your architecture? Cashier assumes Stripe. Spatie Permission assumes database-driven RBAC. List every assumption.
3. **Map fit conditions** — Translate each package assumption into a falsifiable fit condition. "If Stripe is the sole payment provider, this fits. If multi-provider is needed, it doesn't." Every fit condition must be objectively checkable.
4. **Identify a concrete alternative** — Name a specific, realistic alternative. Not "build custom" (vague). State: `stripe/stripe-php` directly, Paddle, or native Laravel Gates. The alternative must be tested enough to know it's viable.
5. **Design the escape hatch** — Describe how to bypass the package for flows it cannot handle. The escape hatch must be a code-level path (e.g., "call stripe/stripe-php directly inside the BillingGateway adapter"), not a hand-wave.
6. **List accepted tradeoffs explicitly** — Every package has tradeoffs. Name them: vendor lock-in, schema coupling, testing complexity, operational overhead. If you cannot name tradeoffs, your analysis is incomplete.
7. **Assess testing impact** — Does the package require real API keys in tests? Does it provide fakes? Are time-sensitive tests possible (Stripe test clocks)? Will CI need special configuration?
8. **Assess operational impact** — What new failure modes does the package introduce? New queues? New webhooks needing monitoring? New cache invalidation requirements? New credentials to rotate?

## Validation Checklist
- [ ] All eight dimensions present: default recommendation, fit conditions, non-fit conditions, alternative, escape hatch, tradeoffs, testing impact, operational impact
- [ ] Fit criteria are falsifiable (can be objectively checked true/false)
- [ ] Non-fit criteria reference concrete technical requirements, not preferences
- [ ] Alternative is a named, realistic option (not just "build custom")
- [ ] Escape hatch describes a concrete code-level migration path
- [ ] Tradeoffs are explicit — "none" means analysis is incomplete
- [ ] Testing impact names specific fakes, keys, or strategies required
- [ ] Operational impact covers new failure modes introduced by the package
- [ ] Recommendation includes a review date or re-evaluation trigger
- [ ] At least one team member who didn't research the package has reviewed the recommendation

## Common Failures
- Producing only a package name and description, omitting all dimensions
- Fit criteria that are subjective ("good DX") instead of falsifiable ("PHP 8.3+ supported")
- Escape hatches that are hand-wavy ("we'll figure it out later")
- Tradeoffs listed as "none" or "minimal" — every architectural package has real tradeoffs
- Ignoring testing impact until the test suite breaks on CI
- Recommending packages based on GitHub stars and blog posts without checking maintenance health

## Decision Points
- **Is this package architectural or trivial?** — Only architectural packages need the full 8-dimension analysis
- **Does the alternative require a different infrastructure?** — If the alternative requires PostgreSQL and the team uses MySQL, flag this
- **Is the escape hatch symmetrical?** — Can flows move both into and out of the escape hatch, or is it one-way?
- **Is the tradeoff acceptable for the project's expected lifetime?** — Stripe lock-in for a 3-month MVP is different from Stripe lock-in for a 5-year enterprise product

## Performance Considerations
- Writing a full 8-dimension analysis takes 30-90 minutes — a one-time cost amortized over the package's lifetime
- For minor packages, use an abbreviated 3-4 dimension analysis to avoid analysis paralysis
- The primary performance cost is decision latency; the primary performance benefit is avoiding a bad package that would create ongoing performance issues

## Security Considerations
- The operational impact dimension must include security implications — new packages add attack surface
- The maintenance health check is a security check: unmaintained packages don't receive security patches
- The testing impact must note if the package requires API keys in CI or test environments
- The tradeoff dimension should note if the package has a single maintainer (bus factor risk)

## Related Rules (from 05-rules.md)
- Write All Eight Dimensions Before Recommending
- Make Fit/Non-Fit Criteria Falsifiable
- Always Name the Escape Hatch
- Re-Evaluate Fit Annually
- Document Accepted Tradeoffs Explicitly

## Related Skills
- Package Fit/Non-Fit Analysis (KU 02)
- Package Wrapper/Boundary Pattern (KU 03)
- Package Escape Hatch Strategy (KU 04)
- When NOT To Build Custom (KU 05)

## Success Criteria
- The team can read the recommendation and understand exactly what they're committing to, what they're trading away, and how they would exit if needed — without asking follow-up questions about missing dimensions.
