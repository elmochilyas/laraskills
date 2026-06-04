# Decomposition: 6.22 Shard vs. partition distinction (shard = separate server, partition = within same server)

## Topic Overview
Sharding = horizontal splitting across servers. Partitioning = horizontal splitting within a single database. Sharding solves server-level scaling (more data than one server can hold).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-22-shard-vs-partition-distinction/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.22 Shard vs. partition distinction (shard = separate server, partition = within same server)
- **Purpose:** Sharding = horizontal splitting across servers. Partitioning = horizontal splitting within a single database.
- **Difficulty:** Intermediate
- **Dependencies:** 6.1 Shard key selection, 8.1 Table partitioning

## Dependency Graph
**Depends on:** "6.1 Shard key selection", "8.1 Table partitioning"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Shard**: A complete database server (or replica set). Independent CPU, memory, storage, network. Data split across servers.; - **Partition**: A division within a single database (MySQL `PARTITION BY RANGE`, PostgreSQL `PARTITION BY RANGE`). Same server.; - **Key difference**: Shards are independent failure domains and compute resources. Partitions share the same server resources..
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