# Decomposition: Grafana/Metabase Read-Only Integration

## Topic Overview
Grafana and Metabase provide external BI dashboarding against Laravel application databases. The standard integration pattern creates a read-only database user scoped to the `analytics.*` schema (or a dedicated analytics database), preventing external BI tools from mutating operational data. This pattern enables rich visualization without embedding dashboard logic in the Laravel application, while maintaining strict security boundaries between OLTP and OLAP query paths.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k023-grafana-metabase/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Grafana/Metabase Read-Only Integration
- **Purpose:** Grafana and Metabase provide external BI dashboarding against Laravel application databases.
- **Difficulty:** Intermediate
- **Dependencies:** K011 (Dashboard Widget Provider): Complementary in-app dashboard pattern, K008 (CQRS Read Model): The analytics.* schema is a read model tier, K019 (Analytic Schema Separation): Schema organization fundamentals, K013 (Snowflake/BigQuery Drivers): Warehouse drivers for BI tool connections

## Dependency Graph
**Depends on:**
- K011 (Dashboard Widget Provider): Complementary in-app dashboard pattern
- K008 (CQRS Read Model): The analytics.* schema is a read model tier
- K019 (Analytic Schema Separation): Schema organization fundamentals
- K013 (Snowflake/BigQuery Drivers): Warehouse drivers for BI tool connections

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Read-only user:
- Schema scoping:
- Connection pooling:
- Query timeouts:
- Row-level security (RLS):
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K011 (Dashboard Widget Provider): Complementary in-app dashboard pattern, K008 (CQRS Read Model): The analytics.* schema is a read model tier, K019 (Analytic Schema Separation): Schema organization fundamentals, K013 (Snowflake/BigQuery Drivers): Warehouse drivers for BI tool connections

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