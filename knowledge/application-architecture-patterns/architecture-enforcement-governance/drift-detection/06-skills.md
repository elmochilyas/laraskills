# Skill: Track Architecture Drift and Health

## Purpose
Track architecture drift automatically on every commit. Use a health score (0-100) over absolute violation counts. Set threshold alerts that fail CI when drift exceeds budget. Baseline the initial drift score when starting monitoring. Attach specific violation details to the score. Track drift reduction as backlog items. Focus on high-impact violations over perfect scores. Never use drift metrics for blame.

## When To Use
- Long-lived projects with multiple contexts
- Teams that want to quantify architectural quality

## When NOT To Use
- Small projects with no cross-context boundaries
- Prototypes where architecture is intentionally fluid

## Prerequisites
- Import violation detection (AEG-05)
- Architecture testing (AEG-01)

## Inputs
- Architecture test results
- CI pipeline

## Workflow
1. **Track architecture drift automatically on every commit.** Automated detection runs on every CI build and reports the health score. Catches drift the moment it is introduced.

2. **Use health score (0-100) over absolute violation counts.** A normalized score accounts for codebase size changes. A score graph gives immediate feedback about whether architecture is improving or degrading.

3. **Set threshold alerts that fail CI when drift exceeds budget.** Configure CI to fail when the drift score exceeds a configurable threshold. An alert that blocks the pipeline forces the team to address drift.

4. **Baseline the initial drift score when starting monitoring.** Record the initial score. Require that the score does not decrease below the baseline. Prevents shock of strict thresholds on existing violations.

5. **Attach specific violation details to the drift score.** Always report which violations caused the score. A score without details is not actionable.

6. **Track drift reduction as backlog items.** Specific drift reduction tasks with priority and estimation. Amorphous "improve architecture" goals are deferred indefinitely.

7. **Focus on reducing high-impact violations over perfect scores.** Prioritize broken context isolation and circular dependencies over naming inconsistencies. Not all violations are equal.

8. **Never use drift metrics for blame.** Use for planning and prioritization, not individual performance evaluation.

## Validation Checklist
- [ ] Automated drift detection runs on every commit
- [ ] Health score (0-100) is tracked over time
- [ ] Threshold alerts trigger CI failure when drift exceeds budget
- [ ] Violation details are reported alongside the score
- [ ] Drift reduction items exist in the backlog
- [ ] Baseline recorded at start of monitoring
- [ ] Score graph is visible to the team

## Common Failures
- **No drift monitoring.** Architecture degrades incrementally — each violation seems small.
- **Perfect score obsession.** Fixing low-impact violations to inflate score while ignoring critical ones.
- **Drift score without context.** Score is meaningless without knowing what caused it.

## Decision Points
- **Health score vs violation count?** Normalized health score (0-100) over absolute counts — accounts for codebase growth.

## Performance Considerations
- Drift detection runs in CI (seconds). No production impact.

## Security Considerations
- Drift metrics can reveal weak areas. Use for planning, not blame.

## Related Rules
- Rule: Track Drift Automatically On Every Commit (AEG-08/05-rules.md)
- Rule: Use Health Score Over Absolute Violation Counts (AEG-08/05-rules.md)
- Rule: Set Threshold Alerts That Fail CI (AEG-08/05-rules.md)
- Rule: Baseline The Initial Drift Score (AEG-08/05-rules.md)
- Rule: Attach Specific Violation Details To The Score (AEG-08/05-rules.md)
- Rule: Track Drift Reduction As Backlog Items (AEG-08/05-rules.md)
- Rule: Focus On High-Impact Violations (AEG-08/05-rules.md)
- Rule: Never Use Drift Metrics For Blame (AEG-08/05-rules.md)

## Related Skills
- Implement Import Violation Detection (AEG-05/06-skills.md)
- Enforce Architecture Rules in CI (AEG-02/06-skills.md)
- Implement Refactoring Remediation (AEG-09/06-skills.md)

## Success Criteria
- Automated drift detection runs on every CI build with a normalized health score (0-100).
- A baseline score is recorded; CI fails if drift exceeds the configured budget.
- Drift reports include specific violation details — not just a number.
- Drift reduction is tracked as specific backlog items with priority and estimation.
- High-impact violations (context isolation, circular deps) are fixed before low-impact items.
- Drift metrics are used for planning, not individual blame.
