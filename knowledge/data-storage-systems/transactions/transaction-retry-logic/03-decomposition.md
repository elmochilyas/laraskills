# Decomposition: 9.20 Transaction retry logic (handling serialization failures in application code)

## Topic Overview
Serialization failures (deadlock, SSI conflict, lock wait timeout) require transaction retry. Laravel's `DB::transaction()` does NOT automatically retry. Implement retry wrapper: catch error codes (1213/40001), wait with exponential backoff, retry up to N times.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
9-20-transaction-retry-logic/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 9.20 Transaction retry logic (handling serialization failures in application code)
- **Purpose:** Serialization failures (deadlock, SSI conflict, lock wait timeout) require transaction retry. Laravel's `DB::transaction()` does NOT automatically retry.
- **Difficulty:** Advanced
- **Dependencies:** 9.8 Deadlock detection, 9.11 Transaction scoping

## Dependency Graph
**Depends on:** "9.8 Deadlock detection", "9.11 Transaction scoping"

**Depended on by:** More advanced KUs in Transaction Management & Concurrency and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Retryable errors**: MySQL deadlock (1213), PostgreSQL serialization_failure (40001), lock wait timeout (1205). These don't indicate data corruption — just timing.; - **Retry with backoff**: 3 attempts, wait 100ms, 200ms, 400ms. Random jitter (±20ms) prevents all retries firing simultaneously.; - **Non-retryable errors**: Syntax error, constraint violation, FK error. These will fail on every retry. Do not retry..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization