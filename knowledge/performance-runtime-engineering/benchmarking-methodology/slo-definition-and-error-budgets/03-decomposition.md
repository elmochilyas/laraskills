# Decomposition: Slo Definition And Error Budgets

## Topic Overview
Service Level Objectives (SLOs) define acceptable performance in user-facing terms. **p50 SLO** targets typical experience (e.g., p50 < 200ms for API). **p95 SLO** targets slow-but-tolerable (p95 < 500ms). **p99 SLO** targets worst-case acceptable (p99 < 2000ms). **Error budget** = 100% - SLO attainment. Budget burn rate controls deployment velocity — high burn rate (approaching SLO violation) gates deployments.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
benchmarking-methodology/slo-definition-and-error-budgets/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Slo Definition And Error Budgets
- **Purpose:** Service Level Objectives (SLOs) define acceptable performance in user-facing terms. **p50 SLO** targets typical experience (e.g., p50 < 200ms for API). **p95 SLO** targets slow-but-tolerable (p95 < 500ms). **p99 SLO** targets worst-case acceptable (p99 < 2000ms). **Error budget** = 100% - SLO attainment. Budget burn rate controls deployment velocity — high burn rate (approaching SLO violation) gates deployments.
- **Difficulty:** Foundation
- **Dependencies:
  - --

## Dependency Graph
**Depends on:**
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Budget-aware deployment
  - Setting SLO targets without measuring baseline
  - Thermometer model
  - Iterative benchmarking protocol

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization