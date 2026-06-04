# Decomposition: dbt Semantic Layer + MetricFlow for Consistent Metrics

## Topic Overview
The dbt Semantic Layer is a centralized metric definition framework that decouples metric computation from metric consumption. Instead of defining "Monthly Recurring Revenue" separately in dbt models, Metabase dashboards, and a Python script, the Semantic Layer defines metrics once in YAML, then exposes them via a consistent API to any downstream tool (Metabase, Tableau, Hex, Mode, custom apps). MetricFlow is the underlying engine that compiles metric definitions into optimized SQL queries against dbt models.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k043-dbt-semantic-layer/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### dbt Semantic Layer + MetricFlow for Consistent Metrics
- **Purpose:** The dbt Semantic Layer is a centralized metric definition framework that decouples metric computation from metric consumption.
- **Difficulty:** Intermediate
- **Dependencies:** K015 (dbt Incremental Models): Models that feed the Semantic Layer, K028 (dbt Project Structure): Organizing semantic files in the dbt project, K011 (Dashboard Widget Provider): Laravel widget consuming metric data from Semantic Layer

## Dependency Graph
**Depends on:**
- K015 (dbt Incremental Models): Models that feed the Semantic Layer
- K028 (dbt Project Structure): Organizing semantic files in the dbt project
- K011 (Dashboard Widget Provider): Laravel widget consuming metric data from Semantic Layer

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Metric:
- Dimension:
- Time granularity:
- Saved queries:
- Metric definition YAML:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K015 (dbt Incremental Models): Models that feed the Semantic Layer, K028 (dbt Project Structure): Organizing semantic files in the dbt project, K011 (Dashboard Widget Provider): Laravel widget consuming metric data from Semantic Layer

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