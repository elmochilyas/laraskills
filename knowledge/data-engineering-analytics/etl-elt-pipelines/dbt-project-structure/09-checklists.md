# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 03-etl-elt-pipelines
**Knowledge Unit:** dbt-project-structure
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] dbt project organized by staging/intermediate/marts layers mapping to Bronze/Silver/Gold
- [ ] Sources YAML defined for all upstream raw tables with freshness configuration
- [ ] Schema YAML per model folder defining columns, tests, and descriptions
- [ ] Generic tests (unique, not_null, accepted_values, relationships) applied per model
- [ ] Staging models: one-to-one with source tables, minimal transformations, column renaming
- [ ] Mart models: business-facing aggregations built on intermediate models

---

# Architecture Checklist

- [ ] Staging directory mirrors source system structure (staging/{source_system}/)
- [ ] Intermediate directory contains business logic transforms between staging and marts
- [ ] Mart directory organized by business domain (marketing, sales, product)
- [ ] Sources YAML defines databases/schemas/tables with loaded_at_field for freshness
- [ ] Schema YAML files co-located with model SQL files in folder hierarchy
- [ ] dbt_project.yml sets materialization defaults per directory (view for staging, table for marts)

---

# Implementation Checklist

- [ ] Staging SQL: SELECT with column renaming, casting, and coalescing only
- [ ] Intermediate SQL: business logic joins, filtering, deduplication on cleaned staging data
- [ ] Mart SQL: aggregation, window functions, pre-joined dimensions on intermediate models
- [ ] sources.yml: one file per source system defining all tables and freshness
- [ ] schema.yml: columns named, typed, tested (unique, not_null) per stage
- [ ] Generic tests configured for key business rules (referential integrity, accepted values)

---

# Performance Checklist

- [ ] Staging models materialized as views (no data duplication, passthrough)
- [ ] Intermediate models materialized as ephemeral or views (composed at query time)
- [ ] Mart models materialized as tables or incremental for dashboard performance
- [ ] dbt test execution not on critical path — tests run in CI/CD, not production
- [ ] Model selection and deferral used in development to avoid rebuilding full DAG
- [ ] dbt docs serve provides visual DAG for performance bottleneck identification

---

# Security Checklist

- [ ] Sources YAML credentials reference profile with read-only access
- [ ] Sensitive source columns excluded or masked in staging models
- [ ] Schema YAML not exposing PII column descriptions to end users
- [ ] dbt project access controlled via repository permissions
- [ ] Artifacts (manifest.json, run_results.json) not committed to repository

---

# Reliability Checklist

- [ ] Source freshness thresholds set per table with warning and error severity
- [ ] dbt source freshness run in CI to catch upstream ingestion delays
- [ ] Generic test failures block promotion to production
- [ ] Model dependency resolution automated via ref() — no hardcoded table names
- [ ] dbt build runs models and their tests in dependency order

---

# Testing Checklist

- [ ] Test all staging models have at least unique and not_null tests on primary key
- [ ] Test intermediate model referential integrity (relationships test) to staging parents
- [ ] Test mart model row counts are non-zero after full refresh
- [ ] Test source freshness detects stale upstream tables
- [ ] Test dbt run with --select tag:my_tag for staged rollouts
- [ ] Test dbt docs generate produces navigable documentation site

---

# Maintainability Checklist

- [ ] Staging model naming: stg_{source_system}_{entity}
- [ ] Intermediate model naming: int_{domain}_{purpose}
- [ ] Mart model naming: {dim/fact}_{entity}
- [ ] Schema YAML descriptions complete for each column in mart models
- [ ] model directory structure documented in project README
- [ ] dbt_project.yml organized by folder path with clear materialization rules

---

# Anti-Pattern Prevention Checklist

- [ ] Do not place business logic in staging models — staging is for renaming/casting only
- [ ] Do not use ref() to bypass intermediate layer — staging -> mart direct creates spaghetti DAG
- [ ] Do not skip schema.yml for any model — column docs and tests required
- [ ] Do not hardcode table names — always use ref() or source()
- [ ] Do not mix materialization strategies across environments — use dbt_project.yml env targets

---

# Production Readiness Checklist

- [ ] dbt docs served in CI/CD for data team review
- [ ] Source freshness monitored as part of pipeline health dashboard
- [ ] Generic test failure alerts sent to data engineering team
- [ ] dbt manifest.json archived for historical lineage tracking
- [ ] Deploy checklist includes dbt build on staging with --full-refresh for schema changes
- [ ] Model selection strategy documented for CI/CD (slim CI vs full run)

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: staging/intermediate/marts layers, sources YAML, co-located schema
- [ ] Security requirements satisfied: read-only source access, PII exclusion, artifact handling
- [ ] Performance requirements satisfied: view materialization for staging, table for marts, deferral
- [ ] Testing requirements satisfied: primary key tests, referential integrity, sourc freshness, dbt docs
- [ ] Anti-pattern checks passed: no logic in staging, ref() usage only, schema YAML for all models
- [ ] Production readiness verified: docs served, freshness alerts, test failures, slim CI strategy

---

# Related References

- K014 (Medallion Architecture): The structural pattern dbt models implement
- K015 (dbt Incremental Models): Implementation details for incremental strategies
- K043 (dbt Semantic Layer): Building metrics on top of dbt marts
