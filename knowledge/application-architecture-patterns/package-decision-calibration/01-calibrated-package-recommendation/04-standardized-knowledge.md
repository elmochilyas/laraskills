# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Calibrated Package Recommendation |
| Difficulty | Intermediate |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Package fit/non-fit analysis, Package wrapper/boundary pattern |
| Related KUs | Package escape hatch strategy, When not to build custom, Laravel Cashier decision matrix |
| Source | domain-analysis.md |

---

# Overview

The calibrated package recommendation pattern ensures every architectural package recommendation answers eight dimensions before being accepted. Instead of a binary "use X" recommendation, each proposal includes: default recommendation, fit conditions, non-fit conditions, an alternative, an escape hatch, accepted tradeoffs, testing impact, and operational impact. This prevents cargo-cult package selection and ensures the team understands exactly what they're committing to. A recommendation that only states "Use Laravel Cashier for billing" is incomplete — the missing seven dimensions represent unknown risks that will surface during implementation.

---

# Core Concepts

- **Default recommendation**: The primary package or approach recommended for the common case. This is the starting point, not the only answer.
- **Fit conditions**: Concrete, falsifiable criteria that must be true for the default recommendation to apply. If any fit condition is false, the recommendation weakens or flips.
- **Non-fit conditions**: Concrete criteria that, if present, make the default recommendation actively harmful. These are deal-breakers, not preferences.
- **Alternative**: What to use instead of the default. The alternative must be realistic and tested — not a placeholder like "build custom."
- **Escape hatch**: How to bypass the package for unsupported flows without abandoning it entirely. The escape hatch prevents the package from becoming a prison.
- **Tradeoff accepted**: The explicit cost of choosing this package. Every package has tradeoffs; naming them prevents later regret.
- **Testing impact**: How the package changes test strategy. Does it require fakes? Real API calls in tests? Environment variables?
- **Operational impact**: How the package changes production operations. New queues? New caches? New monitoring? New failure modes?

---

# When To Use

- Every architectural decision that involves adopting a third-party package
- Package recommendations in ADRs (Architecture Decision Records)
- Team onboarding documentation for standard stack choices
- Package upgrade/replacement evaluations
- Greenfield project scaffolding decisions

## When NOT To Use

- Trivially small decisions (single utility class, formatting helper)
- Framework-native features (Eloquent, Blade, routing — no package decision needed)
- Decisions where the team already has deep expertise with the chosen package
- Emergency patches or hotfixes (document the decision post-remediation)

---

# Best Practices

1. **Write all eight dimensions before recommending any package** WHY: Teams that see only the default recommendation make uninformed choices. The eight dimensions force deliberation and surface risks early.

2. **Make fit/non-fit criteria falsifiable** WHY: Vague criteria like "good developer experience" are unfalsifiable. Concrete criteria like "uses Stripe as sole payment provider" can be objectively true or false.

3. **Always name the escape hatch, even if it's "drop the package and use the underlying SDK"** WHY: Escape hatches prevent sunk-cost trapping. If the team can't articulate an escape path, the package is too tightly coupled.

4. **Document accepted tradeoffs explicitly** WHY: Tradeoffs that aren't named are forgotten. Six months later, the team complains about the tradeoff as if it were a surprise.

5. **Re-evaluate fit annually** WHY: Business requirements change. A package that fit perfectly at launch may be constraining at scale. Annual re-evaluation catches fit drift.

---

# Architecture Guidelines

- **ADR integration**: Each calibrated recommendation becomes a section in an Architecture Decision Record. The eight dimensions map directly to ADR sections.
- **Team review**: Calibrated recommendations must be reviewed by at least one engineer who did not research the package, to catch implicit assumptions.
- **Living document**: Recommendations are not one-time. Update them when package versions change, when business requirements shift, or when escape hatches are exercised.

---

# Performance Considerations

- **Decision latency**: Writing an eight-dimension analysis takes 30-90 minutes. This is a one-time cost per package decision, amortized over the package's lifetime.
- **Analysis paralysis risk**: Not every package needs this depth. Reserve the full eight-dimension analysis for architectural decisions (billing, auth, queue, search). Use abbreviated versions for minor choices.

---

# Security Considerations

- **Vulnerability surface**: The operational impact dimension must include security implications. A package that adds a new queue connection adds a new attack surface.
- **Supply chain risk**: The tradeoff dimension should note if the package has a single maintainer, is unmaintained, or requires broad composer dependencies.
- **Credential exposure**: Testing impact must note if the package requires API keys in test environments or CI.

