# Decision Trees for Package Escape Hatch Strategy

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Package Escape Hatch Strategy |
| Related KUs | 03-package-wrapper-boundary, 01-calibrated-package-recommendation, 05-when-not-to-build-custom |

---

## Decision Inventory

| ID | Decision | Priority |
|----|----------|----------|
| DT-ESC-001 | Does this flow need the escape hatch or the normal package path? | P0 |
| DT-ESC-002 | Has escape hatch usage crossed the threshold for package re-evaluation? | P0 |
| DT-ESC-003 | Should a new escape method be added or is this a package exit signal? | P0 |
| DT-ESC-004 | Should an escaped flow return to the package path? | P1 |

---

## DT-ESC-001: Does This Flow Need the Escape Hatch or the Normal Package Path?

### Decision Context
For each operation that hits the adapter, the adapter must decide whether to use the package path (normal) or the escape hatch path (bypass). The decision must be deterministic, logged, and based on falsifiable trigger conditions — not subjective judgment.

### Decision Criteria
- Is the operation type one the package explicitly supports?
- Does the operation match a documented non-fit condition?
- Is the operation a one-off exception or a pattern that will repeat?
- Has the package recently added support for this flow?

### Decision Tree

```
Is this operation type explicitly supported by the package (per its documentation)?
├── YES → USE PACKAGE PATH. Even if it "feels complex," if the package supports it, use it.
├── NO → Does this operation match a documented non-fit trigger condition?
    ├── YES → USE ESCAPE HATCH. Log the activation with package, method, and reason.
    │   └── Is this the first activation of this escape hatch?
    │       ├── YES → Alert the team. First escape activation may indicate requirement drift.
    │       └── NO → Continue. But increment the usage counter for monitoring.
    ├── NO → Is this a new requirement the package was never evaluated against?
        ├── YES → PAUSE. This is a package re-evaluation trigger, not an escape hatch scenario.
        │   └── Re-run the fit/non-fit analysis (KU 02) for this new requirement.
        └── NO → INVESTIGATE. Neither the package path nor documented escape path covers this.
            └── This is a gap in both the recommendation and the escape hatch design.
```

### Rationale
The escape hatch is for known, documented non-fit conditions — not for ad-hoc bypassing of the package. When a new requirement emerges that neither the package nor the escape hatch was designed for, it's a re-evaluation signal, not a "quick escape." Without this discipline, the escape hatch becomes a dumping ground for every inconvenience, masking the fact that the package no longer fits.

### Recommended Default
**Default to package path. Only use the escape hatch when a documented, falsifiable non-fit trigger condition is met.** Never escape based on "this seems complicated."

### Risks Of Wrong Choice
- **Over-escaping**: Every slightly complex flow bypasses the package. The package provides diminishing value and its upgrade path is never tested for escaped flows.
- **Under-escaping**: The team forces the package to handle flows it wasn't designed for, creating fragile workarounds that break on package upgrades.

### Related Rules
- Log Every Escape Hatch Activation
- Limit Escape Hatch Surface to 2-3 Methods

### Related Skills
- Package Fit/Non-Fit Analysis (KU 02)
- When NOT To Build Custom (KU 05)

---

## DT-ESC-002: Has Escape Hatch Usage Crossed the Threshold for Package Re-Evaluation?

### Decision Context
Escape hatch usage is a leading indicator of package fit degradation. When the escape hatch handles an increasing percentage of flows, the package's value proposition erodes. This decision tree provides the thresholds for triggering re-evaluation.

### Decision Criteria
- What percentage of method calls use the escape hatch vs. the package path?
- Is escape hatch usage trending upward (growing) or stable?
- Are the escaped flows concentrated in a single method or spread across many?
- Is the escape hatch code growing more complex (new escape methods being added)?

### Decision Tree

```
What percentage of total adapter calls use the escape hatch?
├── <5% → NORMAL. The escape hatch is functioning as a safety valve for edge cases.
├── 5-15% → MONITOR. Track the trend. If usage is stable, continue. If growing, investigate.
│   └── Is usage growing month-over-month?
│       ├── YES → Schedule a re-evaluation in the next planning cycle.
│       └── NO → Continue monitoring. Set an alert for >15%.
├── 15-20% → WARNING. The package's fit is degrading.
│   └── Trigger a package re-evaluation within the current quarter.
│   └── Investigate whether requirements have drifted or the package has stagnated.
├── >20% → CRITICAL. The package no longer fits.
    └── Trigger immediate package exit evaluation (KU 05).
    └── The escape hatch has become the primary implementation. The package is providing negative value.
```

### Rationale
The 20% threshold is derived from the cost crossover point: when more than 1 in 5 operations bypass the package, the team is spending more effort maintaining the escape hatch + package integration than they would spend on a clean alternative. The package's upgrade path becomes risky (upgrades may break escape hatch assumptions), and the codebase has two implementations of the same capability. At 20%, the escape hatch has become the system — the package is dead weight.

### Recommended Default
**Set automated monitoring on escape hatch usage rate.** Alert at 10% (warning) and 20% (re-evaluation trigger). Review escape hatch metrics at quarterly architecture reviews.

### Risks Of Wrong Choice
- **Threshold too high (50%)**: The package is providing negligible value but the team keeps it because "we haven't hit the threshold." The escape hatch IS the implementation.
- **Threshold too low (5%)**: Every minor escape triggers a package exit evaluation, creating churn. Normal package usage includes 3-5% edge cases that any package would miss.

### Related Rules
- Log Every Escape Hatch Activation
- Limit Escape Hatch Surface to 2-3 Methods
- Measure Current Package Cost Before Comparing to Custom Build Cost

