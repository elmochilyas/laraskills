# Decomposition: 2.23 chunk/chunkById/lazy/lazyById cursor processing

## Topic Overview
Large dataset processing requires memory-efficient iteration strategies. `chunk`, `chunkById`, `cursor`, `lazy`, and `lazyById` provide different approaches to processing thousands to millions of Eloquent models without exhausting memory. Each has different memory profiles, stability characteristics, and use cases.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-23-chunk-chunk-by-id-cursor-lazy/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.23 chunk/chunkById/lazy/lazyById cursor processing
- **Purpose:** Large dataset processing requires memory-efficient iteration strategies. `chunk`, `chunkById`, `cursor`, `lazy`, and `lazyById` provide different approaches to processing thousands to millions of Eloquent models without exhausting memory.
- **Difficulty:** Advanced
- **Dependencies:** 1.19 Data backfill strategies, 4.19 chunk method tradeoffs, 4.20 Memory optimization

## Dependency Graph
**Depends on:** "1.19 Data backfill strategies", "4.19 chunk method tradeoffs", "4.20 Memory optimization"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **chunk($count, $callback)**: Loads $count models per chunk using OFFSET-based pagination. Risk: rows can be skipped or duplicated if modified during iteration.; - **chunkById($count, $callback)**: Uses a stable, ordered key (PK) for pagination. Safer than chunk because it doesn't rely on OFFSET.; - **cursor()**: PHP Generator that yields one model at a time from the database cursor. Lowest memory usage but holds the connection open.; - **lazy()**: Returns a LazyCollection. Like cursor but with collection methods.; - **lazyById()**: LazyCollection with stable key-based ordering (like chunkById)..
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