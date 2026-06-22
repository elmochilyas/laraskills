# Decision Trees for Package Fit / Non-Fit Analysis

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Package Fit/Non-Fit Analysis |
| Related KUs | 01-calibrated-package-recommendation, 04-package-escape-hatch-strategy, 05-when-not-to-build-custom |

---

## Decision Inventory

| ID | Decision | Priority |
|----|----------|----------|
| DT-FNA-001 | What is the adoption recommendation based on the 7-dimension score? | P0 |
| DT-FNA-002 | Is the maintenance health assessment sufficient to trust this package? | P0 |
| DT-FNA-003 | Should this package be adopted despite assumption mismatches? | P0 |
| DT-FNA-004 | Does the lock-in severity override the other dimension scores? | P0 |

---

## DT-FNA-001: What Is the Adoption Recommendation Based on the 7-Dimension Score?

### Decision Context
After scoring all seven dimensions, the raw total must be mapped to an actionable recommendation tier. The tiers determine whether the package can be adopted, under what conditions, and at what risk.

### Decision Criteria
- Total score across seven dimensions (max 70)
- Individual dimension scores (a single critical failure may override the total)
- Lock-in dimension score (if < 4, downgrade)
- Maintenance health score (if < 3, automatic high-risk regardless of total)

### Decision Tree

```
Total score ≥ 50?
├── YES → Does maintenance health score < 3?
│   ├── YES → DOWNGRADE to High-Risk. Unmaintained packages are non-negotiable.
│   └── NO → Does lock-in score < 4?
│       ├── YES → DOWNGRADE to Conditional Fit. High lock-in requires conditions.
│       └── NO → STRONG FIT. Proceed with adoption.
│           └── Document any dimensions that scored below 6 as monitoring points.
├── NO → Total score 30-49?
    ├── YES → CONDITIONAL FIT. Document explicit conditions that must hold.
    │   └── Re-evaluate in 6 months. If conditions break, trigger exit evaluation.
    └── NO → Total score < 30?
        ├── YES → HIGH-RISK FIT. Do not adopt unless:
        │   ├── No alternative exists, AND
        │   ├── Technical leadership explicitly accepts the risk, AND
        │   └── Exit triggers are defined before first integration.
        └── (Score invalid — must be 0-70)
```

### Rationale
The numeric score is a starting point, not the final answer. Two override rules exist: (1) unmaintained packages are automatic rejects regardless of other scores — security trumps features; (2) high lock-in reduces confidence even if other dimensions are strong — lock-in cannot be undone without a rewrite. The tier system ensures that a package scoring 52 but with critical lock-in isn't treated the same as a package scoring 52 with minimal lock-in.

### Recommended Default
**Default to conditional fit for scores 35-55.** Most packages have both strengths and weaknesses. "Conditional fit" with documented conditions is more honest than "strong fit" that ignores risks or "high-risk" that ignores benefits.

### Risks Of Wrong Choice
- **Overly permissive (treating 35 as strong fit)**: Team adopts a package that has significant risks without documenting conditions. Problems surprise the team later.
- **Overly restrictive (treating 55 as high-risk)**: Team rejects a solid package because one dimension scored low (e.g., team familiarity is 3/10 but the package is otherwise excellent). Missed opportunity.

### Related Rules
- Score Each Dimension, Do Not Rely on Gut Feeling
- Weight Lock-In Risk Higher Than Other Dimensions

### Related Skills
- Calibrated Package Recommendation Writing (KU 01)

---

## DT-FNA-002: Is the Maintenance Health Assessment Sufficient to Trust This Package?

### Decision Context
A package's maintenance health determines whether it's safe to adopt. A superficially popular package (10K stars) may be abandonware (no commits in 2 years). This decision tree evaluates whether the maintenance signals are strong enough to trust the package for production use.

### Decision Criteria
- Last release date (must be within 6 months unless "feature-complete")
- Release frequency pattern (monthly, quarterly, sporadic)
- Open issues: count and proportion that are stale (>6 months)
- PR merge rate (high, medium, low)
- Test suite status (passing, failing, absent)
- PHP 8.3+ and Laravel 13+ support confirmed

### Decision Tree

```
Has the package had a release in the last 6 months?
├── NO → Is the package "feature-complete" by design (UUID lib, formatter)?
│   ├── YES → Are security issues being addressed despite no feature releases?
│   │   ├── YES → CONDITIONAL. Maintenance is reactive but functional.
│   │   └── NO → REJECT. Abandonware with open security issues.
│   └── NO → REJECT. Active packages release within 6 months.
├── YES → Does the test suite pass on PHP 8.3+?
    ├── NO → REJECT. Failing test suite on current PHP version.
    ├── YES → Is the PR merge rate high or medium?
        ├── NO (PRs sit unmerged for months) → HIGH-RISK. Maintainer may be absent.
        ├── YES → Are >30% of open issues stale (>6 months)?
            ├── YES → CONDITIONAL. Triage backlog exists but active development continues.
            └── NO → TRUST. Maintenance signals are strong across all indicators.
```

### Rationale
Stars and download counts measure past popularity, not current maintenance. A package with 15K stars but no commits since 2023 is abandonware — it won't receive security patches, PHP 8.4 compatibility, or Laravel 14 support. The six-month release window is deliberately generous to accommodate "feature-complete" packages that are stable but still receive security updates.

### Recommended Default
**Reject packages with no releases in 12+ months regardless of other signals.** The one exception is a package whose maintainer has explicitly stated it's stable and will receive security patches — and this statement must be verified, not assumed.

