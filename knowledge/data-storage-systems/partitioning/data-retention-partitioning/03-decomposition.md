# Decomposition: 8.16 Data retention policies with partitioning (auto-drop old partitions)

## Topic Overview
Partitioning enables automated data retention: define retention period (e.g., 12 months), create a scheduled job that drops partitions older than retention. `DROP PARTITION` is instant. No DELETE, no VACUUM, no table bloat.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
8-16-data-retention-partitioning/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 8.16 Data retention policies with partitioning (auto-drop old partitions)
- **Purpose:** Partitioning enables automated data retention: define retention period (e.g., 12 months), create a scheduled job that drops partitions older than retention. `DROP PARTITION` is instant.
- **Difficulty:** Intermediate
- **Dependencies:** 8.6 Partition management, 8.14 Partition backup/restore

## Dependency Graph
**Depends on:** "8.6 Partition management", "8.14 Partition backup/restore"

**Depended on by:** More advanced KUs in Table Partitioning & Data Lifecycle and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Retention period**: Legal/regulatory requirement (GDPR: delete after N months). Business requirement (keep order history for 12 months).; - **Drop vs DELETE**: `DROP PARTITION` removes the partition filesystem directory. `DELETE` marks rows as deleted but doesn't reclaim space.; - **Scheduled execution**: MySQL EVENT or cron job runs monthly. `CALL drop_old_partitions('orders', 12)`. Stored procedure handles partition enumeration..
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