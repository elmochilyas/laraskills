# Decomposition: Provider Failover & Circuit Breaker

## Topic Overview
Provider failover ensures AI availability by switching between providers when the primary is degraded. The Laravel AI SDK supports multi-provider arrays where the SDK tries providers sequentially until one succeeds. For advanced circuit breaker patterns, the `illuma-law/laravel-llm-router` package provides configurable failure thresholds, health checks, and automatic recovery.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-04-provider-failover-circuit-breaker/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Provider Failover & Circuit Breaker
- **Purpose:** Provider failover ensures AI availability by switching between providers when the primary is degraded. The Laravel AI SDK supports multi-provider arrays where the SDK tries providers sequentially until one succeeds. For advanced circuit breaker patterns, the `illuma-law/laravel-llm-router` package provides configurable failure thresholds, health checks, and automatic recovery.
- **Difficulty:** Advanced
- **Dependencies:** KU-002, KU-003, KU-010, KU-030

## Dependency Graph
**Depends on:**
- KU-002
- KU-003
- KU-010
- KU-030

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Failover chain
- Circuit breaker
- Health check
- Fallback logic
- Provider array syntax

**Out of scope:**
- KU-002 topics covered in their respective KUs
- KU-003 topics covered in their respective KUs
- KU-010 topics covered in their respective KUs
- KU-030 topics covered in their respective KUs

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