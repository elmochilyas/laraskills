# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 04-data-warehousing
**Knowledge Unit:** warehouse-cost-optimization
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Snowflake pricing (compute credit per warehouse hour) understood
- [ ] BigQuery pricing (bytes scanned per query) understood
- [ ] Redshift pricing (node-hour per cluster) understood
- [ ] Query cost attribution per team/dashboard/feature implemented
- [ ] Bytes scanned vs credits burned cost model compared for workload
- [ ] ClickHouse self-hosted cost structure evaluated as alternative (K042)

---

# Architecture Checklist

- [ ] Snowflake warehouse auto-suspend configured (1-5 min idle timeout)
- [ ] BigQuery queries optimized for minimum bytes scanned (partition filter, clustered table)
- [ ] Redshift WLM (Workload Management) configured to prioritize dashboard queries
- [ ] Materialized views/pre-aggregations reduce compute for repeated queries
- [ ] Query result caching enabled at warehouse and application level
- [ ] Cost tagging per team/department for chargeback reporting

---

# Implementation Checklist

- [ ] Snowflake: ALTER WAREHOUSE SET AUTO_SUSPEND = 60 for non-production warehouses
- [ ] BigQuery: All tables use partitioning + clustering for query cost reduction
- [ ] BigQuery: Maximum bytes billed set per query (safety limit)
- [ ] Redshift: Concurrency scaling enabled for unpredictable workload spikes
- [ ] Snowflake: Account-level resource monitors set with alert and suspend actions
- [ ] ClickHouse: Storage-to-compute ratio calculated for self-hosted TCO comparison

---

# Performance Checklist

- [ ] BigQuery dry-run (EXPLAIN) estimates query cost before execution
- [ ] Snowflake query profile reviewed for excessive spill-to-disk (large sorting)
- [ ] Pre-aggregated tables reduce warehouse credit by replacing raw scans in dashboards
- [ ] Query concurrency monitored — Snowflake multi-cluster warehouse only when needed
- [ ] Redshift sort key and distribution key optimized to reduce scan volume
- [ ] Data lifecycle policy moves cold data to cheaper storage tier

---

# Security Checklist

- [ ] Cost allocation tags applied at warehouse/cluster level for chargeback
- [ ] Resource monitors with notification to prevent surprise bills
- [ ] Query review required for queries scanning > 1TB (cost governance policy)
- [ ] Warehouse access restricted to prevent unauthorized creation of compute resources
- [ ] Cost dashboards accessible to finance team, not just engineering

---

# Reliability Checklist

- [ ] Auto-suspend does not interrupt steady-state dashboard traffic (set higher timeout for prod)
- [ ] Resource monitor action is notify initially, then suspend — not immediate shutdown
- [ ] BigQuery max_bytes_billed set 2x expected query size for headroom
- [ ] Redshift concurrency scaling credits budgeted per month
- [ ] Cost spike alert with notification to engineering before bill doubles

---

# Testing Checklist

- [ ] Test BigQuery dry run cost matches actual execution cost within 10%
- [ ] Test Snowflake auto-suspend does not affect user dashboard experience
- [ ] Test resource monitor notifies before reaching suspension threshold
- [ ] Test pre-aggregated table query costs (credits scanned) vs raw table query
- [ ] Test query with max_bytes_billed exceeded returns clear error, not partial data
- [ ] Test cache hit ratio improves query cost over raw data scans

---

# Maintainability Checklist

- [ ] Warehouse cost budget documented per environment with expected monthly spend
- [ ] Query cost database (INFORMATION_SCHEMA.QUERY_HISTORY) queried weekly for anomaly detection
- [ ] Cost optimization runbook reviewed quarterly
- [ ] Dashboard query list prioritized for pre-aggregation based on cost
- [ ] Cloud cost management tool (CloudHealth, Vantage) configured for multi-warehouse tracking

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use SELECT * on wide tables in BigQuery — projects costs by column bytes
- [ ] Do not disable auto-suspend on non-production warehouses — largest cost leak
- [ ] Do not skip partitioning — unpartitioned BigQuery tables cost 10x more to query
- [ ] Do not add warehouses without resource monitor — allows unlimited spend
- [ ] Do not optimize for compute without considering storage costs (total cost of ownership)

---

# Production Readiness Checklist

- [ ] Prometheus/Grafana dashboard for warehouse daily cost, query cost distribution, anomalies
- [ ] Logged warning when single query cost exceeds defined threshold
- [ ] Alert when daily warehouse spend exceeds 80% of daily budget
- [ ] Monthly cost review scheduled with engineering and finance
- [ ] Deploy checklist includes cost impact assessment for new analytical queries
- [ ] Staging cost benchmark captured before production deployment for comparison

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: auto-suspend, cost-based query optimization, result caching, chargeback tagging
- [ ] Security requirements satisfied: resource monitors, query review for large scans, cost dashboard access
- [ ] Performance requirements satisfied: EXPLAIN dry-run, query profile review, pre-aggregation, lifecycle policy
- [ ] Testing requirements satisfied: cost estimation accuracy, auto-suspend non-impact, Resource monitor, cache efficacy
- [ ] Anti-pattern checks passed: no SELECT * on wide, auto-suspend on non-prod, partitioning required
- [ ] Production readiness verified: cost dashboard, per-query alerts, daily budget monitoring, monthly review

---

# Related References

- K013 (Snowflake/BigQuery Drivers): Connection setup where cost optimization begins
- K025 (Snowflake Warehouse Switching): Warehouse sizing strategy per workload
- K042 (Multi-Region ClickHouse): ClickHouse alternative — self-hosted cost structure vs cloud warehouses
