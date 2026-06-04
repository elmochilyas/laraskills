# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 03-etl-elt-pipelines
**Knowledge Unit:** dbt-semantic-layer
**Difficulty:** Intermediate
**Category:** Metrics Management
**Last Updated:** 2026-06-03

---

# Overview

The dbt Semantic Layer is a centralized metric definition framework that decouples metric computation from metric consumption. Instead of defining "Monthly Recurring Revenue" separately in dbt models, Metabase dashboards, and a Python script, the Semantic Layer defines metrics once in YAML, then exposes them via a consistent API to any downstream tool.

MetricFlow is the underlying engine that compiles metric definitions into optimized SQL queries against dbt models. It handles time granularity, dimension grouping, and metric algebra (ratio metrics, derived metrics) automatically.

Engineers must care because metric fragmentation is one of the most expensive data quality problems in organizations. When every dashboard tool computes the same metric differently, stakeholders lose trust in data. The Semantic Layer provides a single source of truth for business metrics.

---

# Core Concepts

## Metric

A metric is a business-meaningful measure defined in YAML. It specifies the model, measure (aggregation function + field), dimensions, and time granularity. Metrics can be simple (COUNT of orders) or derived (revenue / customer count).

## Dimension

Dimensions are attributes that group or filter metrics. A metric can be grouped by any dimension in the source model or its related models. Dimensions are defined in the metric spec or inherited from the model.

## Time Granularity

Metrics can be computed at multiple time granularities: day, week, month, quarter, year. The Semantic Layer handles the date truncation automatically based on the query parameter.

## Saved Queries

Saved queries pre-define common metric requests (specific metrics, dimensions, time range, granularity) for consistent consumption. They are the Semantic Layer's equivalent of a report definition.

---

# When To Use

- Organizations with multiple BI tools consuming the same metrics
- Teams that struggle with inconsistent metric definitions across reports
- Systems where metrics need to be audited for compliance
- Applications that serve metric data through an API
- Environments where metric definitions change more often than data models

---

# When NOT To Use

- Single BI tool with self-contained metric definitions (Metabase built-in metrics)
- Simple dashboards with 5-10 metrics that rarely change
- Organizations without dedicated analytics engineering resources
- Real-time metrics requiring sub-second refresh (Semantic Layer adds query overhead)

---

# Best Practices

## Define Metrics at the Mart Level

Metrics should reference Gold layer marts, not intermediate or staging models. Marts are already denormalized and aggregated; metrics add business semantics on top.

## Use Ratio Metrics for Derivation

Define base metrics (revenue, customers) and combine them into ratio metrics (revenue_per_customer) rather than defining the ratio as a single metric. This enables component-level analysis.

## Test Metric Definitions

Write dbt tests that verify metric values against a known baseline. `dbt sl list --metrics` validates metric definitions. Compare computed values to expected values for known date ranges.

## Version Metric Definitions

When business logic changes, create a new metric version rather than modifying existing metrics in place. This enables historical comparison and rollback.

---

# Architecture Guidelines

## Layer Placement

The Semantic Layer sits between the Gold marts (data) and the consumption layer (BI tools, APIs). It does not store data — it provides a query engine that translates metric requests into SQL.

## Integration Pattern

Gold Mart (table) ← Metric Definition (YAML) ← Semantic Layer API ← BI Tool / Application

The BI tool queries the Semantic Layer API, not the database directly. The Semantic Layer compiles the query and caches results.

## Data Flow

1. User requests metric via API (e.g., "Show monthly revenue by region for 2024")
2. Semantic Layer resolves the metric definition
3. MetricFlow generates optimized SQL
4. SQL executes against the data warehouse
5. Results return through the API

---

# Performance Considerations

- The Semantic Layer adds query overhead vs direct database queries. For simple metrics, direct SQL is faster.
- Caching is essential. Configure result caching in the Semantic Layer for common metric queries.
- Query compilation time is noticeable for complex metrics with multiple dimension joins.
- Pre-aggregated tables in Gold reduce Semantic Layer query time significantly.

---

# Security Considerations

- The Semantic Layer API must be behind an authentication layer. Anonymous metric access exposes business data.
- Define per-metric access control: some metrics should only be accessible to specific user roles.
- Metric definitions in YAML are business knowledge. Protect the repository that stores them.
- The Semantic Layer query engine has access to all underlying data. Use row-level security in the warehouse, not just the Semantic Layer.

---

# Common Mistakes

## Mistake: Metrics Tied to Specific Models

A metric references a model name directly. When the model is renamed during refactoring, the metric breaks silently. Reports show NULL values.

**Better approach:** Use semantic model abstractions. If the model changes, update only the semantic model reference, not every metric.

## Mistake: Overly Complex Metrics

A single metric definition includes 5 aggregations, 3 dimension joins, and a CASE statement. It takes 30 seconds to compile and longer to query.

**Better approach:** Simplify. Pre-compute complex logic in the Gold mart model. Keep metric definitions as thin business semantics over well-structured data.

## Mistake: No Documentation on Metric Definitions

Metric YAML files have no descriptions. A year later, no one knows why "active_users" counts users with login in 30 days vs 7 days.

**Better approach:** Add descriptions to every metric and dimension. Include the business context, calculation methodology, and definition author.

---

# Anti-Patterns

## Metrics Without Ownership
Metrics are defined without an owner. When the definition needs to change, no one takes responsibility. The metric becomes stale but remains on dashboards.

**Solution:** Each metric must have an owner documented in the YAML. Owners are responsible for definition accuracy and change communication.

## Semantic Layer as ETL
Using the Semantic Layer to compute complex transformations that should be in dbt models. The Semantic Layer is a query engine, not a transformation framework.

**Solution:** Pre-compute transformations in dbt models. Use the Semantic Layer only for business metric semantics over clean marts.

## Bypassing the Layer
Some BI tools query the warehouse directly while others use the Semantic Layer. The same metric shows different values depending on which tool queried it.

**Solution:** Route all metric consumption through the Semantic Layer. Block direct warehouse query access for metric consumption.

---

# Examples

## Metric Definition YAML

```yaml
semantic_models:
  - name: orders
    model: ref('mart_orders')
    entities:
      - name: order_id
        type: primary
      - name: customer_id
        type: foreign
    dimensions:
      - name: order_date
        type: time
        type_params:
          time_granularity: day
      - name: status
        type: categorical
    measures:
      - name: order_total
        agg: sum
      - name: order_count
        agg: count
        expr: 1
      - name: distinct_customers
        agg: count_distinct
        expr: customer_id

metrics:
  - name: monthly_revenue
    label: Monthly Revenue
    type: simple
    type_params:
      measure: order_total
      filter: status = 'completed'
    dimensions:
      - customer_id
  - name: revenue_per_customer
    label: Revenue Per Customer
    type: ratio
    type_params:
      numerator: monthly_revenue
      denominator: distinct_customers
```

---

# Related Topics

**Prerequisites:**
- dbt Incremental Models — Models that feed the Semantic Layer
- dbt Project Structure — Organizing semantic files in the dbt project

**Closely Related:**
- Dashboard Widget Provider — Laravel widget consuming metric data from Semantic Layer
- Star Schema — Mart design that makes Semantic Layer queries efficient

**Advanced Follow-Up:**
- AI-Assisted OLAP Modeling — Using LLMs to optimize Semantic Layer metric definitions

**Cross-Domain Connections:**
- API Integration Engineering — Semantic Layer API consumption patterns
