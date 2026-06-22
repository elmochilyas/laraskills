# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Package Fit / Non-Fit Analysis |
| Difficulty | Intermediate |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Calibrated package recommendation, Package escape hatch strategy |
| Related KUs | Package wrapper/boundary pattern, When not to build custom |
| Source | domain-analysis.md |

---

# Overview

Package fit/non-fit analysis is a structured framework for deciding whether a third-party Laravel package belongs in a project. It evaluates seven dimensions: ecosystem alignment, assumption fit, escape hatch availability, team familiarity, long-term commitment risk, vendor lock-in risk, package maintenance health, and testing complexity. The output is not binary (use/don't use) but a risk-calibrated recommendation: strong fit, conditional fit, or high-risk fit. This framework prevents both "adopt everything" and "build everything" extremes.

---

# Core Concepts

- **Ecosystem alignment**: How well the package integrates with the existing stack. A package requiring PostgreSQL when the project uses MySQL has poor ecosystem alignment.
- **Assumption fit**: Whether the package's assumptions about your domain match reality. Cashier assumes Stripe; if you need multi-gateway support, that assumption is broken.
- **Escape hatch availability**: Can you bypass the package for unsupported flows without abandoning it? High availability = low risk.
- **Team familiarity**: Has the team used this package before? Lack of familiarity adds ramp-up time and increases misuse risk.
- **Long-term commitment risk**: How likely is the package to be maintained in 3 years? Single-maintainer packages carry higher risk than organization-backed ones.
- **Vendor lock-in risk**: How hard is it to migrate away from this package? Packages that deeply integrate into models, migrations, and controllers create higher lock-in.
- **Package maintenance health**: Release frequency, open issue count, PR merge rate, test suite status. Unmaintained packages are technical debt on day one.
- **Testing complexity**: How hard is it to test code that depends on this package? Packages requiring real API calls or complex mocking introduce testing friction.

---

# When To Use

- Evaluating a new package for adoption
- Re-evaluating an existing package during upgrade cycles
- Comparing multiple packages that solve the same problem
- Justifying "build custom" vs. "use package" decisions
- Technical due diligence for compliance-sensitive projects (SOC2, HIPAA)

## When NOT To Use

- Framework-native features (no package decision exists)
- Trivial utility packages with zero architectural impact
- Packages the team has already committed to and deeply integrated
- Time-critical situations where the analysis itself would block a fix

---

# Best Practices

1. **Score each dimension, don't rely on gut feeling** WHY: Engineering teams tend to overestimate ecosystem alignment and underestimate maintenance risk. Explicit scoring surfaces biases.

2. **Test the package's assumptions in a spike before adopting** WHY: Documentation may say "works with X" but only a spike reveals if it works with YOUR X. One day of spiking prevents months of fighting assumptions.

3. **Check package maintenance health beyond stars and downloads** WHY: A package with 10K stars but no commits in 2 years is abandonware. Check the commit graph, issue response time, and PR merge rate.

4. **Weight lock-in risk higher than other dimensions** WHY: Package features can be extended; lock-in cannot be undone without a rewrite. Treat high lock-in as a near-dealbreaker.

5. **Re-run analysis on major version upgrades** WHY: A package's assumptions, maintenance, and lock-in characteristics can change dramatically between v1 and v4.

---

# Architecture Guidelines

- **Document the analysis**: Store fit/non-fit analysis in the project's ADR directory or `docs/decisions/`. It serves as the "why" for future team members.
- **Three-tier recommendation**: Strong fit (6+ dimensions favorable), Conditional fit (3-5 favorable, documented conditions), High-risk fit (0-2 favorable, requires VP-level signoff).
- **Conditional fit requires written conditions**: "Use Cashier, provided we never need multi-gateway support and we accept Stripe lock-in." If the conditions change, the recommendation must be re-evaluated.

---

# Performance Considerations

- **Analysis cost**: A full fit/non-fit analysis with a spike takes 4-8 hours. This is a one-time cost per package decision.
- **Decision debt**: Skipping analysis to save time creates decision debt. The cost of removing a deeply integrated package months later is 10-100x the analysis cost.

---

# Security Considerations

- **Maintenance health is a security signal**: Unmaintained packages don't receive security patches. A package with no commits in 12 months should be treated as a security risk.
- **Dependency chain audit**: A package's security posture includes its own dependencies. Use `composer audit` to check known vulnerabilities in the package's dependency tree.
- **Credential handling**: Evaluate how the package handles API keys and secrets. Packages that require `.env` values are normal; packages that require hardcoded keys are a red flag.

---

# Common Mistakes

**Mistake: Evaluating only GitHub stars**
- Description: Choosing packages based on star count alone
- Cause: Stars are the most visible metric
- Consequence: Adopting popular but unmaintained packages. Popularity != maintenance.
- Better: Check recent commits, release cadence, issue response time, and test suite status

**Mistake: Ignoring assumption mismatch because "we can override it"**
- Description: Adopting a package whose core assumptions don't match, planning to override behavior
- Cause: Overconfidence in the framework's extensibility
- Consequence: Ending up overriding 30%+ of the package's methods, essentially maintaining a fork
- Better: If you need to override >20% of a package's behavior, the package doesn't fit. Build custom or find a better fit.

**Mistake: Not factoring in team ramp-up time**
- Description: Assuming the team will learn the package instantly
- Cause: Underestimating package complexity
- Consequence: First feature using the package takes 3x longer than estimated. Bugs from misunderstanding package behavior.
- Better: Budget 1-2 days of spike time per package. If a spike reveals steep learning curve, factor it into the fit analysis.

---

# Anti-Patterns

- **Download-count fetishism**: Choosing packages by total downloads. A package with 1M downloads but no recent commits is abandonware at scale.
- **Zero-sum package thinking**: "If we use this package, we can never use another approach." Hybrid approaches (package for common path, escape hatch for edge cases) are valid.
- **Analysis paralysis**: Spending more time analyzing packages than building the feature. For non-architectural decisions, use a lightweight version of this framework (3 dimensions, not 7).

---

# Fit/Non-Fit Analysis Template

```markdown
## Package: [name]

### 1. Ecosystem Alignment (Score: /10)
- Stack match: [PHP version, Laravel version, database requirements]
- Conflicting packages: [any installed packages that conflict]
- Infrastructure requirements: [Redis, Horizon, SQS, etc.]

### 2. Assumption Fit (Score: /10)
- Package assumes: [list core assumptions]
- Our reality: [list actual requirements]
- Mismatches: [list assumptions that don't match]

### 3. Escape Hatch Availability (Score: /10)
- Can bypass for unsupported flows: [yes/no/partial]
- Escape path: [describe concrete migration path]
- Lock-in severity: [low: swap interface | medium: migrate data | high: full rewrite]

### 4. Team Familiarity (Score: /10)
- Team members with prior experience: [count]
- Documentation quality: [excellent/good/poor]
- Community support: [active Slack/Discord, StackOverflow presence]

### 5. Long-Term Commitment Risk (Score: /10)
- Maintainer: [individual/org/company]
- Last release: [date]
- Release frequency: [weekly/monthly/quarterly/sporadic]
- Bus factor: [number of active maintainers]

### 6. Package Maintenance Health (Score: /10)
- Open issues: [count] (stale: [count])
- PR merge rate: [high/medium/low]
- Test suite: [exists + passing / exists + failing / absent]
- PHP 8.3+ support: [yes/no]
- Laravel 13 support: [yes/no/unknown]

### 7. Testing Complexity (Score: /10)
- Built-in fakes: [yes/no]
- Requires real API calls: [yes/no]
- Mocking difficulty: [easy/moderate/hard]
- Test speed impact: [none/minor/significant]

### Recommendation
- Total score: [sum]/70
- Recommendation: [Strong fit (50+) | Conditional fit (30-49) | High-risk fit (<30)]
- Conditions (if conditional):
  - [condition 1]
  - [condition 2]
```

---

# AI Agent Notes

- When evaluating a package for a project, run through all seven dimensions before making a recommendation. Output the template above.
- For maintenance health, check GitHub's Insights > Pulse tab (recent activity) and the issue tracker for stale issues.
- Lock-in risk is the most underweighted dimension. Err on the side of flagging lock-in even when it seems manageable.
- For team familiarity, be honest: "the team has never used this" is valid input. Don't assume AI can substitute for team experience.
- If a package fails 3+ dimensions, strongly recommend against adoption regardless of other scores.

---

# Verification

- [ ] All seven dimensions scored (not left blank)
- [ ] Assumption mismatches are explicitly listed
- [ ] Maintenance health includes last release date (not just "well maintained")
- [ ] Escape hatch path is concrete (not "find another package")
- [ ] Testing complexity names specific strategies (fakes, mocks, real API)
- [ ] Recommendation tier matches the actual score (not inflated)
- [ ] Conditional fit includes written conditions that can be re-checked later
- [ ] Analysis stored in project documentation (not just in chat history)
