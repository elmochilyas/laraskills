# Decomposition: PostgreSQL Analytic Schema Separation (public vs analytics)

## Topic Overview
Schema separation is a zero-infrastructure-cost way to isolate analytical data from operational data within the same PostgreSQL database. By placing analytics tables in a dedicated `analytics` schema (separate from the `public` operational schema), you achieve logical separation, per-schema permission control, independent query performance monitoring, and clear organizational boundaries — all within a single database, without separate infrastructure. This is the recommended starting point for Laravel analytics before migrating to dedicated analytical stores like ClickHouse or Snowflake.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k019-analytic-schema-separation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### PostgreSQL Analytic Schema Separation (public vs analytics)
- **Purpose:** Schema separation is a zero-infrastructure-cost way to isolate analytical data from operational data within the same PostgreSQL database.
- **Difficulty:** Foundation
- **Dependencies:** K008 (CQRS Read Models): Analytics tables ARE read models in the analytics schema, K006 (Star Schema): Fact/dimension tables created in analytics. schema, K023 (Grafana/Metabase): BI tools configured with read-only access to analytics schema

## Dependency Graph
**Depends on:**
- K008 (CQRS Read Models): Analytics tables ARE read models in the analytics schema
- K006 (Star Schema): Fact/dimension tables created in analytics. schema
- K023 (Grafana/Metabase): BI tools configured with read-only access to analytics schema

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- PostgreSQL schema:
- `search_path`:
- Per-schema permissions:
- Schema-level queries:
- Logical isolation vs physical isolation:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K008 (CQRS Read Models): Analytics tables ARE read models in the analytics schema, K006 (Star Schema): Fact/dimension tables created in analytics. schema, K023 (Grafana/Metabase): BI tools configured with read-only access to analytics schema

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