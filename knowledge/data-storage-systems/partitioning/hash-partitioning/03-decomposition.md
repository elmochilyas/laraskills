# Decomposition: 8.3 Hash partitioning (BY HASH, BY KEY for even distribution)

## Topic Overview
Hash partitioning distributes rows across partitions via a hash function on the partition key. `PARTITION BY HASH (id) PARTITIONS 8`. Provides even distribution without ranges.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
8-3-hash-partitioning/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 8.3 Hash partitioning (BY HASH, BY KEY for even distribution)
- **Purpose:** Hash partitioning distributes rows across partitions via a hash function on the partition key. `PARTITION BY HASH (id) PARTITIONS 8`.
- **Difficulty:** Advanced
- **Dependencies:** 8.1 Range partitioning, 8.2 List partitioning, 8.4 Composite partitioning

## Dependency Graph
**Depends on:** "8.1 Range partitioning", "8.2 List partitioning", "8.4 Composite partitioning"

**Depended on by:** More advanced KUs in Table Partitioning & Data Lifecycle and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Even distribution**: `MOD(hash(key), N)` assigns rows to N partitions. Without natural skew, each partition gets ~1/N of rows.; - **No pruning for range**: `WHERE id BETWEEN 100 AND 200` cannot prune — must scan all partitions. Hash partitioning is not suitable for range-heavy queries.; - **MySQL BY KEY**: Uses MD5 hash. Similar to HASH but handles NULL values consistently..
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