# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 03-etl-elt-pipelines
**Knowledge Unit:** dbt-incremental-models
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] dbt incremental model strategy chosen per model (merge, append, insert_overwrite)
- [ ] is_incremental() block correctly scoped for initial full-refresh vs incremental runs
- [ ] Unique key defined for merge strategy to handle upserts
- [ ] Full-refresh fallback mechanism understood and tested
- [ ] Incremental model placement mapped to Medallion layer (Silver incremental, Gold append/merge)
- [ ] dbt_project.yml materialization config set per model

---

# Architecture Checklist

- [ ] Merge strategy chosen for models needing upsert (update existing + insert new)
- [ ] Append strategy chosen for append-only event models (no updates)
- [ ] Insert_overwrite strategy chosen for partition-level replacement (large tables)
- [ ] is_incremental() guard wrapped around incremental logic, not model definition
- [ ] Incremental models reference upstream models in dependency order
- [ ] Medallion architecture respected — Bronze raw, Silver cleaned incremental, Gold aggregated

---

# Implementation Checklist

- [ ] model.sql configured with {{{{ config(materialized='incremental') }}}} directive
- [ ] is_incremental() block filters source on max(loaded_at) from existing table
- [ ] unique_key defined for merge strategy in config block
- [ ] on_schema_change configured for handling column additions (sync_all_columns or append_new_columns)
- [ ] insert_overwrite strategy with partition_by for large partition-level refreshes
- [ ] Full refresh tested: dbt run --full-refresh --select model_name

---

# Performance Checklist

- [ ] Incremental filter column (loaded_at, updated_at) indexed in source table
- [ ] Merge strategy tested for performance on large datasets — deadlocks avoided
- [ ] insert_overwrite partition granularity chosen to balance granularity vs partition count
- [ ] unique_key uniqueness validated to avoid merge conflicts
- [ ] Full refresh scheduled for low-traffic periods, not during business hours
- [ ] dbt model performance profiled with --explain flag for query plan review

---

# Security Checklist

- [ ] Incremental model source access scoped via dbt source freshness checks
- [ ] Sensitive columns masked in incremental models before writing to Silver/Gold
- [ ] dbt profile credentials scoped to read-only for source connection
- [ ] Unique key not based on user PII — use surrogate keys
- [ ] dbt model access reviewed: protected models not exposed to downstream consumers

---

# Reliability Checklist

- [ ] Full refresh tested with source schema changes (column added/removed)
- [ ] on_schema_change fail configured for breaking changes, append_new_columns for additive changes
- [ ] dbt run --fail-fast configured to stop on first model failure
- [ ] Unique key constraint enforced at database level for merge targets
- [ ] Incremental backfill procedure documented for reprocessing historical data

---

# Testing Checklist

- [ ] Test incremental run inserts new rows without duplicating existing ones
- [ ] Test merge upsert updates changed rows and inserts new rows correctly
- [ ] Test full refresh produces identical data to incremental run
- [ ] Test insert_overwrite replaces affected partitions without touching others
- [ ] Test on_schema_change behavior when columns added to source
- [ ] Test dbt source freshness for upstream table staleness detection

---

# Maintainability Checklist

- [ ] Model config and incremental logic in separate YAML / SQL, not mixed
- [ ] is_incremental() filter column configurable via variable, not hardcoded
- [ ] Unique key definition documented with rationale (natural vs surrogate key)
- [ ] dbt_project.yml has clear materialization overrides per model folder
- [ ] Incremental strategy decision documented per model in model YAML comments

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use merge strategy without unique_key — leads to duplicates
- [ ] Do not put non-incremental-safe logic inside is_incremental() block
- [ ] Do not hardcode date ranges in incremental filters — use max(loaded_at)
- [ ] Do not forget full-refresh path for initial load and schema migrations
- [ ] Do not mix incremental strategies within same model — choose one

---

# Production Readiness Checklist

- [ ] dbt run timing metrics collected per model (Prometheus via dbt artifacts)
- [ ] Logged warning when incremental row count drops >50% (possible filter issue)
- [ ] Alert on dbt test failures for unique, not_null on incremental model columns
- [ ] Full refresh runbook documented for each incremental model
- [ ] Deploy checklist includes dbt run --full-refresh for modified models
- [ ] Staging dbt run validates incremental logic before production run

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: strategy choice per model, is_incremental() scoping, layer alignment
- [ ] Security requirements satisfied: scoped source access, column masking, PII-free keys
- [ ] Performance requirements satisfied: indexed filter columns, match-level merge, granular partition
- [ ] Testing requirements satisfied: incremental vs full-refresh parity, merge correctness, schema change handling
- [ ] Anti-pattern checks passed: unique_key present for merge, no hardcoded dates, single strategy per model
- [ ] Production readiness verified: timing metrics, row count anomaly alerts, test failures, deploy checklist

---

# Related References

- K014 (Medallion Architecture): dbt models implement Bronze-to-Silver-to-Gold transformations
- K028 (dbt Project Structure): Organizing dbt models, tests, and documentation
- K043 (dbt Semantic Layer): Metric definitions built on top of dbt models
