# Decomposition: 10.9 Read/write connection separation (dedicated read connections vs. merged)

## Topic Overview
Separate read and write connections have different pool configurations and failover behaviors. Read pool: larger (more replicas), tolerant of stale data. Write pool: smaller (single primary), strict consistency.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
10-9-read-write-connection-separation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 10.9 Read/write connection separation (dedicated read connections vs. merged)
- **Purpose:** Separate read and write connections have different pool configurations and failover behaviors. Read pool: larger (more replicas), tolerant of stale data.
- **Difficulty:** Advanced
- **Dependencies:** 7.2 Read/write config, 7.8 Connection pooling replicas

## Dependency Graph
**Depends on:** "7.2 Read/write config", "7.8 Connection pooling replicas"

**Depended on by:** More advanced KUs in Connection Management & Pooling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Read pool**: Multiple replica hosts, larger pool size, `application_name` tagged as `read`, tolerant of connection failures.; - **Write pool**: Single primary host (or cluster), smaller pool size, strict connection health checks, fails over to replica on primary failure.; - **Laravel config**: Separate `'pool'` config for read and write arrays in `database.php`..
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