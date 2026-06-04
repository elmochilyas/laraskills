# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 03-etl-elt-pipelines
**Knowledge Unit:** dbt-semantic-layer
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] dbt Semantic Layer architecture understood — MetricFlow compiles YAML metrics to SQL
- [ ] Metrics defined once in YAML, consumed by multiple downstream tools (Metabase, Tableau, API)
- [ ] Dimensions and time granularities defined per metric for flexible slicing
- [ ] Saved queries configured for common dashboard metric requests
- [ ] Metric definition YAML organized within dbt project structure
- [ ] Laravel widget provider (K011) consuming metrics from Semantic Layer API

---

# Architecture Checklist

- [ ] Metric definitions decoupled from dbt model logic — metrics in separate YAML, not SQL
- [ ] Metric time granularity (day, week, month) defined per metric, not per query
- [ ] Dimensions declared at metric level for consistent drill-down across tools
- [ ] Saved queries defined for commonly accessed metric combinations
- [ ] Semantic Layer API exposed for Laravel widget provider consumption
- [ ] MetricFlow engine generates optimized SQL against dbt models automatically

---

# Implementation Checklist

- [ ] metrics.yml file created in dbt project with metric name, label, type, and sql
- [ ] Metric type chosen: derived (expression of other metrics), ratio (numerator/denominator), cumulative (running total), or simple
- [ ] Dimensions listed per metric with time granularity options (day, week, month, quarter, year)
- [ ] Saved queries defined for pre-configured metric + dimension + time grain combinations
- [ ] MetricFlow server or JDBC API connection configured for downstream consumption
- [ ] Laravel service class created to query Semantic Layer API and cache responses

---

# Performance Checklist

- [ ] MetricFlow generated SQL reviewed for query efficiency against ClickHouse
- [ ] Time granularity aggregation pushed down to database, not computed in application
- [ ] Saved queries pre-materialized for frequently accessed metric combinations
- [ ] Metric queries cached with appropriate TTL in Laravel widget layer
- [ ] Semantic Layer query timeout configured to prevent long-running queries blocking API
- [ ] MetricFlow query plan analyzed for full-scan or unnecessary join patterns

---

# Security Checklist

- [ ] Metric definitions in YAML do not expose raw column names from source tables
- [ ] Semantic Layer API key-protected for external consumer access
- [ ] Metric dimensions do not include PII — dimensions are aggregate-level attributes
- [ ] Row-level security implemented in underlying dbt models, not in metric layer
- [ ] Metric access logged per consumer/client for usage auditing

---

# Reliability Checklist

- [ ] MetricFlow cache configured to survive restart — query results not lost
- [ ] Saved queries fail gracefully when upstream dbt model not refreshed
- [ ] Metric definition changes versioned via YAML in source control
- [ ] Metric query timeout triggers 5xx response, not indefinite hang
- [ ] Semantic Layer health endpoint monitored for availability

---

# Testing Checklist

- [ ] Test metric SQL output produces correct aggregate values matching manual calculation
- [ ] Test dimension drill-down returns consistent results across different time grains
- [ ] Test saved query returns pre-configured metric combination as expected
- [ ] Test Laravel widget consumes Semantic Layer API and caches correctly
- [ ] Test metric query handles null dimension values without error
- [ ] Test MetricFlow query plan shows no full-table scan

---

# Maintainability Checklist

- [ ] metrics.yml organized by business domain folder (marketing, product, finance)
- [ ] Metric name follows convention: {domain}_{metric_name} (e.g., revenue_mrr)
- [ ] Dimension list aligned across metrics for consistent cross-filtering
- [ ] Metric description field populated with business owner and calculation formula
- [ ] Semantic Layer documentation served alongside dbt docs

---

# Anti-Pattern Prevention Checklist

- [ ] Do not define same metric in multiple places — define once in Semantic Layer, not in SQL and dashboard
- [ ] Do not use dimensions that are not aggregate-safe (e.g., raw user email)
- [ ] Do not skip time granularity — all metrics must have at least one time grain
- [ ] Do not query Semantic Layer on critical request path — cache aggressively
- [ ] Do not define metrics directly on raw source tables — use dbt mart models

---

# Production Readiness Checklist

- [ ] Prometheus metrics for Semantic Layer query count, latency, and error rate
- [ ] Logged warning when metric query returns zero rows (possible dimension mismatch)
- [ ] Alert when Semantic Layer API response time exceeds threshold
- [ ] Metric cache hit/miss ratio monitored to tune TTL
- [ ] Deploy checklist includes metric re-validation after dbt model changes
- [ ] Staging verified with same metric definitions before production rollout

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: decoupled YAML definitions, MetricFlow compilation, widget integration
- [ ] Security requirements satisfied: no PII dimensions, API key auth, column name protection
- [ ] Performance requirements satisfied: push-down aggregation, saved queries, caching, timeouts
- [ ] Testing requirements satisfied: aggregate correctness, dimension drill-down, cached widget, null handling
- [ ] Anti-pattern checks passed: single source of truth, aggregate-safe dimensions, time grains mandatory
- [ ] Production readiness verified: query metrics, cache ratios, API latency alerts, metric re-validation

---

# Related References

- K015 (dbt Incremental Models): Models that feed the Semantic Layer
- K028 (dbt Project Structure): Organizing semantic files in the dbt project
- K011 (Dashboard Widget Provider): Laravel widget consuming metric data from Semantic Layer
