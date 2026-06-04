# Decomposition: 11.4 Spirit (Physical Replication-based online schema change for MySQL)

## Topic Overview
Spirit is a newer online schema change tool (by CashApp/Block) that uses MySQL physical replication for schema changes. Creates a new replica with the desired schema, builds it via physical replication, then cuts over. Avoids trigger overhead (unlike pt-osc) and binlog requirement (unlike gh-ost).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
11-4-spirit-tool/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 11.4 Spirit (Physical Replication-based online schema change for MySQL)
- **Purpose:** Spirit is a newer online schema change tool (by CashApp/Block) that uses MySQL physical replication for schema changes. Creates a new replica with the desired schema, builds it via physical replication, then cuts over.
- **Difficulty:** Advanced
- **Dependencies:** 11.2 gh-ost, 11.3 pt-online-schema-change

## Dependency Graph
**Depends on:** "11.2 gh-ost", "11.3 pt-online-schema-change"

**Depended on by:** More advanced KUs in Production Schema Operations and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Physical replication**: Spirit clones the original table via physical file copy (faster than row-by-row copy). Requires replica from backup.; - **No triggers**: Unlike pt-osc, Spirit doesn't add triggers. Performance impact during migration is lower.; - **Cutover**: Atomic table rename. Same as other online schema change tools..
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