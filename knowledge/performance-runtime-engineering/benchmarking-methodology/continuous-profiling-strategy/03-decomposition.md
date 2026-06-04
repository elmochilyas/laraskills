# Decomposition: Continuous Profiling Strategy

## Topic Overview
**Continuous profiling** runs lightweight sampling (1-5 Hz) on all production hosts to establish baseline behavior. When an SLO breach is detected, sampling rate increases to 50-100 Hz (burst mode) on affected hosts to capture detailed diagnostic data. This approach minimizes profiling overhead during normal operation while providing rich data during incidents.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
benchmarking-methodology/continuous-profiling-strategy/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Continuous Profiling Strategy
- **Purpose:** **Continuous profiling** runs lightweight sampling (1-5 Hz) on all production hosts to establish baseline behavior. When an SLO breach is detected, sampling rate increases to 50-100 Hz (burst mode) on affected hosts to capture detailed diagnostic data. This approach minimizes profiling overhead during normal operation while providing rich data during incidents.
- **Difficulty:** Foundation
- **Dependencies:
  - Driven Analysis
  - --

## Dependency Graph
**Depends on:**
  - Driven Analysis
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Continuous profiling
  - Adaptive sampling
  - Running high-frequency profiling continuously
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