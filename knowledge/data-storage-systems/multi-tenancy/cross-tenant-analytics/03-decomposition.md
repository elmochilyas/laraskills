# Decomposition: 5.18 Cross-tenant analytics (federated queries, warehouse, CDC pipeline)

## Topic Overview
Cross-tenant analytics requires aggregating data from all tenants into a single analytical store. Approaches: federated queries across tenant databases (slow, complex), periodic ETL to a data warehouse (standard), CDC pipeline via Debezium or PostgreSQL logical replication (real-time). Each tenant's data is tagged with tenant_id in the warehouse for filtered and aggregate analysis.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-18-cross-tenant-analytics/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.18 Cross-tenant analytics (federated queries, warehouse, CDC pipeline)
- **Purpose:** Cross-tenant analytics requires aggregating data from all tenants into a single analytical store. Approaches: federated queries across tenant databases (slow, complex), periodic ETL to a data warehouse (standard), CDC pipeline via Debezium or PostgreSQL logical replication (real-time).
- **Difficulty:** Advanced
- **Dependencies:** 5.19 Schema version ledger, 5.27 Per-tenant backups

## Dependency Graph
**Depends on:** "5.19 Schema version ledger", "5.27 Per-tenant backups"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Federated query**: Query across all tenant databases using foreign data wrappers (PostgreSQL FDW, MySQL FEDERATED) or Presto/Trino. No data duplication but query performance varies with tenant count.; - **ETL pipeline**: Cron or scheduled job extracts data from each tenant, transforms to common schema, loads to warehouse. Latency: minutes to hours.; - **CDC pipeline**: Database replication streams changes to Kafka/Redpanda → stream processor → warehouse. Real-time, less load on source databases..
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