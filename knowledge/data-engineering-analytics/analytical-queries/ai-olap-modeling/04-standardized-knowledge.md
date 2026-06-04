# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 09-analytical-queries
**Knowledge Unit:** ai-olap-modeling
**Difficulty:** Advanced
**Category:** AI-Enhanced Analytics
**Last Updated:** 2026-06-03

---

# Overview

AI-assisted OLAP modeling uses large language models (LLMs) to analyze query patterns, optimize star-schema designs, suggest materialized views, select compression codecs, and recommend partition strategies based on actual workload. The approach treats schema optimization as a data problem — feed query logs, table statistics, and current schema to an LLM, and receive data-driven recommendations. For Laravel analytics platforms, this is particularly powerful because the LLM can analyze both Eloquent query patterns (from the application layer) and warehouse query logs (from ClickHouse/Snowflake) to suggest optimizations that neither layer alone would reveal.

Engineers must care because schema optimization is a continuous process, not a one-time design activity. Workloads change, query patterns evolve, and new data sources are added. AI-assisted modeling automates the feedback loop between query performance and schema optimization.

---

# Core Concepts

## Query Log Analysis

The LLM analyzes database query logs (pg_stat_statements, ClickHouse system.query_log) to identify slow queries, frequent access patterns, and join patterns. This analysis drives schema recommendations.

## Schema Recommendation

Based on query analysis, the LLM recommends schema changes: adding indexes, changing ORDER BY in MergeTree, restructuring star-schema dimensions, or denormalizing frequently joined columns.

## Materialized View Suggestion

The LLM identifies query patterns that would benefit from pre-computation and suggests materialized view definitions, including target table schema and refresh strategies.

## Cost Optimization

The LLM analyzes storage costs, compression ratios, and query performance to recommend codec changes, partition strategy adjustments, and data lifecycle policies (TTL, tiered storage).

## Automated Index/Codec Selection

The LLM evaluates table-level statistics (part size, compression ratio, query patterns) to recommend optimal codecs (LZ4, ZSTD, Delta) and index configurations (skip indexes, bloom filters).

---

# When To Use

- Large ClickHouse deployments with complex query workloads
- Star-schema databases requiring ongoing optimization
- Teams without dedicated database optimization expertise
- Workloads with rapidly changing query patterns
- Cost optimization initiatives for analytics infrastructure

---

# When NOT To Use

- Small databases (< 100GB) where manual optimization is sufficient
- Stable workloads with no query pattern changes
- Environments where LLM access is restricted
- Systems requiring immediate optimization (AI recommendations need validation)

---

# Best Practices

## Feed Real Query Logs

AI recommendations are only as good as the input data. Feed actual query logs (not sample queries) from production. Include query frequency, execution time, and resource usage.

## Validate Recommendations

AI recommendations must be validated in a staging environment before production deployment. Schema changes in ClickHouse (ORDER BY changes) require table recreation.

## Iterative Application

Apply AI recommendations incrementally — one change at a time — and measure the impact before applying the next. This isolates positive and negative effects.

## Combine With Manual Expertise

Use AI recommendations as input to expert decision-making, not as authoritative commands. Domain knowledge about data semantics and query intent cannot be fully captured in logs.

---

# Performance Considerations

- Query log analysis requires 7-30 days of data for meaningful patterns.
- LLM analysis time: 10-30 seconds per optimization cycle.
- Each recommendation requires validation testing (30-60 minutes).
- Iterative optimization cycle: 1-2 weeks per full optimization pass.

---

# Common Mistakes

## Mistake: No Query Log Data

AI recommendations are requested without feeding query logs. The LLM makes generic recommendations based on schema alone. Optimization impact is minimal.

**Better approach:** Collect 30 days of query logs. Feed them to the LLM with schema context. Recommendations are data-driven.

## Mistake: Applying All Recommendations Simultaneously

The LLM suggests changing ORDER BY, adding 3 materialized views, and switching codecs. All changes are applied at once. Performance improves but the specific contribution of each change is unknown.

**Better approach:** Apply one recommendation at a time. Measure performance after each change. Roll back if negative.

## Mistake: Ignoring Business Context

The LLM recommends denormalizing a frequently joined table. But the table is updated hourly by a separate pipeline. Denormalization would break the pipeline contract.

**Better approach:** Augment query log analysis with data pipeline documentation. Keep AI recommendations within constraints defined by data ownership and pipeline boundaries.

## Mistake: No Validation Environment

AI recommendations are applied directly to production. A recommended ORDER BY change requires table recreation. The table has 500GB of data. Migration takes 4 hours. Query performance degrades during migration.

**Better approach:** Validate all recommendations in a staging environment with production-scale data before applying to production.
