# Decision Trees for Calibrated Package Recommendation

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Calibrated Package Recommendation |
| Related KUs | 02-package-fit-non-fit-analysis, 03-package-wrapper-boundary, 04-package-escape-hatch-strategy |

---

## Decision Inventory

| ID | Decision | Priority |
|----|----------|----------|
| DT-CPR-001 | Does this package need a full 8-dimension calibrated recommendation? | P0 |
| DT-CPR-002 | Is this escape hatch concrete enough to prevent sunk-cost trapping? | P0 |
| DT-CPR-003 | Is this package recommendation still fit for purpose (re-evaluation)? | P0 |
| DT-CPR-004 | Should the recommendation be updated due to package ecosystem changes? | P1 |

---

## DT-CPR-001: Does This Package Need a Full 8-Dimension Calibrated Recommendation?

### Decision Context
Not every package adoption requires the full calibrated recommendation treatment. Over-analyzing trivial packages creates analysis paralysis; under-analyzing architectural packages creates unknown risks. The decision filters which packages warrant the investment.

### Decision Criteria
- Is the package handling a business-critical flow? (billing, auth, search, queue)
- Will replacing this package require more than 1 day of migration work?
- Does the package own database migrations or modify core models?
- Does the package introduce a new external dependency (Stripe, Algolia, Twilio)?
- Is the package a framework-native feature with no decision to make?

### Decision Tree

```
Is this a framework-native feature (Eloquent, Blade, routing)?
├── YES → No calibrated recommendation needed. Use the framework.
├── NO → Is this a business-critical architectural concern?
    ├── NO → Is the package trivial (single utility, formatting helper)?
    │   ├── YES → Abbreviated 3-dimension analysis sufficient
    │   └── NO → Does the package own migrations or modify core models?
    │       ├── YES → Full 8-dimension recommendation required
    │       └── NO → Does the package introduce a new external dependency?
    │           ├── YES → Full 8-dimension recommendation required
    │           └── NO → Abbreviated 5-dimension analysis
    └── YES → Full 8-dimension calibrated recommendation required
```

### Rationale
Business-critical architectural concerns (billing, auth, search, queue management) carry the highest cost of wrong choice. The time cost of a full analysis (30-90 minutes) is negligible compared to the cost of replacing a deeply integrated package that doesn't fit (weeks to months). For trivial packages, the analysis overhead exceeds the risk.

### Recommended Default
**When in doubt, do the full analysis.** The cost of a wrong architectural decision is 10-100x the cost of 90 minutes of analysis. Err on the side of rigor.

### Risks Of Wrong Choice
- **Over-analysis (false positive)**: 30-90 minutes of engineering time lost on a decision that didn't need rigor. Cost: negligible.
- **Under-analysis (false negative)**: Package adopted without understanding fit conditions. Six months later, the team discovers the package doesn't support a critical requirement. Cost: weeks of migration.

### Related Rules
- Write All Eight Dimensions Before Recommending
- Make Fit/Non-Fit Criteria Falsifiable

### Related Skills
- Package Fit/Non-Fit Analysis (KU 02)

---

## DT-CPR-002: Is This Escape Hatch Concrete Enough to Prevent Sunk-Cost Trapping?

### Decision Context
An escape hatch that is hand-wavy ("we'll find another package") is not an escape hatch — it's a wish. A concrete escape hatch must describe a code-level migration path that another engineer could execute without asking additional questions.

### Decision Criteria
- Does the escape hatch name a specific SDK, class, or pattern?
- Can an engineer unfamiliar with the original decision execute the escape path from the description alone?
- Does the escape hatch describe data migration (if the package owns schema)?
- Is the escape hatch symmetrical (can flows move back to the package path)?

### Decision Tree

```
Does the escape hatch name a specific SDK, class, or concrete pattern?
├── NO → ESCAPE HATCH IS INSUFFICIENT. Redesign before adopting the package.
├── YES → Does it describe how to bypass the package WITHOUT abandoning it?
    ├── NO → ESCAPE HATCH IS INSUFFICIENT. It describes package replacement, not an escape.
    ├── YES → Does it handle data migration if the package owns schema?
        ├── NO (and package owns schema) → ESCAPE HATCH IS INCOMPLETE. Add data migration path.
        ├── YES or (package doesn't own schema) → Can an engineer execute it without asking questions?
            ├── NO → ESCAPE HATCH IS TOO VAGUE. Add concrete method names, class paths, and an example.
            └── YES → Escape hatch is sufficient.
```

### Rationale
An escape hatch exists to prevent sunk-cost trapping: the scenario where a package is painful to keep but expensive to leave. If the escape hatch is too vague to execute, the sunk-cost trap still exists — the team knows they SHOULD escape but doesn't know HOW. The escape hatch must be implementation-ready, not aspirational.

### Recommended Default
**Default to requiring a code example in the escape hatch description.** A 5-line code snippet showing the adapter branching between package path and escape path is worth 5 paragraphs of prose.

