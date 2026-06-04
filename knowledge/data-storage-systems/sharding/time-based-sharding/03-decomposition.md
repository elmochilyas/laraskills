# Decomposition: 6.21 Time-based sharding (partition by time period, natural data lifecycle)

## Topic Overview
Time-based sharding partitions data by time ranges: one shard per month, quarter, or year. Natural fit for time-series data, logs, events. Old shards can be archived, compressed, or dropped.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-21-time-based-sharding/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.21 Time-based sharding (partition by time period, natural data lifecycle)
- **Purpose:** Time-based sharding partitions data by time ranges: one shard per month, quarter, or year. Natural fit for time-series data, logs, events.
- **Difficulty:** Advanced
- **Dependencies:** 8.1 Table partitioning, 6.1 Shard key, 6.22 Shard vs partition distinction

## Dependency Graph
**Depends on:** "8.1 Table partitioning", "6.1 Shard key", "6.22 Shard vs partition distinction"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Time range per shard**: `shard_2024_q1`, `shard_2024_q2`, etc. Each shard holds data for a time interval.; - **Hot current shard**: All writes go to the current shard. Other shards are read-only (historical data).; - **Archival lifecycle**: After N months, move old shard to cold storage. After N years, drop..
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