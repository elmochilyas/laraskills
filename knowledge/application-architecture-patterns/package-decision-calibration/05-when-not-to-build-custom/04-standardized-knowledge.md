# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | When NOT To Build Custom |
| Difficulty | Intermediate |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Package fit/non-fit analysis, Make-vs-buy decision framework |
| Related KUs | Calibrated package recommendation, Package escape hatch strategy, Package wrapper/boundary pattern |
| Source | domain-analysis.md |

---

# Overview

"Build custom" is the most expensive long-term decision in software. A custom billing system costs 3-6 months of initial development and 5-10 hours/week of ongoing maintenance. Yet teams default to "build custom" because it feels safer than dependency risk. This KU provides a decision framework for recognizing when a package has stopped fitting (the exit signal) and a realistic accounting of what building custom actually costs. The goal is not to discourage custom solutions but to make the cost visible before the commitment is made.

---

# Core Concepts

- **Package liability signals**: Concrete indicators that a package is becoming a net negative. Overriding >30% of methods, fighting core assumptions, domain model mismatch, unmaintained status.
- **Custom build cost accounting**: Initial build, ongoing maintenance, security updates, onboarding documentation, edge case discovery over years.
- **Exit threshold**: The point at which package costs exceed custom build costs over the expected lifetime. Crossing this threshold is not automatic — it requires deliberate evaluation.
- **Hybrid ownership**: The option to fork a package and maintain it internally. Forking is a middle path between "use as-is" and "build custom."
- **Sunk cost trap**: Continuing to use a package because "we've already invested in it," even when the package is actively harmful.

---

# When To Use

- When a package shows 3+ liability signals (see below)
- During annual architecture review for all major package dependencies
- When estimating a new feature and "build custom" is on the table
- When a package's maintainer has announced deprecation or abandonware status

## When NOT To Use

- When the package works fine but the team "wants to own it" — ownership pride is not a valid reason to rebuild
- For packages handling commodity concerns (email, logging, caching) — these are solved problems
- When the team hasn't measured the actual cost of the current package — measure before deciding

---

# Best Practices

1. **Measure current package cost before comparing to custom build cost** WHY: Teams often overestimate how much time they spend fighting a package. Track actual hours spent on package workarounds, upgrades, and debugging for 2-4 weeks before deciding.

2. **Account for ALL costs of custom, not just initial build** WHY: Developers estimate the initial build well but ignore ongoing maintenance (bug fixes, security patches, new feature parity, onboarding docs). Over a 3-year lifespan, maintenance costs 2-3x the initial build.

3. **Evaluate fork-before-build** WHY: If a package is 80% right, forking it and maintaining the fork costs ~25% of a full custom build. Forking preserves the package's existing documentation, community knowledge, and test suite.

4. **Set an exit threshold BEFORE adopting a package** WHY: "If we ever need to override >30% of this package's methods, we'll migrate away." Having the threshold upfront prevents emotional attachment.

5. **Time the exit — don't migrate during feature development** WHY: Package migration during active feature work creates chaos. Schedule migrations as dedicated engineering investments between feature cycles.

---

# Architecture Guidelines

- **Exit trigger document**: For each major package, maintain a short document listing the exit triggers. Example for Cashier: "Exit if: (a) we need Stripe Connect, (b) we add a second payment provider, (c) Cashier goes 6 months without a release."
- **Migration timeline**: A package exit is a project, not a task. Budget: 2 weeks for a simple package, 2 months for a billing system. Include parallel run period where both old and new systems operate.
- **Data migration strategy**: The hardest part of exiting a package is migrating data. Packages that own migrations (Cashier, Spatie Permission) require careful migration of their schema. Packages that only wrap an API (Scout, HTTP clients) are easier to exit.

---

# Performance Considerations

- **Custom builds may be slower in the short term**: An optimized package (like Scout + Algolia) is faster than a quick custom search implementation. Custom builds need the same profiling and optimization that packages already received.
- **Package-related performance issues**: If the package causes N+1 queries, bloated serialization, or unnecessary eager loading, switching to custom may improve performance. Measure the package's query footprint before and after.

---

# Security Considerations

- **The biggest security cost of custom**: Custom code receives no community security scrutiny. Every security vulnerability is yours to find and fix. Packages with active communities get penetration testing and responsible disclosure for free.
- **Compliance implications**: Building custom auth, billing, or encryption is a compliance red flag for SOC2, PCI-DSS, and HIPAA auditors. Prefer established packages for compliance-sensitive domains.
- **Security patch latency**: With packages, you get security patches from the community. With custom, you must actively monitor for vulnerabilities in your own code. Budget 2-4 hours/month for security review.

---

# Common Mistakes

**Mistake: Underestimating ongoing maintenance**
- Description: Assuming custom code is "done" after initial build. It's never done.
- Cause: Optimism bias — "we'll write it right the first time"
- Consequence: Custom code accumulates bugs, security issues, and missing features that the package would have handled. Within 18 months, the custom solution is worse than the package it replaced.
- Better: Budget 20% of initial build time per year for ongoing maintenance. If a feature takes 3 months to build, budget 7 person-weeks/year to maintain it.

**Mistake: Rebuilding a package's entire surface area**
- Description: "We need our own billing system" — so the team rebuilds subscriptions, invoices, trials, proration, tax calculation, and receipts
- Cause: Not scoping the custom build to what the package actually fails at
- Consequence: A 6-month project that delivers a worse version of what Cashier already did
- Better: Identify the specific 2-3 features the package doesn't support. Build custom only for those features. Keep the package for everything else.

**Mistake: Exiting because of a few overrides**
- Description: Abandoning a package because you've overridden 3 methods
- Cause: Treating any override as a package failure signal
- Consequence: Rebuilding a system that was 95% working for a 5% gap
- Better: The 30% override threshold is a guideline. Three methods out of fifty (6%) is normal. Three methods out of ten (30%) is a warning.

---

# Anti-Patterns

- **Not-invented-here syndrome**: Rejecting packages because "we can build it better." In 90% of cases, you cannot — the package has more engineering hours, more users finding bugs, and more edge cases discovered than you will ever have.
- **Rewrite as default response**: When a package shows friction, defaulting to "replace it" rather than "fix the integration." An hour of adapter improvement often beats a month of rewrite.
- **Cost-free custom illusion**: Treating custom code as "free" because "we're already paying the developers." Developer time is the most expensive resource. If developers spend 10 hours/week maintaining custom billing, that's $25K+/year in opportunity cost.

---

# Package Liability Signals (Exit Triggers)

| Signal | Threshold | Severity |
|--------|-----------|----------|
| Method override percentage | >30% of package methods overridden | High |
| Assumption fights | Core package assumptions contradict business requirements | Critical |
| Domain model mismatch | Package's data model forces unnatural schema design | High |
| Maintenance status | No releases in 6+ months, no response to issues | Critical |
| Upgrade friction | Each package upgrade requires >4 hours of migration work | Medium |
| Testing pain | Package requires real API calls or complex test infrastructure | Medium |
| Team frustration | Developers actively avoid using the package or work around it | Medium |
| Escape hatch usage | >20% of flows use the escape hatch instead of the package | High |

---

# Custom Build Cost Accounting Template

```markdown
## Custom Build Cost Analysis: [Feature]

### Initial Build
- Core functionality: [weeks]
- Admin UI / management: [weeks]
- Integration with existing systems: [weeks]
- Testing (unit + integration + E2E): [weeks]
- Documentation (internal + onboarding): [weeks]
- **Total initial build**: [weeks]

### Ongoing Maintenance (per year)
- Bug fixes: [hours/month]
- Security patches: [hours/month]
- Feature parity with package alternatives: [hours/month]
- Onboarding new team members: [hours/month]
- Production incident response: [hours/month]
- **Total ongoing**: [hours/month] = [weeks/year]

### 3-Year Total Cost
- Initial: [weeks]
- Ongoing: [weeks/year × 3]
- **3-year total**: [weeks]

### Comparison: Package Cost Over 3 Years
- Integration time: [weeks]
- Upgrade time: [weeks/upgrade × N upgrades]
- Workaround time: [weeks spent fighting package]
- **3-year total**: [weeks]
```

---

# AI Agent Notes

- When a team asks "should we build this custom or use a package?", always run through the liability signals checklist first. If <3 signals are present, lean toward keeping the package.
- Generate the custom build cost template when "build custom" is on the table. Make the cost visible before recommending a path.
- Never recommend abandoning a package because of a single override or single missing feature. Point to the escape hatch pattern first.
- For compliance-sensitive domains (billing, auth, encryption), default to "use established package" unless there is a documented, insurmountable reason to build custom.
- When generating custom code that replaces a package, scope it to the specific methods the package fails at, not the entire package surface.

---

# Verification

- [ ] At least 3 liability signals present before recommending package exit
- [ ] Current package cost measured (hours spent on workarounds, upgrades, debugging)
- [ ] Custom build cost includes initial build + 3 years of maintenance
- [ ] Fork-and-maintain option evaluated before full custom build
- [ ] Scope of custom build is limited to features the package actually fails at
- [ ] Exit triggers exist for every major package BEFORE adoption
- [ ] Migration timeline includes parallel run period
- [ ] Security and compliance implications of custom build documented
