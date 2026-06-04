# Decomposition: 7.15 Read replica-specific workloads (reporting, analytics, search)

## Topic Overview
Dedicate replicas for specific workloads: reporting (heavy aggregation queries), analytics (full table scans), search (Elasticsearch indexing reads). These workloads consume CPU and IOPS that would degrade user-facing query performance. Separation via dedicated read replicas with different sizing.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
7-15-read-replica-specific-workloads/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 7.15 Read replica-specific workloads (reporting, analytics, search)
- **Purpose:** Dedicate replicas for specific workloads: reporting (heavy aggregation queries), analytics (full table scans), search (Elasticsearch indexing reads). These workloads consume CPU and IOPS that would degrade user-facing query performance.
- **Difficulty:** Intermediate
- **Dependencies:** 7.16 Read replica sizing, 7.5 Replica lag

## Dependency Graph
**Depends on:** "7.16 Read replica sizing", "7.5 Replica lag"

**Depended on by:** More advanced KUs in Replication & Read/Write Splitting and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Reporting replica**: Larger instance (more CPU/RAM). Run heavy aggregation queries, materialized view refreshes, report generation.; - **Analytics replica**: Connected to BI tools (Tableau, Metabase). Accepts high-latency queries. May be significantly behind in replication lag.; - **Search indexing replica**: Elasticsearch/Meilisearch indexing reads. Scans large tables. Separate from user-facing replicas..
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