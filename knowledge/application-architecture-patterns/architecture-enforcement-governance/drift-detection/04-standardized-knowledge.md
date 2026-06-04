# Metadata

Domain: Application Architecture Patterns
Subdomain: Architecture Enforcement and Governance
Knowledge Unit: Drift detection and architecture health
Knowledge Unit ID: AEG-08
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Drift detection monitors how much the actual codebase deviates from the intended architecture. It produces a health metric — a percentage or score — that tracks drift over time. Drift sources: unauthorized imports, missing contracts, bypassed layers, and undocumented dependencies. Drift detection runs on every CI build and reports the health score. A declining score triggers an architecture review. Positive drift (code getting closer to the architecture) is rewarded.

---

# Core Concepts

- **Architecture drift:** The gap between the intended architecture (documented rules) and the actual codebase. Measured as a drift score.
- **Baseline:** The initial drift score when monitoring started. New code must not increase the drift. Existing drift is tracked and reduced over time.
- **Drift budget:** An acceptable amount of drift that the team tolerates. Code that increases drift beyond the budget is flagged.
- **Health score:** A normalized score (0-100) tracking how well the codebase follows the architecture. Higher is better.

---

# When To Use

- Long-lived projects with multiple contexts.
- Teams that want to quantify architectural quality.

---

# When NOT To Use

- Small projects with no cross-context boundaries.
- Prototypes where architecture is intentionally fluid.

---

# Best Practices

- **Track drift automatically.** WHY: Manual assessments are inconsistent. Automated drift detection runs on every commit and provides consistent metrics. No human judgment is needed for each measurement.
- **Use health score over exact counts.** WHY: A normalized score (0-100) is easier to track over time than absolute violation counts. Scores account for codebase size. A health score graph gives immediate feedback.
- **Set threshold alerts.** WHY: When drift exceeds a configurable threshold, CI fails. The team must address the drift before further work. Prevents gradual erosion.
- **Track drift reduction as backlog items.** WHY: Track drift reduction as technical debt items in the backlog. Allocate time per sprint to reduce drift. Positive drift (score improving) is rewarded.

---

# Architecture Guidelines

- Drift score: 0-100, higher is better.
- Sources: import violations, missing contracts, layer bypassing.
- Baseline at start of monitoring.
- Drift budget per sprint.
- Threshold alerts in CI.
- Drift dashboard or CI output.
- Drift reduction as backlog items.

---

# Performance Considerations

- Drift detection runs in CI (seconds). No production impact.

---

# Security Considerations

- Drift metrics can reveal which areas of the architecture are weakest. Use for planning, not blame.

---

# Common Mistakes

1. **No drift monitoring:** Architecture degrades incrementally. Cause: not tracking. Consequence: each violation seems small, but over a year, the architecture is unrecognizable. Better: automated drift detection.

2. **Perfect score obsession:** Chasing a 100/100 score. Cause: metric fixation. Consequence: not all violations are equal — some are low-risk and acceptable. Better: focus on reducing high-impact violations.

3. **Drift score without context:** A score of 75 is meaningless without knowing what caused it. Cause: metric without detail. Consequence: team can't act on the score. Better: attach specific violation details to the score.

---

# Anti-Patterns

- **No measurement**: Architecture health is entirely subjective. "It feels fine."
- **Gaming the score**: Fixing easy low-impact violations to improve score while ignoring critical ones.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| AEG-05 Import violation detection | AEG-02 CI enforcement | AEG-09 Refactoring remediation |
| AEG-01 Architecture testing | AEG-03 Static analysis rules | AEG-10 Onboarding docs |

---

# AI Agent Notes

- Automate drift detection on every commit.
- Use health score (0-100) with violation details.
- Set drift budget and threshold alerts.
- Track drift reduction as backlog items.

---

# Verification

- [ ] Automated drift detection runs on every commit
- [ ] Health score (0-100) is tracked over time
- [ ] Threshold alerts trigger CI failure when drift exceeds budget
- [ ] Violation details are reported alongside the score
- [ ] Drift reduction items exist in the backlog
- [ ] Score graph is visible to the team
