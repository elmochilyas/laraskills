# Decomposition: Workload Benefit Assessment

## Topic Overview
JIT benefit is primarily determined by the **CPU-bound proportion of the request lifecycle**. Applications spending >50% of time in PHP execution benefit significantly (61-95% throughput gain). Applications spending >80% waiting on I/O (database, network, disk) see minimal gain (0-5%). The industry rule: benchmark before enabling, don't assume.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
jit-compilation/workload-benefit-assessment/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Workload Benefit Assessment
- **Purpose:** JIT benefit is primarily determined by the **CPU-bound proportion of the request lifecycle**. Applications spending >50% of time in PHP execution benefit significantly (61-95% throughput gain). Applications spending >80% waiting on I/O (database, network, disk) see minimal gain (0-5%). The industry rule: benchmark before enabling, don't assume.
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
  - JIT assessment checklist
  - Interpreter vs translator model
  - Profile-then-enable

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