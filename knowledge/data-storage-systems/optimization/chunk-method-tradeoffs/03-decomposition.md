# Decomposition: 4.19 chunk vs chunkById vs cursor vs lazy vs lazyById tradeoffs

## Topic Overview
Each iteration method has different memory profiles and stability characteristics: `chunk` (offset-based, unstable), `chunkById` (key-based, stable), `cursor` (single query, stream, holds connection), `lazy` (LazyCollection, holds connection), `lazyById` (LazyCollection + key-based, holds connection). Choose based on data stability, connection duration tolerance, and memory constraints.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-19-chunk-method-tradeoffs/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.19 chunk vs chunkById vs cursor vs lazy vs lazyById tradeoffs
- **Purpose:** Each iteration method has different memory profiles and stability characteristics: `chunk` (offset-based, unstable), `chunkById` (key-based, stable), `cursor` (single query, stream, holds connection), `lazy` (LazyCollection, holds connection), `lazyById` (LazyCollection + key-based, holds connection). Choose based on data stability, connection duration tolerance, and memory constraints.
- **Difficulty:** Advanced
- **Dependencies:** 2.23 chunk/chunkById/cursor/lazy, 4.20 Memory optimization

## Dependency Graph
**Depends on:** "2.23 chunk/chunkById/cursor/lazy", "4.20 Memory optimization"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **chunk**: Uses OFFSET internally. Rows can be skipped/duplicated if modified between chunks.; - **chunkById**: Uses `WHERE id > ? ORDER BY id LIMIT ?`. Stable — no skipped/duplicated rows.; - **cursor**: Single query, PHP generator, yields one row at a time. Low memory, holds connection.; - **lazy**: LazyCollection wrapping cursor. Supports collection methods (map, filter).; - **lazyById**: LazyCollection with key-based ordering..
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