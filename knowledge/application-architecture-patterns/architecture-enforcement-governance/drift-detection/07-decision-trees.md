# Decision Trees: Drift Detection and Architecture Health

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Architecture Enforcement and Governance
- **Knowledge Unit:** Drift detection and architecture health
- **Knowledge Unit ID:** AEG-08
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Automated drift detection vs manual periodic assessment | Architecture | Drift monitoring approach |
| 2 | Health score (0-100) vs absolute violation counts | Architecture | Metric selection |
| 3 | Threshold alerts (fail CI) vs report-only | Architecture | Drift response strategy |

---

## Decision 1: Automated drift detection vs manual periodic assessment

### Context
Architecture drift — the gap between intended and actual architecture — can be tracked automatically on every CI build or assessed manually every quarter. Automated detection catches drift immediately when it's introduced. Manual assessments only catch it after it's accumulated over weeks or months.

### Decision Tree

```
How is architecture drift detected?
├── Automatically on every CI build
│   → Recommended approach
│   Every commit triggers drift detection:
│   ├── Architecture tests check structural rules
│   ├── Static analysis checks type-level rules
│   └── Drift score is calculated and reported
│   Pros: catches drift immediately, consistent metric, trend tracking
│   Cons: requires automation setup
├── Manually every quarter (or period)
│   → NOT recommended — drift accumulates before detection
│   A developer or architect spends time assessing drift
│   └── What typically happens:
│       ├── Each quarterly assessment finds more drift
│       ├── Violations accumulated incrementally over weeks
│       ├── Each individual violation was small
│       ├── Collectively, architecture has drifted significantly
│       └── Fixing quarter-old drift is much more expensive
└── Not tracked at all
    → Architecture health is entirely subjective
    No data on whether architecture is improving or degrading
    "It feels fine" — until a major refactoring is needed
```

### Rationale
Architecture degrades incrementally, not in big jumps. An unauthorized import here, a bypassed layer there — each change seems small, but over months the architecture becomes unrecognizable. Automated detection on every commit catches each violation when it's introduced and easiest to fix. Manual quarterly assessments find violations that have been accumulating for weeks. By the time they're caught, the cost of fixing is much higher — multiple classes depend on the violated pattern.

### Recommended Default
Automated drift detection on every CI build

### Risks
- Manual assessment: drift accumulates between assessments, expensive fixes
- No tracking: architecture degrades silently, no one notices until too late
- Automated with no baseline: immediate failures on existing violations

### Related Rules
- Track Architecture Drift Automatically On Every Commit (AEG-08/05-rules.md)
- Baseline The Initial Drift Score (AEG-08/05-rules.md)
- Set Threshold Alerts That Fail CI (AEG-08/05-rules.md)

### Related Skills
- Track Architecture Drift and Health (AEG-08/06-skills.md)
- Enforce Architecture Rules in CI (AEG-02/06-skills.md)
- Implement Import Violation Detection (AEG-05/06-skills.md)

---

## Decision 2: Health score (0-100) vs absolute violation counts

### Decision Tree

```
How is architecture health measured?
├── Normalized health score (0-100)
│   → Recommended approach
│   Score factors:
│   ├── Violations per 1,000 lines of code
│   ├── Violation severity weighting (critical > low)
│   ├── Codebase size normalization
│   └── Score = 100 - (weighted violations / codebase size * factor)
│   Benefits:
│   ├── Consistent over time — accounts for codebase growth
│   ├── Easy to trend — "92 this month, up from 90 last month"
│   └── Comparable across contexts — same metric everywhere
├── Absolute violation counts
│   → Simple but misleading
│   "We have 15 violations" — but is that good or bad?
│   └── Problems:
│       ├── 15 violations in 10,000 LOC vs 500,000 LOC — very different
│       ├── Count naturally increases as codebase grows
│       ├── Score can decrease simply because less code is written
│       └── Doesn't account for severity: 15 naming violations ≠ 15 circular deps
└── No metric at all
    → Architecture health is qualitative
    "The architecture feels okay" is the measurement
    No data to support decisions
```

### Rationale
Absolute violation counts are misleading because they don't account for codebase size. A codebase growing from 50,000 to 100,000 lines will naturally accumulate more violations — but the architecture may actually be improving relative to its size. A normalized health score (0-100) accounts for codebase growth and provides a consistent metric over time. A score of 95 means "this codebase follows 95% of the intended architecture," which is actionable and comparable across sprints.

### Recommended Default
Normalized health score (0-100) with violation details

### Risks
- Absolute counts: misleading trends, no size normalization
- Normalized score with no details: "score is 75" — but what's wrong?
- Perfect score obsession: fixing low-impact violations to inflate the score

### Related Rules
- Use Health Score Over Absolute Violation Counts (AEG-08/05-rules.md)
- Attach Specific Violation Details To The Score (AEG-08/05-rules.md)
- Focus On High-Impact Violations (AEG-08/05-rules.md)

### Related Skills
- Track Architecture Drift and Health (AEG-08/06-skills.md)
- Implement Refactoring Remediation (AEG-09/06-skills.md)
- Enforce Architecture Rules in CI (AEG-02/06-skills.md)

---

## Decision 3: Threshold alerts (fail CI) vs report-only

### Decision Tree

```
What happens when drift exceeds the acceptable threshold?
├── CI fails — pipeline blocked
│   → Hard enforcement
│   When health score drops below threshold (e.g., score < 80):
│   └── CI is blocked — violations must be addressed
│   └── When to use:
│       ├── Critical violations (broken isolation, circular deps)
│       │   These must never regress — hard threshold
│       └── General drift budget
│           └── Is the team disciplined enough to self-correct?
│               ├── YES → Soft threshold may work
│               └── NO → Hard threshold required
│   └── Risks:
│       ├── Too strict: blocks all development on brownfield
│       ├── Ignored: tests are bypassed or removed
│       └── Mitigation: baseline + gradient over time
├── Report only — CI passes, drift is reported
│   → Soft enforcement
│   Drift score is reported in CI output:
│   └── "Health score: 82/100 (5% above last week)"
│   └── No pipeline blockage — team should address drift
│   └── When to use:
│       ├── Tracking-only metrics (not yet ready for hard threshold)
│       ├── Non-critical violations (naming inconsistencies)
│       └── Initial monitoring phase before setting threshold
└── Not reported at all
    → No drift awareness
    Violations accumulate without anyone knowing
    Architecture health is a mystery
```

### Rationale
Hard thresholds (CI fails) are necessary for critical architectural violations. Soft thresholds (report only) are useful for non-critical violations and during the initial monitoring phase when a baseline is being established. The transition from soft to hard should be gradual: start with reporting, set a baseline, then introduce a hard threshold that tightens over time. The key is to balance enforcement with practicality — blocking CI for every naming violation is counterproductive, but blocking CI for context isolation violations is essential.

### Recommended Default
Hard threshold for critical violations; soft threshold for non-critical, tighten over time

### Risks
- Too strict: developers disable or bypass the enforcement
- Too soft: drift reports ignored, architecture degrades
- No differentiation: critical and non-critical violations treated the same

### Related Rules
- Set Threshold Alerts That Fail CI (AEG-08/05-rules.md)
- Baseline The Initial Drift Score (AEG-08/05-rules.md)
- Track Drift Reduction As Backlog Items (AEG-08/05-rules.md)

### Related Skills
- Track Architecture Drift and Health (AEG-08/06-skills.md)
- Enforce Architecture Rules in CI (AEG-02/06-skills.md)
- Remediate Architectural Violations (AEG-09/06-skills.md)