### Related Skills
- When NOT To Build Custom (KU 05)
- Package Fit/Non-Fit Analysis (KU 02)

---

## DT-ESC-003: Should a New Escape Method Be Added or Is This a Package Exit Signal?

### Decision Context
When a new requirement cannot be handled by either the package or existing escape methods, the team must decide: add another escape method (treating it as an edge case) or recognize it as a package exit signal (the package fundamentally doesn't fit). The 20% surface rule provides the framework for this decision.

### Decision Criteria
- How many escape methods already exist?
- What percentage of the adapter's total methods are escape methods?
- Is the new requirement a minor variation of existing flows or a fundamentally new category?
- Would adding this escape method push total escape coverage above 20%?

### Decision Tree

```
How many escape methods already exist in this adapter?
├── 0 → ADD ESCAPE METHOD. This is the first edge case. Document the trigger condition.
├── 1-2 → ADD ESCAPE METHOD with caution. Two escape methods is normal. Three is the ceiling.
│   └── After adding: is the total escape count now 3+?
│       ├── YES → Would this new escape + existing escapes cover >20% of the interface?
│       │   ├── YES → DO NOT ADD. This is a package exit signal. Evaluate exit (KU 05).
│       │   └── NO → ADD. But flag the adapter for quarterly review.
│       └── NO → ADD. Within acceptable bounds.
├── 3+ → STRONG EXIT SIGNAL.
    └── Does the team expect to add more escape methods in the next 6 months?
        ├── YES → PACKAGE EXIT. The trend is toward more escapes, not fewer.
        └── NO → CONDITIONAL: add this last escape method. If ANY new escape is needed after this, exit.
```

### Rationale
Escape methods have a compounding cost. Each new escape method: (1) adds to the adapter's complexity, (2) requires its own tests, (3) may have different performance characteristics, (4) creates a code path that package upgrades don't test, and (5) signals that the package's fit is degrading. The 3-escape-method ceiling is based on the observation that packages rarely have more than 2 genuine edge cases. When a third escape is needed, it's usually a sign that the package was wrong from the start.

### Recommended Default
**Maximum 3 escape methods per adapter. When the 4th is proposed, trigger package exit evaluation.**

### Risks Of Wrong Choice
- **Adding too many escapes**: The adapter becomes a custom implementation wrapped in an interface, with the package providing negligible value. The team maintains two billing implementations.
- **Exiting too early**: A package that handles 90% of flows perfectly is abandoned because 3 edge cases needed escapes. The custom rebuild loses the 90% that worked.

### Related Rules
- Limit Escape Hatch Surface to 2-3 Methods
- Design the Escape Hatch Before the First Integration

### Related Skills
- When NOT To Build Custom (KU 05)
- Package Wrapper/Boundary Pattern (KU 03)

---

## DT-ESC-004: Should an Escaped Flow Return to the Package Path?

### Decision Context
Packages evolve. Cashier might add Connect support. Scout might add complex filter support. When a package adds a feature that covers a previously escaped flow, the team must decide: move the flow back to the package path (benefiting from package maintenance, upgrades, and community support) or keep it on the escape path (maintaining custom code).

### Decision Criteria
- Has the package added support for the previously escaped flow in a stable release?
- Does the package's implementation cover all the requirements the escape hatch handles?
- Is the package's implementation tested and documented (not an alpha/unstable feature)?
- What is the cost of migrating the escaped flow back to the package path?

### Decision Tree

```
Has the package added support for the escaped flow in a stable (non-alpha, non-beta) release?
├── NO → STAY ON ESCAPE PATH. Re-evaluate on next package major version.
├── YES → Does the package's implementation cover ALL requirements the escape hatch handles?
    ├── NO → STAY ON ESCAPE PATH. Partial coverage still requires the escape for uncovered requirements.
    │   └── Can the escape hatch be simplified to only cover the remaining gap?
    │       ├── YES → SIMPLIFY ESCAPE. Reduce escape to only the delta the package still misses.
    │       └── NO → STAY. Full escape still needed.
    ├── YES → Is the package's implementation in a stable release (not alpha/beta/experimental)?
        ├── NO → WAIT. Monitor the feature's stability. Re-evaluate when it reaches stable.
        ├── YES → Have the escape hatch's integration tests passed against the new package version?
            ├── NO → INVESTIGATE. The package's implementation may differ from escape assumptions.
            ├── YES → MIGRATE BACK. Move the flow from escape path to package path.
                └── Add a deprecation comment on the escape method: "Deprecated after Cashier v15 added Connect support."
```

### Rationale
The escape hatch exists because of a package gap. When the gap is filled, the escape hatch becomes dead code. Moving flows back to the package path: (1) reduces custom code maintenance, (2) leverages community testing and bug fixes, (3) ensures the flow benefits from package upgrades, and (4) simplifies the adapter. The escape hatch should be symmetrical — flows should move both OUT of the package (when gaps appear) and BACK to the package (when gaps are filled).

### Recommended Default
**Default to migrating back to the package path when the package adds stable support.** The escape hatch is a safety valve, not a permanent alternative. Remove or deprecate escape methods that are no longer needed.

### Risks Of Wrong Choice
- **Not migrating back**: The escape hatch persists as dead code. The package's new feature is never adopted. The team maintains custom code for a problem the package now solves.
- **Migrating back prematurely**: The package's new feature is unstable (alpha/beta) and the escape hatch is removed. The new feature has bugs. The team has no fallback.

### Related Rules
- Test Both Paths — Package Path and Escape Hatch Path
- Log Every Escape Hatch Activation

### Related Skills
- Package Wrapper/Boundary Pattern (KU 03)
- Calibrated Package Recommendation Writing (KU 01)
