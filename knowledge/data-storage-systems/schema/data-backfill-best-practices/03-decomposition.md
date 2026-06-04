# Decomposition: 11.9 Data backfill best practices (batch size, rate limiting, progress tracking)

## Topic Overview
Data backfill fills new columns/tables with data from existing structures. Backfill best practices: batch processing (100-1000 rows per batch), rate limiting (sleep between batches to reduce load), progress tracking (process X of N rows), error handling (retry per batch, skip bad rows), and verification (compare counts between old and new).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
11-9-data-backfill-best-practices/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 11.9 Data backfill best practices (batch size, rate limiting, progress tracking)
- **Purpose:** Data backfill fills new columns/tables with data from existing structures. Backfill best practices: batch processing (100-1000 rows per batch), rate limiting (sleep between batches to reduce load), progress tracking (process X of N rows), error handling (retry per batch, skip bad rows), and verification (compare counts between old and new).
- **Difficulty:** Advanced
- **Dependencies:** 11.6 Expand-contract, 11.10 Verification during migrations

## Dependency Graph
**Depends on:** "11.6 Expand-contract", "11.10 Verification during migrations"

**Depended on by:** More advanced KUs in Production Schema Operations and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Batch size**: 500-1000 rows per batch for general use. Smaller (100) for write-heavy tables. Larger (5000) for archival.; - **Rate limiting**: `usleep(100_000)` (100ms) between batches. Adjust based on replication lag and CPU impact.; - **Progress tracking**: Store last processed ID in a `backfill_progress` table. Enables resume after failure.; - **Verification**: Compare `COUNT(*)`, hash aggregates (`MD5(GROUP_CONCAT(...))`), or sample comparisons..
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