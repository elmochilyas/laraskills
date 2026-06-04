# Decomposition: 7.16 Read replica sizing (matching replica capacity to primary write volume)

## Topic Overview
A replica must have sufficient CPU, IOPS, and memory to replay the primary's write volume. If replica capacity < primary write throughput, lag grows indefinitely. Rule of thumb: replica should have at least the primary's CPU/memory.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
7-16-read-replica-sizing/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 7.16 Read replica sizing (matching replica capacity to primary write volume)
- **Purpose:** A replica must have sufficient CPU, IOPS, and memory to replay the primary's write volume. If replica capacity < primary write throughput, lag grows indefinitely.
- **Difficulty:** Advanced
- **Dependencies:** 7.5 Replica lag, 7.8 Connection pooling replicas

## Dependency Graph
**Depends on:** "7.5 Replica lag", "7.8 Connection pooling replicas"

**Depended on by:** More advanced KUs in Replication & Read/Write Splitting and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Apply overhead**: Replica applies every write from the primary plus serves read queries. Total load on replica = replay load + read load.; - **Replay load**: Replica must have enough IOPS to write all binlog events + enough CPU to execute them. Log writes are sequential (easier on replicas).; - **Storage throughput**: Replicas need similar storage throughput as primary for binlog replay..
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