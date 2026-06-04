# Decomposition: Snowflake/BigQuery/Redshift Cost Optimization at Scale

## Topic Overview
Cloud data warehouse costs grow linearly with data volume but can grow super-linearly with bad query patterns, misconfigured warehouses, and lack of governance. The core cost optimization strategies differ by platform: Snowflake charges per compute credit (warehouse uptime), BigQuery charges per byte scanned (query data volume), and Redshift charges per node-hour (cluster runtime). For Laravel applications serving dashboards, the cost difference between well-optimized and naive queries can be 10-100x — making cost optimization a critical engineering concern, not just a financial one.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k036-warehouse-cost-optimization/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Snowflake/BigQuery/Redshift Cost Optimization at Scale
- **Purpose:** Cloud data warehouse costs grow linearly with data volume but can grow super-linearly with bad query patterns, misconfigured warehouses, and lack of governance.
- **Difficulty:** Intermediate
- **Dependencies:** K013 (Snowflake/BigQuery Drivers): Connection setup where cost optimization begins, K025 (Snowflake Warehouse Switching): Warehouse sizing strategy per workload, K042 (Multi-Region ClickHouse): ClickHouse alternative — self-hosted cost structure vs cloud warehouses

## Dependency Graph
**Depends on:**
- K013 (Snowflake/BigQuery Drivers): Connection setup where cost optimization begins
- K025 (Snowflake Warehouse Switching): Warehouse sizing strategy per workload
- K042 (Multi-Region ClickHouse): ClickHouse alternative — self-hosted cost structure vs cloud warehouses

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Snowflake pricing:
- BigQuery pricing:
- Redshift pricing:
- Bytes scanned vs credits burned:
- Query cost attribution:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K013 (Snowflake/BigQuery Drivers): Connection setup where cost optimization begins, K025 (Snowflake Warehouse Switching): Warehouse sizing strategy per workload, K042 (Multi-Region ClickHouse): ClickHouse alternative — self-hosted cost structure vs cloud warehouses

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