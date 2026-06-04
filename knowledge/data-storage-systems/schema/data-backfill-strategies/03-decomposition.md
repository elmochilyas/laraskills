# Decomposition: 1.19 Data backfill strategies (chunked, queued, low-priority, throttled)

## Topic Overview
Data backfill populates existing rows with values for newly added columns or tables. On large tables, a single UPDATE blocks replication, holds locks, and may time out. Production backfill strategies use chunked processing, queued jobs, throttled execution, and idempotent operations to migrate data safely under live traffic.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-19-data-backfill-strategies/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.19 Data backfill strategies (chunked, queued, low-priority, throttled)
- **Purpose:** Data backfill populates existing rows with values for newly added columns or tables. On large tables, a single UPDATE blocks replication, holds locks, and may time out.
- **Difficulty:** Advanced
- **Dependencies:** 1.18 Expand-contract pattern, 4.19 chunk/chunkById/cursor/lazy tradeoffs

## Dependency Graph
**Depends on:** "1.18 Expand-contract pattern", "4.19 chunk/chunkById/cursor/lazy tradeoffs"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **chunkById**: Processes rows in chunks using a stable, ordered key (typically the primary key). More reliable than offset-based chunking because it doesn't skip or duplicate rows if data changes during iteration.; - **Queued backfill**: Each chunk dispatches a queue job. Enables parallel processing, retry on failure, and progress tracking.; - **Throttling**: Rate-limiting the backfill to prevent resource contention. Implemented via sleep intervals, batch sizes, or queue rate limiting.; - **Idempotency**: Backfill operations must be safe to run multiple times. Use `WHERE new_column IS NULL` or `ON CONFLICT DO NOTHING`..
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