### Risks Of Wrong Choice
- **Vague escape hatch**: When requirements change, the team knows they need to escape but cannot because the path was never designed. Forced rewrite ensues.
- **Over-specified escape hatch**: Engineering effort spent designing an escape for a scenario that never materializes. Cost: moderate (2-3 hours), acceptable given the risk asymmetry.

### Related Rules
- Always Name the Escape Hatch
- Use the Same Interface for Both the Package Path and the Escape Hatch Path

### Related Skills
- Package Escape Hatch Strategy (KU 04)
- Package Wrapper/Boundary Pattern (KU 03)

---

## DT-CPR-003: Is This Package Recommendation Still Fit for Purpose?

### Decision Context
Package recommendations decay over time. The package may become unmaintained, business requirements may drift, or alternatives may mature. Annual re-evaluation prevents stale recommendations from guiding new decisions. This decision tree determines whether a previously sound recommendation still holds.

### Decision Criteria
- Has the package had a release in the last 6 months?
- Have any of the original non-fit conditions become true?
- Has the team encountered a scenario where the escape hatch was the ONLY option?
- Has a new alternative emerged that addresses the original tradeoffs?

### Decision Tree

```
Has the package had a release in the last 6 months?
├── NO → RECOMMENDATION IS AT RISK. Package may be unmaintained.
│   └── Are security issues being addressed despite no releases?
│       ├── YES → Conditional: maintain but flag for replacement planning.
│       └── NO → RECOMMENDATION INVALID. Initiate package exit evaluation.
├── YES → Have any original non-fit conditions become true?
    ├── YES → RECOMMENDATION INVALID. The package no longer fits.
    ├── NO → Has escape hatch usage exceeded 20% of flows?
        ├── YES → RECOMMENDATION DEGRADING. The package is becoming a net negative.
        ├── NO → Has a materially better alternative emerged?
            ├── YES → Evaluate the alternative against the original fit criteria.
            └── NO → Recommendation remains VALID. Schedule next review in 12 months.
```

### Rationale
Packages and business requirements both evolve. A recommendation written 18 months ago may be wrong today. The re-evaluation triggers are designed to catch: (1) unmaintained packages before they become security risks, (2) requirement drift before it becomes a crisis, and (3) better alternatives before sunk cost prevents migration.

### Recommended Default
**Schedule annual re-evaluation for every architectural package recommendation.** Set a calendar reminder with the specific re-evaluation triggers from the original recommendation.

### Risks Of Wrong Choice
- **No re-evaluation**: Stale recommendations guide new team members to adopt packages that no longer fit. The team operates on outdated assumptions.
- **Over-frequent re-evaluation**: Quarterly re-evaluations for stable, well-maintained packages waste engineering time. Annual cadence is the sweet spot.

### Related Rules
- Re-Evaluate Fit Annually
- Document Accepted Tradeoffs Explicitly

### Related Skills
- Package Fit/Non-Fit Analysis (KU 02)
- When NOT To Build Custom (KU 05)

---

## DT-CPR-004: Should the Recommendation Be Updated Due to Package Ecosystem Changes?

### Decision Context
Package ecosystems change: Laravel 13 ships, PHP 8.4 is released, a package goes through a major version upgrade. These events may invalidate parts of the original recommendation without triggering the full annual re-evaluation. This decision tree handles event-driven re-evaluation.

### Decision Criteria
- Has the package released a new major version?
- Has the underlying provider (Stripe, Algolia, etc.) changed its API?
- Has the project upgraded Laravel or PHP major versions?
- Has a critical security vulnerability been disclosed in the package?

### Decision Tree

```
Has a critical security vulnerability been disclosed?
├── YES → EMERGENCY RE-EVALUATION. Update recommendation within 48 hours.
├── NO → Has the package released a new major version?
    ├── YES → RE-EVALUATE. Run fit/non-fit analysis for the new version.
    ├── NO → Has the underlying provider changed its API?
        ├── YES → RE-EVALUATE. Provider API changes may break package assumptions.
        ├── NO → Has the project upgraded Laravel or PHP major versions?
            ├── YES → VERIFY. Check the package's compatibility with new framework version.
            └── NO → No update needed. Recommendation remains current.
```

### Rationale
Event-driven re-evaluation catches changes between annual reviews. A package's v4 may have different requirements than v3. A Stripe API version bump may break Cashier's webhook handling. These are not scheduling issues — they're event-driven and require immediate verification.

### Recommended Default
**Tie re-evaluation triggers to your CI pipeline.** If a `composer.lock` change bumps a package to a new major version, flag it for architectural review.

### Risks Of Wrong Choice
- **Missed major version impact**: Deploying a package major version upgrade without re-evaluating fit. Breaking changes discovered in production.
- **Over-reaction to minor changes**: Re-evaluating for every patch version. Noise drowns the signal.

### Related Rules
- Re-Evaluate Fit Annually
- Re-Run Analysis on Major Version Upgrades

### Related Skills
- Package Fit/Non-Fit Analysis (KU 02)
