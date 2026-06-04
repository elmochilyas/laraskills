# Decomposition: 8.18 Partitioning vs. sharding decision framework

## Topic Overview
Partitioning and sharding both split data horizontally. Choose partitioning when: single server can hold the data, need lifecycle management (archival), queries can prune by partition key. Choose sharding when: data exceeds single server capacity, write throughput exceeds single server, need geographic distribution.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
8-18-partitioning-vs-sharding-framework/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 8.18 Partitioning vs. sharding decision framework
- **Purpose:** Partitioning and sharding both split data horizontally. Choose partitioning when: single server can hold the data, need lifecycle management (archival), queries can prune by partition key.
- **Difficulty:** Advanced
- **Dependencies:** 6.22 Shard vs partition, 8.1 Range partitioning, 6.1 Shard key

## Dependency Graph
**Depends on:** "6.22 Shard vs partition", "8.1 Range partitioning", "6.1 Shard key"

**Depended on by:** More advanced KUs in Table Partitioning & Data Lifecycle and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Choose partitioning**: Data fits on one server. Retention/archival is primary driver. Queries consistently include partition key. Need global indexes (PostgreSQL).; - **Choose sharding**: Data doesn't fit on one server. Write throughput exceeds one server. Need geographic data distribution. Accept cross-shard query complexity.; - **Combine both**: Shard by user_id across servers. Within each shard, partition by month for archival..
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