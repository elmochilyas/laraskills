# Decomposition: LLM Router Circuit Breaker

## Topic Overview
The LLM Router Circuit Breaker pattern provides PHP-side failover chains for AI provider calls, automatically detecting provider failures, rate limits, and timeouts before falling back to alternative providers or models. It implements the circuit breaker pattern adapted for LLM-specific failure modes â€” provider outages, token limits, content moderation blocks â€” ensuring AI feature availability even when primary providers are degraded.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-03-llm-router-circuit-breaker/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### LLM Router Circuit Breaker
- **Purpose:** The LLM Router Circuit Breaker pattern provides PHP-side failover chains for AI provider calls, automatically detecting provider failures, rate limits, and timeouts before falling back to alternative providers or models. It implements the circuit breaker pattern adapted for LLM-specific failure modes â€” provider outages, token limits, content moderation blocks â€” ensuring AI feature availability even when primary providers are degraded.
- **Difficulty:** Advanced
- **Dependencies:** KU-002, KU-004, KU-013, KU-005, KU-022

## Dependency Graph
**Depends on:**
- KU-002
- KU-004
- KU-013
- KU-005
- KU-022

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Circuit breaker
- Failover chain
- Failure detection
- Provider health score
- Model cascade
- Budgets and cost-aware routing

**Out of scope:**
- KU-002 topics covered in their respective KUs
- KU-004 topics covered in their respective KUs
- KU-013 topics covered in their respective KUs
- KU-005 topics covered in their respective KUs
- KU-022 topics covered in their respective KUs

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