### Risks Of Wrong Choice
- **Adopting abandonware**: No security patches, no PHP compatibility updates, no migration path. The package is technical debt on day one.
- **Rejecting a stable package**: A UUID generation library with no commits in 2 years that's genuinely feature-complete and bug-free. Cost of rejection: building custom UUID logic (minimal).

### Related Rules
- Check Maintenance Health Beyond Stars and Downloads

### Related Skills
- Calibrated Package Recommendation Writing (KU 01)
- When NOT To Build Custom (KU 05)

---

## DT-FNA-003: Should This Package Be Adopted Despite Assumption Mismatches?

### Decision Context
Every package makes assumptions about your domain. When assumptions don't match, the team faces a choice: override the package's behavior, use the escape hatch, or reject the package. The 20% rule provides a threshold for this decision.

### Decision Criteria
- How many of the package's core assumptions are violated?
- What percentage of the package's methods would need to be overridden?
- Can the mismatched assumptions be handled by the escape hatch for isolated flows?
- Does the package own database schema that would be difficult to migrate away from?

### Decision Tree

```
Does the package's core assumption match your primary requirement?
├── NO → REJECT. If the fundamental assumption is wrong (e.g., Cashier assumes Stripe, you need multi-provider), the package doesn't fit. Do not adopt.
├── YES → Are there secondary assumption mismatches?
    ├── NO → ADOPT. Package fits.
    ├── YES → How many methods would need overriding or escaping?
        ├── >30% of methods → REJECT. The package doesn't fit. Override cost exceeds package value.
        ├── 10-30% of methods → CONDITIONAL ADOPT. Use escape hatch for mismatched methods. Monitor escape hatch usage.
        └── <10% of methods → ADOPT WITH ESCAPE HATCH. Small mismatch surface is normal. Design escapes for those methods.
```

### Rationale
The 20% threshold is derived from empirical observation: when teams override more than ~20% of a package's methods, they spend more time fighting the package than benefiting from it. The package's upgrade path becomes dangerous (overrides break on upgrades), and the team is essentially maintaining a fork. Below 10%, escape hatches are normal and healthy — no package fits 100% of use cases.

### Recommended Default
**Reject if the core assumption is violated (not "we can work around it").** Accept with escape hatches if secondary assumptions have minor mismatches (<15% of methods).

### Risks Of Wrong Choice
- **Adopting despite core mismatch**: The team overrides 40% of methods, the package provides negative value, upgrades break the overrides, and the exit cost is high because the package owns schema.
- **Rejecting despite minor mismatch**: The team builds custom for 3 methods the package didn't support, spending 8 weeks when a 2-week escape hatch would have sufficed.

### Related Rules
- Test the Package's Assumptions in a Spike Before Adopting
- Weight Lock-In Risk Higher Than Other Dimensions

### Related Skills
- Package Escape Hatch Strategy (KU 04)
- When NOT To Build Custom (KU 05)

---

## DT-FNA-004: Does the Lock-In Severity Override the Other Dimension Scores?

### Decision Context
Lock-in is the most underweighted dimension. A package can score strongly on ecosystem alignment, maintenance health, and assumption fit, but if it creates deep lock-in (schema ownership, model coupling, vendor-specific data), the adoption decision must account for the exit cost. This decision tree applies the lock-in override.

### Decision Criteria
- Does the package own database migrations?
- Does the package modify core models via traits (e.g., Cashier's Billable trait)?
- Does the package store vendor-specific IDs that other systems reference?
- What is the estimated migration cost if the package is replaced?

### Decision Tree

```
Does the package own database migrations (creates tables, modifies core tables)?
├── YES → Does the package modify core models via traits?
│   ├── YES → LOCK-IN IS CRITICAL (score 1-2). Downgrade adoption tier by two levels.
│   │   └── Strong Fit → Conditional. Conditional → High-Risk.
│   └── NO → Does the package store vendor-specific IDs referenced by other tables?
│       ├── YES → LOCK-IN IS HIGH (score 3-4). Downgrade adoption tier by one level.
│       └── NO → LOCK-IN IS MODERATE (score 5-6). No override. Standard scoring applies.
├── NO → Does the package require vendor-specific configuration that cannot be shared?
    ├── YES → LOCK-IN IS MODERATE-LOW (score 6-7). No override.
    └── NO → LOCK-IN IS LOW (score 8-10). Package is a thin wrapper — easy to swap.
```

### Rationale
Lock-in severity is asymmetric: low lock-in is a convenience; high lock-in is a near-permanent decision. A package that modifies the User model (like Cashier's Billable trait) creates lock-in that persists even after the package is removed — the schema changes remain. The downgrade tiers ensure that lock-in is never ignored in favor of more visible but less consequential dimensions like team familiarity.

### Recommended Default
**Treat "owns migrations AND modifies core models" as a near-dealbreaker** unless the team has documented acceptance of permanent vendor coupling.

### Risks Of Wrong Choice
- **Ignoring lock-in**: Team adopts a package with deep Eloquent integration because "it's the standard." Two years later, they need to switch providers. Migration cost: 6 weeks. The package was effectively permanent.
- **Over-weighting lock-in**: Team rejects a package that owns a single utility table (no model modification) because "lock-in." The lock-in is trivial (delete the table, remove the package).

### Related Rules
- Weight Lock-In Risk Higher Than Other Dimensions
- Test the Package's Assumptions in a Spike Before Adopting

### Related Skills
- Package Wrapper/Boundary Pattern (KU 03)
- Package Escape Hatch Strategy (KU 04)
- When NOT To Build Custom (KU 05)