---

# Common Mistakes

**Mistake: Skipping the escape hatch dimension**
- Description: Recommending a package without documenting how to bypass it
- Cause: Optimism bias — "we won't need to escape"
- Consequence: When requirements change, the team faces a forced rewrite instead of a gradual migration
- Better: Always name the escape hatch, even if it's just "drop the package and use the underlying SDK directly"

**Mistake: Treating fit/non-fit as preferences instead of requirements**
- Description: Making recommendations like "Use Spatie Permission unless you don't like it"
- Cause: Not doing the research to identify concrete non-fit conditions
- Consequence: Team adopts package that doesn't fit their actual requirements
- Better: Tie every non-fit condition to a concrete, falsifiable requirement

**Mistake: Ignoring testing impact until test suite breaks**
- Description: Recommending a package without understanding its testing implications
- Cause: Assuming all packages are "easy to test"
- Consequence: Test suite becomes slow (real API calls), flaky (network), or untestable (static calls)
- Better: Test the package's testing story before recommending it

---

# Anti-Patterns

- **Blind defaultism**: Always recommending the same package regardless of context. "Use Spatie for everything" is not a calibrated recommendation.
- **Analysis without action**: Writing detailed fit/non-fit analyses but adopting the package regardless of whether it fits.
- **Recommendation without expiration**: Package recommendations that never get re-evaluated. Package ecosystems change; recommendations should have a review date.

---

# Example: Calibrated Cashier Recommendation

```markdown
## Recommendation: Laravel Cashier (Stripe)

### 1. Default Recommendation
Use Laravel Cashier for Stripe-based subscription billing.

### 2. When It Fits
- Stripe is the sole payment provider
- Subscription plans map cleanly to Stripe products/prices
- App needs invoices, free trials, proration, customer portal
- Single billing provider (no multi-gateway requirement)
- Standard subscription lifecycle (create → trial → active → cancel → expire)

### 3. When It Does NOT Fit
- Marketplace payouts (Stripe Connect) — Cashier has no Connect abstractions
- Multiple payment providers required (Stripe + Paddle + Adyen)
- Complex metered/usage billing beyond simple quantities
- Custom entitlement engine not expressible as Stripe prices
- Need to support non-Stripe gateways in the future

### 4. Alternative
stripe/stripe-php directly, Paddle, or LemonSqueezy

### 5. Escape Hatch
Wrap Cashier behind a BillingGateway interface. Use stripe/stripe-php
directly for flows Cashier doesn't support (Connect, metered billing).
Migrate incrementally by moving methods from the Cashier adapter to a
direct Stripe adapter.

### 6. Tradeoff Accepted
Locked into Stripe ecosystem. Cashier upgrades can break customization if
we override protected methods. Stripe tax/compliance is US-centric.

### 7. Testing Impact
Cashier tests require Stripe test keys + test clocks for time-sensitive
scenarios. Use Cashier's fake methods for invoice previews. E2E billing
tests are slow (~2s per test).

### 8. Operational Impact
Stripe webhooks must be handled reliably (idempotency keys, retries).
Cashier updates cache after subscription changes — cache tags recommended.
Webhook signature verification must be tested in staging.
```

---

# AI Agent Notes

- When generating package recommendations, always produce all eight dimensions. Never output only a package name.
- Fit/non-fit criteria must reference concrete technical requirements (e.g., "Stripe is sole provider"), not subjective opinions (e.g., "good DX").
- The escape hatch must describe an actual code migration path, not a hand-wavy "we'll figure it out."
- Testing impact must name specific fakes or strategies. "Cashier provides test helpers" is vague; "Cashier::fake() for invoices, Stripe test clocks for subscription time travel" is concrete.
- Before recommending a package, scan its GitHub for maintenance health: last release date, open issues, PR merge rate.

---

# Verification

- [ ] All eight dimensions present for the recommendation
- [ ] Fit criteria are falsifiable (can be objectively checked)
- [ ] Non-fit criteria reference concrete requirements, not preferences
- [ ] Alternative is named and realistic (not just "build custom")
- [ ] Escape hatch describes a concrete migration path
- [ ] Tradeoffs are explicit (every package has tradeoffs — none means analysis is incomplete)
- [ ] Testing impact names specific fakes or testing strategies
- [ ] Operational impact covers new failure modes introduced by the package
- [ ] Recommendation includes a review date or trigger for re-evaluation
