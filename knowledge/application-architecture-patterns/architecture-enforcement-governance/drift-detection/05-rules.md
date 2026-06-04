# Rule: Track Architecture Drift Automatically On Every Commit
---
## Category
Architecture | Reliability
---
## Rule
Always track architecture drift automatically on every CI build rather than relying on manual periodic assessments.
---
## Reason
Manual drift assessments are inconsistent and infrequent. By the time a manual assessment finds drift, the architecture may have degraded significantly. Automated detection on every commit catches drift the moment it is introduced.
---
## Bad Example
Architecture drift is assessed manually every quarter. In Q1, drift is at 5%. By Q3, it is at 30%. The violations accumulated incrementally, each one small, but the quarterly assessment missed the trend.
---
## Good Example
```yaml
jobs:
  drift-detection:
    runs-on: ubuntu-latest
    steps:
      - run: vendor/bin/pest --arch --drift-report=drift.json
      - run: php scripts/calculate-health-score.php drift.json
```
---
## Exceptions
Prototype branches where architecture is intentionally fluid. Production and main branches must always track drift.
---
## Consequences Of Violation
Architecture degrades incrementally and unnoticed. Each violation is small, but cumulatively the architecture becomes unrecognizable over months.

---
# Rule: Use Health Score (0-100) Over Absolute Violation Counts
---
## Category
Architecture | Maintainability
---
## Rule
Track architecture health as a normalized score (0-100) rather than absolute violation counts to account for codebase size changes.
---
## Reason
Absolute violation counts increase naturally as the codebase grows. A score normalized to codebase size provides a consistent metric over time. A score graph gives immediate feedback about whether the architecture is improving or degrading relative to codebase scale.
---
## Bad Example
"15 architecture violations exist" — ambiguous. Does that mean 15 violations in a 10,000-line codebase (bad) or 15 violations in a 500,000-line codebase (good)? No context for comparison.
---
## Good Example
"Architecture health score: 92/100 — 2 points higher than last month, 5% fewer violations per 1,000 lines of code."
---
## Exceptions
None. Normalized scores are always preferred to raw counts.
---
## Consequences Of Violation
The team cannot tell if architecture is improving or degrading relative to codebase growth. Raw counts mislead — a decreasing count may simply mean less code is being written.

---
# Rule: Set Threshold Alerts That Fail CI When Drift Exceeds Budget
---
## Category
Architecture | Reliability
---
## Rule
Configure CI to fail when the architecture drift score exceeds a configurable threshold. Never rely on manual review of drift reports.
---
## Reason
A drift report that does not fail CI is noise. Developers ignore noise. An alert that blocks the pipeline forces the team to address the drift before continuing.
---
## Bad Example
Drift reports are generated but CI never fails based on them. Developers see the report, note the increasing drift, and continue working. The drift grows unchecked.
---
## Good Example
```yaml
- run: php scripts/check-drift-threshold.php --threshold=20 --drift-report=drift.json
  env:
    FAIL_THRESHOLD: 20 # If drift > 20%, CI fails
```
---
## Exceptions
During intentional refactoring sprints where drift may temporarily increase before decreasing. Document the expected drift increase and timeline.
---
## Consequences Of Violation
Drift grows unchecked until a manual review catches it. By then, the remediation effort is significantly larger.

---
# Rule: Baseline The Initial Drift Score When Starting Monitoring
---
## Category
Architecture | Maintainability
---
## Rule
Always record the initial drift score as a baseline when starting drift monitoring. Require that the score does not decrease below the baseline.
---
## Reason
Without a baseline, there is no reference point for whether the architecture is improving or degrading. The baseline also prevents the shock of applying a strict threshold to a codebase that already has significant drift.
---
## Bad Example
Drift monitoring starts with a threshold of zero violations on a codebase that has 50 existing violations. Every CI build fails immediately. The team disables monitoring.
---
## Good Example
```
Baseline recorded: 2026-01-15
- Drift score: 72/100
- Violations: 23 (0.8 per 1000 LOC)
- Threshold: drift must not exceed baseline + 5%
- Target: 85/100 by Q3 2026
```
---
## Exceptions
Greenfield projects starting from zero. The baseline is 100/100 from day one.
---
## Consequences Of Violation
An unreasonable threshold is applied retroactively. Drift monitoring is rejected by the team. No drift tracking occurs.

