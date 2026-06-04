# Decomposition: Snowflake Data Sharing, Warehouse/Role Switching in Eloquent

## Topic Overview
Snowflake's architecture separates compute (warehouses) from storage, enabling independent scaling of query compute and per-user role-based access control. In the Laravel context, Eloquent models backed by Snowflake can dynamically switch between warehouses (for cost optimization), roles (for data access control), and databases/schemas (for multi-environment). This allows a single Laravel application to execute dashboard queries on a small warehouse, ETL workloads on a large warehouse, and admin queries on a separate warehouse — all from the same codebase with connection-level granularity.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k025-snowflake-warehouse-switching/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Snowflake Data Sharing, Warehouse/Role Switching in Eloquent
- **Purpose:** Snowflake's architecture separates compute (warehouses) from storage, enabling independent scaling of query compute and per-user role-based access control.
- **Difficulty:** Intermediate
- **Dependencies:** K013 (Snowflake/BigQuery Drivers): Base Eloquent driver setup, K036 (Warehouse Cost Optimization): Cost implications of warehouse switching decisions, K023 (Grafana/Metabase): Querying Snowflake from external BI tools

## Dependency Graph
**Depends on:**
- K013 (Snowflake/BigQuery Drivers): Base Eloquent driver setup
- K036 (Warehouse Cost Optimization): Cost implications of warehouse switching decisions
- K023 (Grafana/Metabase): Querying Snowflake from external BI tools

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Warehouse:
- Role:
- Database/Schema:
- Data Sharing:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K013 (Snowflake/BigQuery Drivers): Base Eloquent driver setup, K036 (Warehouse Cost Optimization): Cost implications of warehouse switching decisions, K023 (Grafana/Metabase): Querying Snowflake from external BI tools

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization