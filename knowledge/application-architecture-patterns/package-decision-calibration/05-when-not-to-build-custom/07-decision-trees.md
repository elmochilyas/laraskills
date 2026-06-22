# Decision Trees for When NOT To Build Custom

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | When NOT To Build Custom |
| Related KUs | 02-package-fit-non-fit-analysis, 04-package-escape-hatch-strategy, 01-calibrated-package-recommendation |

---

## Decision Inventory

| ID | Decision | Priority |
|----|----------|----------|
| DT-WNB-001 | Should we exit this package and build custom? | P0 |
| DT-WNB-002 | Fork or full custom build? | P0 |
| DT-WNB-003 | When should the exit migration happen? | P1 |
| DT-WNB-004 | Is this feature worth building custom, or should we keep the package + escape hatch? | P1 |

---

## DT-WNB-001: Should We Exit This Package and Build Custom?

### Decision Context
The team is frustrated with a package and considering replacing it with custom code. This decision must be driven by measured data and liability signals, not frustration. The decision tree walks through the gating criteria before committing to an exit.

### Decision Criteria
- How many liability signals are present? (Need 3+ to justify exit)
- What is the measured package cost over 2-4 weeks?
- What is the estimated custom build cost over 3 years?
- Is the package handling a compliance-sensitive domain (billing, auth, encryption)?
- Has the escape hatch been evaluated or tried?

### Decision Tree

```
Are 3+ liability signals present?
├── NO → DO NOT EXIT. The package likely still fits. Investigate the specific friction.
│   └── Is the escape hatch available for the specific friction point?
│       ├── YES → USE ESCAPE HATCH. Keep package for existing flows, escape for the friction.
│       └── NO → DESIGN ESCAPE HATCH. The escape pattern is the first resort before exit.
├── YES → Has current package cost been MEASURED over 2-4 weeks?
    ├── NO → MEASURE FIRST. Do not exit based on perceived cost. Track actual hours for 2-4 weeks.
    ├── YES → Has a full custom build cost estimate been prepared (initial + 3-year maintenance)?
        ├── NO → PREPARE COST ESTIMATE. Use the cost accounting template.
        ├── YES → Is custom cost < package cost over 3 years?
            ├── NO → DO NOT EXIT. Package is cheaper even with its friction. Improve integration instead.
            ├── YES → Is the package handling a compliance-sensitive domain (billing, auth)?
                ├── YES → Does the team accept the compliance risk of custom code?
                │   ├── NO → DO NOT EXIT. Compliance risk outweighs cost savings.
                │   └── YES → PROCEED TO FORK-VS-BUILD DECISION (DT-WNB-002).
                └── NO → PROCEED TO FORK-VS-BUILD DECISION (DT-WNB-002).
```

### Rationale
The three gates — liability signals, measured cost, and full cost estimate — prevent emotional decisions. The most common failure mode is "we spent 4 hours debugging Cashier yesterday, let's build our own billing system" — a decision made on a single data point without measuring actual costs. The compliance gate for billing/auth/encryption domains is critical: custom code in these domains introduces compliance risk that often outweighs cost savings.

### Recommended Default
**Default to keeping the package unless 3+ liability signals AND measured cost > custom cost over 3 years.** The burden of proof is on "build custom" — the package is the incumbent with community testing, security patches, and documentation.

### Risks Of Wrong Choice
- **Premature exit**: Team replaces a package costing 2 hours/month with custom code costing 8 hours/month. The "build custom" decision made on frustration delivers a worse outcome.
- **Delayed exit**: Team keeps a package costing 20 hours/month because "we've already invested in it." The sunk cost trap prevents a beneficial migration.

### Related Rules
- Measure Current Package Cost Before Comparing to Custom Build Cost
- Account for ALL Costs of Custom, Not Just Initial Build
- Set an Exit Threshold Before Adopting a Package

### Related Skills
- Package Fit/Non-Fit Analysis (KU 02)
- Package Escape Hatch Strategy (KU 04)

---

## DT-WNB-002: Fork or Full Custom Build?

### Decision Context
When exit is justified, the team must choose between forking the existing package (maintaining a modified version) and building fully custom from scratch. Forking preserves the package's architecture, documentation, and test suite. Custom building starts from zero. This decision tree evaluates which path is cheaper and safer.

### Decision Criteria
- What percentage of the package still fits? (80%+ → fork candidate)
- Does the package's architecture fundamentally conflict with application needs?
- Is the package actively maintained (can you rebase on upstream releases)?
- What is the estimated cost of fork maintenance vs. custom build?

### Decision Tree

```
Does the package's architecture fundamentally conflict with application needs?
├── YES → FULL CUSTOM BUILD. Forking inherits the architectural problems.
├── NO → What percentage of the package still fits?
    ├── >80% fits → STRONG FORK CANDIDATE. Fork and add the missing 20%.
    ├── 50-80% fits → Is the package actively maintained (releases in last 3 months)?
    │   ├── YES → FORK WITH CAUTION. Budget for rebasing on upstream releases quarterly.
    │   └── NO → FULL CUSTOM BUILD likely better. Maintaining an unmaintained fork is solo maintenance.
    ├── <50% fits → FULL CUSTOM BUILD. The package provides less than half the value.
    │   └── BUT: is any part of the package salvageable?
    │       ├── YES → Extract the useful portion. Don't rebuild it.
    │       └── NO → Full custom from scratch.
```

### Rationale
Forking is the middle path between "use as-is" and "build from scratch." When 80% of a package fits, forking costs ~25% of a full custom build because you preserve: the database schema (if it fits), the public API design, the test suite, the documentation, and community knowledge (StackOverflow answers, blog posts). Custom building loses all of these. However, forking an unmaintained package means you become the sole maintainer — there's no upstream to rebase on. In this case, custom build may be cheaper because you're not bound to an abandoned architecture.