---
# Rule: Attach Specific Violation Details To The Drift Score
---
## Category
Architecture | Maintainability
---
## Rule
Always report specific violation details alongside the drift score. Never present a score without the underlying violations that caused it.
---
## Reason
A score of 75/100 is meaningless without context. The team cannot act on a number. Attaching specific violations ("5 unauthorized imports, 2 missing contracts, 1 layer bypass") tells the team what to fix.
---
## Bad Example
```
Architecture Health Score: 73/100
```
The team knows they are failing but not why. No actionable information.
---
## Good Example
```
Architecture Health Score: 73/100
Violations:
  - 5 unauthorized cross-context imports (Checkout → Inventory)
  - 2 repositories missing contracts
  - 1 controller directly using Eloquent model
Recommendation: Fix unauthorized imports first (highest impact on score).
```
---
## Exceptions
None. A score without details is not actionable.
---
## Consequences Of Violation
The team cannot act on the score. The drift metric becomes a vanity number that everyone looks at but no one acts on.

---
# Rule: Track Drift Reduction As Backlog Items
---
## Category
Architecture | Maintainability
---
## Rule
Always track specific drift reduction tasks as backlog items with priority and estimation. Never treat drift reduction as an amorphous "improve architecture" goal.
---
## Reason
Backlogged tasks with estimates and priorities get done. Amorphous goals are deferred indefinitely. Specific backlog items ("Fix 5 unauthorized imports in Checkout context" → 3 story points) are actionable and trackable.
---
## Bad Example
The team has a backlog item: "Improve architecture." No one knows what to do, how to start, or when it is done. The item sits in the backlog for months.
---
## Good Example
```
Backlog Items (Sprint 12):
1. Fix Checkout→Inventory import violations (5 violations, 3 pts)
2. Add RepositoryInterface to OrderRepository (1 violation, 1 pt)
3. Extract model usage from DashboardController (1 violation, 2 pts)
Total drift reduction: 7 violations → +4 health score points
```
---
## Exceptions
None. Treating drift reduction as specific tasks is the only effective approach.
---
## Consequences Of Violation
Drift reduction is deferred. Violations accumulate. The architecture health score continues to decline without any actionable plan.

---
# Rule: Focus On Reducing High-Impact Violations Over Perfect Scores
---
## Category
Architecture | Maintainability
---
## Rule
Prioritize fixing high-impact violations (broken context isolation, circular dependencies) over low-impact violations (naming inconsistencies). Do not chase a perfect 100/100 score.
---
## Reason
Not all violations are equal. A naming violation has minimal impact on maintainability. A broken context boundary has significant impact. Fixing low-impact violations to inflate the score wastes effort that should address real architectural problems.
---
## Bad Example
The team spends two sprints renaming classes to match conventions (health score from 85 to 88) while an unauthorized cross-context dependency remains unfixed (would have scored 92 if fixed).
---
## Good Example
```
Violation Priority:
1. CRITICAL: Checkout→Inventory import (score impact: -8)
2. HIGH: Missing RepositoryInterface on UserRepo (score impact: -3)
3. LOW: Controller naming inconsistency - "OrderCtrl" (score impact: -1)
Fix order: Critical first, then high, ignore low until cleanup sprint.
```
---
## Exceptions
When low-impact violations are trivially fixable (rename one file, 2-minute fix). Fix them during walkthroughs.
---
## Consequences Of Violation
The team chases an arbitrary score while real architectural problems persist. Effort is misallocated to cosmetic improvements.

---
# Rule: Never Use Drift Metrics For Blame
---
## Category
Architecture | Reliability
---
## Rule
Use drift metrics for planning and prioritization, not for individual performance evaluation or developer blame.
---
## Reason
Drift metrics reflect the codebase state, not individual performance. Using them for blame creates perverse incentives: developers game the score, hide violations, or resist adding new architecture tests. The metric becomes untrustworthy.
---
## Bad Example
A developer is told their PR caused the drift score to drop by 2 points. The developer starts avoiding adding any new classes to "keep the score stable" even when new classes are architecturally correct.
---
## Good Example
```
Retrospective discussion:
"The drift score dropped 2 points this sprint. Three unauthorized imports
were introduced. Let's review why and whether we need to update the
dependency map or add IDE warnings to prevent this."
Focus: systemic improvement, not individual blame.
```
---
## Exceptions
None. Drift metrics are team-level planning tools.
---
## Consequences Of Violation
Developers game the metrics. Violations are hidden. Architecture tests are avoided to prevent "score drops." The drift metric loses its value as a diagnostic tool.
