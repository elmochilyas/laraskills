# Decomposition: Retry Strategies (Fixed, Exponential, Jitter)

## Topic Overview
Retry strategies define how and when failed API requests are retried. The three fundamental strategiesâ€”fixed interval, exponential backoff, and exponential with jitterâ€”balance delivery reliability against upstream resource protection. Fixed interval is simplest, exponential backoff is the industry standard, and jitter prevents thundering herd problems in distributed systems. Proper retry strategies are essential for building resilient API integrations that handle transient failures gracefully.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k005-retry-strategies/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Retry Strategies (Fixed, Exponential, Jitter)
- **Purpose:** Retry strategies define how and when failed API requests are retried. The three fundamental strategiesâ€”fixed interval, exponential backoff, and exponential with jitterâ€”balance delivery reliability against upstream resource protection. Fixed interval is simplest, exponential backoff is the industry standard, and jitter prevents thundering herd problems in distributed systems. Proper retry strategies are essential for building resilient API integrations that handle transient failures gracefully.
- **Difficulty:** Intermediate
- **Dependencies:** K007, K008, K006, K019, K024

## Dependency Graph
**Depends on:**
- K007
- K008
- K006
- K019
- K024

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Retryable Errors
- Non-Retryable Errors
- Max Attempts
- Backoff
- Jitter
- Retry Budget

**Out of scope:**
- K007 topics covered in their respective KUs
- K008 topics covered in their respective KUs
- K006 topics covered in their respective KUs
- K019 topics covered in their respective KUs
- K024 topics covered in their respective KUs

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