### Recommended Default
**Fork if >80% fits AND the package is actively maintained. Full custom build if <50% fits OR the package's architecture conflicts fundamentally.**

### Risks Of Wrong Choice
- **Forking when <50% fits**: The fork requires massive modifications to the package's architecture. Rebasing on upstream becomes impossible. The fork diverges completely within 6 months.
- **Custom building when >80% fits**: The team rebuilds 80% of standard, well-tested functionality from scratch, wasting months. The new custom system is buggier than the package for the first 12-18 months.

### Related Rules
- Evaluate Fork-Before-Build
- Account for ALL Costs of Custom, Not Just Initial Build

### Related Skills
- Package Escape Hatch Strategy (KU 04)

---

## DT-WNB-003: When Should the Exit Migration Happen?

### Decision Context
Package exit is a project, not a task. Scheduling it during active feature development creates chaos. This decision tree determines the appropriate timing for the migration.

### Decision Criteria
- Is the current package causing active production incidents?
- Is there a hard deadline (package EOL, security CVE, API deprecation)?
- Is the team in an active feature development cycle?
- How long is the estimated migration (weeks)?

### Decision Tree

```
Is the current package causing active production incidents OR has a critical security CVE?
├── YES → EMERGENCY EXIT. Schedule migration immediately. Accept feature delivery impact.
├── NO → Is there a hard deadline (package EOL announced, Stripe API version deprecated)?
    ├── YES → SCHEDULE EXIT BEFORE DEADLINE. Start at least (migration weeks × 1.5) before the deadline.
    │   └── If the gap is too short, implement a temporary bridge solution AND the exit in parallel.
    └── NO → Is the team in an active feature development cycle?
        ├── YES → SCHEDULE EXIT BETWEEN CYCLES. Migration during feature work creates context-switching chaos.
        │   └── In the meantime: use the escape hatch for any new pain points.
        └── NO → SCHEDULE EXIT NOW. The team has capacity. Start the migration.
```

### Rationale
Package migration is cognitively expensive. It requires understanding both the old system (to ensure correct migration) and the new system (to ensure correct implementation). Doing this during active feature development means both the feature and the migration suffer from divided attention. The "between cycles" window is the safest time. Emergency exits (security CVEs, provider API shutdowns) override scheduling considerations.

### Recommended Default
**Schedule exits between feature cycles unless there's an active security incident or hard deadline.** Budget (migration estimate × 1.5) weeks to account for unexpected complexity.

### Risks Of Wrong Choice
- **During feature cycle**: Feature delivery slows, migration quality suffers, team morale drops from context switching.
- **After deadline**: The package EOL passes. The team is running on unsupported software in production. Security vulnerabilities are unpatched.

### Related Rules
- Set an Exit Threshold Before Adopting a Package
- Measure Current Package Cost Before Comparing to Custom Build Cost

### Related Skills
- Package Escape Hatch Strategy (KU 04)

---

## DT-WNB-004: Is This Feature Worth Building Custom, or Should We Keep Package + Escape Hatch?

### Decision Context
A single new requirement emerges that the package doesn't support. The team must choose: build custom for just this feature (keeping the package for everything else), or interpret this as an exit signal. This is the most common decision that teams face — and the most commonly over-escalated.

### Decision Criteria
- Does this feature represent a new core requirement or a one-off edge case?
- What percentage of the package's total usage would this feature represent?
- Can the escape hatch handle this feature cleanly, or would it require fundamental package bypass?
- Is this the first unmet requirement, or the 4th?

### Decision Tree

```
Is this the FIRST requirement the package doesn't support?
├── YES → Is this a one-off edge case or a new core requirement?
│   ├── ONE-OFF EDGE CASE → USE ESCAPE HATCH. Do not exit. Design escape method in adapter.
│   └── NEW CORE REQUIREMENT → Has this requirement changed the package's assumption fit?
│       ├── YES → Re-run fit/non-fit analysis (KU 02) with the new requirement.
│       └── NO → USE ESCAPE HATCH. Monitor for additional unmet requirements.
├── NO (2nd or 3rd unmet requirement) → Do the unmet requirements collectively represent >20% of total usage?
    ├── YES → EXIT SIGNAL. The package's fit is degrading. Trigger exit evaluation (DT-WNB-001).
    └── NO → USE ESCAPE HATCH. But set a hard ceiling: one more unmet requirement → exit evaluation.
```

### Rationale
A single unmet requirement is not an exit signal — it's what the escape hatch is for. The escape hatch exists precisely to handle the 5-15% of flows a package doesn't support while keeping the package for the 85-95% it handles well. Escalating a single gap to "we need to build custom" is the most common over-reaction. The decision thresholds (first gap → escape; second/third → monitor; >20% cumulative → exit) prevent this escalation while catching genuine fit degradation.

### Recommended Default
**Default to escape hatch for the first 1-2 unmet requirements. Only escalate to exit evaluation when cumulative escape usage exceeds 20% or when a core assumption is broken.**

### Risks Of Wrong Choice
- **Over-escalation**: A single edge case triggers a 3-month custom build. The team rebuilds 90% of functionality the package already handled perfectly.
- **Under-escalation**: 5 escape methods have accumulated. 40% of flows use the escape hatch. The team still treats it as "edge cases" rather than acknowledging the package no longer fits.

### Related Rules
- Measure Current Package Cost Before Comparing to Custom Build Cost
- Set an Exit Threshold Before Adopting a Package

### Related Skills
- Package Escape Hatch Strategy (KU 04)
- Package Fit/Non-Fit Analysis (KU 02)
