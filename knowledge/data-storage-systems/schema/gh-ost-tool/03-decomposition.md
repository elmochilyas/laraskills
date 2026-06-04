# Decomposition: 1.11 gh-ost tool (binlog-based, trigger-free, pause/resume, test-on-replica)

## Topic Overview
gh-ost (GitHub Online Schema Transfer) is a trigger-free, binlog-based online schema migration tool for MySQL. Unlike trigger-based approaches (pt-online-schema-change), gh-ost avoids triggers by reading the binary log to capture ongoing changes. It supports pause/resume, throttling, test-on-replica, and controlled cut-over locking.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-11-gh-ost-tool/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.11 gh-ost tool (binlog-based, trigger-free, pause/resume, test-on-replica)
- **Purpose:** gh-ost (GitHub Online Schema Transfer) is a trigger-free, binlog-based online schema migration tool for MySQL. Unlike trigger-based approaches (pt-online-schema-change), gh-ost avoids triggers by reading the binary log to capture ongoing changes.
- **Difficulty:** Advanced
- **Dependencies:** 1.12 pt-online-schema-change, 1.13 Spirit tool, 1.10 Zero-downtime migration patterns, 1.18 Expand-contract pattern

## Dependency Graph
**Depends on:** "1.12 pt-online-schema-change", "1.13 Spirit tool", "1.10 Zero-downtime migration patterns", "1.18 Expand-contract pattern"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Trigger-free architecture**: Reads the binary log (binlog) to capture writes happening on the original table during migration. Avoids trigger overhead and trigger-related deadlocks.; - **Shadow-table approach**: Creates a ghost table with the new schema, applies the migration, streams live changes via binlog, then atomically swaps.; - **Cut-over phase**: The final swap from original table to ghost table. Brief lock period (typically < 1 second).; - **Throttling**: Self-regulates based on replication lag, thread count, load, or custom thresholds.; - **Test-on-replica**: Runs the full migration on a replica without executing cut-over, verifying correctness and timing before touching the primary..
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