# Decomposition: 6.25 Global tables (replicated to all shards for JOIN support)

## Topic Overview
Global tables contain reference data replicated to every shard. Tables like `countries`, `categories`, `tax_rates` — small, rarely updated, frequently joined. Replicating to all shards enables local JOINs without cross-shard queries.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-25-global-tables/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.25 Global tables (replicated to all shards for JOIN support)
- **Purpose:** Global tables contain reference data replicated to every shard. Tables like `countries`, `categories`, `tax_rates` — small, rarely updated, frequently joined.
- **Difficulty:** Advanced
- **Dependencies:** 6.8 Cross-shard joins, 6.13 Shard groups

## Dependency Graph
**Depends on:** "6.8 Cross-shard joins", "6.13 Shard groups"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **What goes global**: Small tables (< 1000 rows), rarely updated, frequently joined with sharded tables. Lookup/reference data.; - **Replication method**: Write to one source, propagate to all shards. CDC via Kafka, application-level double-write, or scheduled refresh.; - **Consistency**: Global tables are eventually consistent across shards. Acceptable for reference data..
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