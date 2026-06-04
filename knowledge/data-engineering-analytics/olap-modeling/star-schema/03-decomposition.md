# Decomposition: Star Schema Fact/Dimension Modeling Fundamentals

## Topic Overview
Star schema dimensional modeling organizes analytical data into fact tables (measurable events) and dimension tables (descriptive attributes) in a denormalized, query-optimized structure. This is the foundational modeling technique for analytics in Laravel applications, enabling fast aggregations, drill-downs, and period-over-period comparisons that are impractical against normalized OLTP schemas. The `laravel-star-schema` package provides a fluent API for defining facts and dimensions within Eloquent.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k006-star-schema/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Star Schema Fact/Dimension Modeling Fundamentals
- **Purpose:** Star schema dimensional modeling organizes analytical data into fact tables (measurable events) and dimension tables (descriptive attributes) in a denormalized, query-optimized structure.
- **Difficulty:** Intermediate
- **Dependencies:** K030 (SCD Dimensions): Specialized handling for dimension attribute changes over time, K024 (AggregatingMergeTree): ClickHouse-specific pre-aggregation for star schema facts, K012 (ClickHouse MergeTree): Columnar storage engine for fact tables at scale, K014 (Medallion Architecture): Bronze → Silver → Gold pipeline that produces star schemas

## Dependency Graph
**Depends on:**
- K030 (SCD Dimensions): Specialized handling for dimension attribute changes over time
- K024 (AggregatingMergeTree): ClickHouse-specific pre-aggregation for star schema facts
- K012 (ClickHouse MergeTree): Columnar storage engine for fact tables at scale
- K014 (Medallion Architecture): Bronze → Silver → Gold pipeline that produces star schemas

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Fact table:
- Dimension table:
- Grain:
- Surrogate key:
- Degenerate dimension:
- Conformed dimension:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K030 (SCD Dimensions): Specialized handling for dimension attribute changes over time, K024 (AggregatingMergeTree): ClickHouse-specific pre-aggregation for star schema facts, K012 (ClickHouse MergeTree): Columnar storage engine for fact tables at scale, K014 (Medallion Architecture): Bronze → Silver → Gold pipeline that produces star schemas

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