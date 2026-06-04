# dbt Semantic Layer

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 03-etl-elt-pipelines
- **Knowledge Unit:** dbt-semantic-layer
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

The dbt Semantic Layer is a centralized metric definition framework that decouples metric computation from consumption — metrics are defined once in YAML via MetricFlow and exposed through a consistent API to any downstream tool. This solves the expensive data quality problem of metric fragmentation, where every dashboard tool computes the same metric differently and stakeholders lose trust in data.

---

## Core Concepts

- **Metric:** A business-meaningful measure defined in YAML specifying the model, measure (aggregation + field), dimensions, and time granularity — can be simple (COUNT of orders) or derived (revenue / customers)
- **Dimension:** Attributes that group or filter metrics — defined in the metric spec or inherited from the model
- **Time Granularity:** Metrics computed at multiple granularities (day, week, month, quarter, year) — handles date truncation automatically
- **Saved Queries:** Pre-define common metric requests for consistent consumption — the Semantic Layer's equivalent of a report definition

---

## Mental Models

- **Semantic Layer as Universal Translator:** Business users speak "monthly revenue by region" and the Semantic Layer translates that into the correct SQL for the specific warehouse. Like a universal translator that converts between languages.
- **Metric as Contract:** A metric definition is a contract between the data team and the business — "monthly revenue" always means the same thing, regardless of which tool or dashboard queries it.

---

## Internal Mechanics

The Semantic Layer sits between Gold marts (data) and the consumption layer (BI tools, APIs). It does not store data — MetricFlow compiles metric definitions into optimized SQL. When a user requests a metric (via API), the Semantic Layer resolves the metric definition, MetricFlow generates optimized SQL, the SQL executes against the warehouse, and results return through the API. The layer caches results for common queries. Metric definitions reference Gold layer marts (not intermediate or staging), providing business semantics on top of already-structured data.

---

## Patterns

- **Define Metrics at the Mart Level:** Metrics should reference Gold layer marts, not intermediate or staging models — marts are already denormalized and aggregated, metrics add business semantics
- **Ratio Metrics for Derivation:** Define base metrics (revenue, customers) and combine into ratio metrics (revenue_per_customer) rather than defining the ratio as a single metric — enables component-level analysis
- **Version Metric Definitions:** When business logic changes, create a new metric version rather than modifying existing — enables historical comparison and rollback

---

## Architectural Decisions

Use the Semantic Layer when multiple BI tools consume the same metrics or when metrics need to be audited for compliance. Do not use for single BI tool with self-contained metric definitions or simple dashboards with 5-10 rarely-changing metrics. Route all metric consumption through the Semantic Layer — block direct warehouse query access for metric consumption.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Single source of truth for metrics | Query overhead vs direct SQL | Caching mitigates for common queries |
| Audit-compatible metric definitions | Requires analytics engineering resources | Not suitable for small teams |
| Tool-agnostic metric consumption | MetricFlow compilation time | Complex metrics take 30s+ to compile |
| Version-controlled metric changes | Pre-compute complexity in Gold marts | Simple metric definitions = fast compilation |

---

## Performance Considerations

The Semantic Layer adds query overhead vs direct database queries — for simple metrics, direct SQL is faster. Caching is essential — configure result caching for common metric queries. Query compilation time is noticeable for complex metrics with multiple dimension joins. Pre-aggregated tables in Gold reduce Semantic Layer query time significantly.

---

## Production Considerations

The Semantic Layer API must be behind authentication — anonymous metric access exposes business data. Define per-metric access control — some metrics should only be accessible to specific user roles. Metric definitions in YAML are business knowledge — protect the repository. The query engine has access to all underlying data — use row-level security in the warehouse.

---

## Common Mistakes

- **Metrics Tied to Specific Models:** A metric references a model name directly — when model is renamed during refactoring, the metric breaks silently. Better: use semantic model abstractions.
- **Overly Complex Metrics:** A single metric includes 5 aggregations, 3 dimension joins, a CASE statement — 30-second compile time. Better: pre-compute complex logic in Gold marts, keep metric definitions thin.
- **No Documentation on Metric Definitions:** Metric YAML files have no descriptions — a year later, no one knows why "active_users" counts 30-day vs 7-day login. Better: add descriptions to every metric and dimension.

---

## Failure Modes

- **Metrics Without Ownership:** No owner documented — when definition needs changing, no one takes responsibility, metric becomes stale. Mitigation: each metric must have an owner in YAML.
- **Semantic Layer as ETL:** Using Semantic Layer for complex transformations that should be in dbt models — it's a query engine, not a transformation framework. Mitigation: pre-compute transformations in dbt models.
- **Bypassing the Layer:** Some BI tools query the warehouse directly while others use the Semantic Layer — same metric shows different values. Mitigation: route all consumption through Semantic Layer, block direct access.

---

## Ecosystem Usage

The dbt Semantic Layer integrates with downstream BI tools like Tableau, Power BI, and Metabase through JDBC/ODBC drivers. For Laravel applications, custom analytics dashboards can consume metric data from the Semantic Layer API. The `dashboard-widget-provider` pattern can use the Semantic Layer as its data source instead of querying the warehouse directly.

---

## Related Knowledge Units

### Prerequisites
- dbt Incremental Models — Models that feed the Semantic Layer
- dbt Project Structure — Organizing semantic files in the dbt project

### Related Topics
- Dashboard Widget Provider — Laravel widget consuming metric data from Semantic Layer
- Star Schema — Mart design that makes Semantic Layer queries efficient

### Advanced Follow-up Topics
- AI-Assisted OLAP Modeling — Using LLMs to optimize Semantic Layer metric definitions

---

## Research Notes

The dbt Semantic Layer evolved from the recognition that metric fragmentation is one of the most expensive data quality problems in organizations. MetricFlow (the underlying engine) handles time granularity, dimension grouping, and metric algebra automatically. The Semantic Layer has been adopted by organizations with multiple BI tools that need consistent metric definitions across Tableau, Power BI, and custom dashboards.
