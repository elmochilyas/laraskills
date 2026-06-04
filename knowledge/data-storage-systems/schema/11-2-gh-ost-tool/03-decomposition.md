# Decomposition: 11.2 gh-ost (GitHub's online schema migration tool for MySQL)

## Topic Overview
gh-ost (GitHub Online Schema Translation) runs ALTER TABLE on MySQL without locks, triggers, or replicas. Creates a shadow table, streams binlog changes from the primary to keep the shadow table in sync, cuts over atomically. Supports throttling (replica lag, CPU), pause/resume, and dry-run mode.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
11-2-gh-ost-tool/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 11.2 gh-ost (GitHub's online schema migration tool for MySQL)
- **Purpose:** gh-ost (GitHub Online Schema Translation) runs ALTER TABLE on MySQL without locks, triggers, or replicas. Creates a shadow table, streams binlog changes from the primary to keep the shadow table in sync, cuts over atomically.
- **Difficulty:** Advanced
- **Dependencies:** 11.1 Zero-downtime taxonomy, 11.3 pt-online-schema-change

## Dependency Graph
**Depends on:** "11.1 Zero-downtime taxonomy", "11.3 pt-online-schema-change"

**Depended on by:** More advanced KUs in Production Schema Operations and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Shadow table**: `_orders_gho` created with the desired schema. Triggerless — gh-ost uses binlog stream capture (hook on replicas or RDS binlog) to keep the shadow table in sync.; - **Cutover**: Atomic rename: rename original table (`orders→_orders_del`), rename shadow table (`_orders_gho→orders`). Instant (metadata only).; - **Throttle controls**: Replica lag threshold, CPU threshold, and manual `throttle` command. Pauses migration when load is high..
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