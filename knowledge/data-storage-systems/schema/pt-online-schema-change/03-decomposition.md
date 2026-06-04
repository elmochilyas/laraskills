# Decomposition: 1.12 pt-online-schema-change (trigger-based, FK support, Percona Toolkit)

## Topic Overview
pt-online-schema-change (pt-osc) is Percona Toolkit's online schema change tool for MySQL. It uses database triggers to capture ongoing changes while the ghost table is being populated. Unlike gh-ost (binlog-based), pt-osc relies on triggers (INSERT/UPDATE/DELETE) to keep the ghost table synchronized.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-12-pt-online-schema-change/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.12 pt-online-schema-change (trigger-based, FK support, Percona Toolkit)
- **Purpose:** pt-online-schema-change (pt-osc) is Percona Toolkit's online schema change tool for MySQL. It uses database triggers to capture ongoing changes while the ghost table is being populated.
- **Difficulty:** Advanced
- **Dependencies:** 1.11 gh-ost tool, 1.13 Spirit tool, 1.10 Zero-downtime migration patterns, 1.26 MySQL ALGORITHM/LOCK options

## Dependency Graph
**Depends on:** "1.11 gh-ost tool", "1.13 Spirit tool", "1.10 Zero-downtime migration patterns", "1.26 MySQL ALGORITHM/LOCK options"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Trigger-based sync**: AFTER INSERT, AFTER UPDATE, AFTER DELETE triggers on the original table propagate changes to the ghost table.; - **Chunked row copy**: Reads original table in chunks using a unique index (typically PRIMARY KEY) and inserts into the ghost table.; - **FK handling**: pt-osc can update FK constraints to reference the new table after swap. Use `--alter-foreign-keys-method` to control behavior.; - **Throttling**: Configurable via replication lag, thread count, chunk size, and sleep intervals..
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