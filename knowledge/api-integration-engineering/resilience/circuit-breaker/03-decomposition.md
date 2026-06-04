# Decomposition: Circuit Breaker Pattern (3 States, Failure Thresholds, Half-Open Probes)

## Topic Overview
The circuit breaker pattern prevents cascading failures by detecting when an external service is degraded and failing fast instead of waiting for timeouts. It operates in three states: Closed (normal operation, failures counted), Open (rejecting requests immediately to protect resources), and Half-Open (probing for recovery). The pattern is essential for production API integrations to prevent resource exhaustion and maintain system responsiveness during upstream outages.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k007-circuit-breaker/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Circuit Breaker Pattern (3 States, Failure Thresholds, Half-Open Probes)
- **Purpose:** The circuit breaker pattern prevents cascading failures by detecting when an external service is degraded and failing fast instead of waiting for timeouts. It operates in three states: Closed (normal operation, failures counted), Open (rejecting requests immediately to protect resources), and Half-Open (probing for recovery). The pattern is essential for production API integrations to prevent resource exhaustion and maintain system responsiveness during upstream outages.
- **Difficulty:** Intermediate
- **Dependencies:** K005, K024, K008, K028, K007

## Dependency Graph
**Depends on:**
- K005
- K024
- K008
- K028
- K007

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Closed State
- Open State
- Half-Open State
- Failure Threshold
- Reset Timeout
- Failure Counting Window

**Out of scope:**
- K005 topics covered in their respective KUs
- K024 topics covered in their respective KUs
- K008 topics covered in their respective KUs
- K028 topics covered in their respective KUs
- K007 topics covered in their respective KUs

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