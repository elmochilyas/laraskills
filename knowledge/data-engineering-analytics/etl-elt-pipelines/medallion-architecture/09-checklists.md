# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 03-etl-elt-pipelines
**Knowledge Unit:** medallion-architecture
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Bronze (raw, append-only, immutable), Silver (cleaned, deduplicated, validated), Gold (aggregated, marts) understood
- [ ] Data promotion path from Bronze to Silver to Gold designed
- [ ] ETL Manifesto feeds Bronze layer, dbt transforms to Silver/Gold (K004, K015 integration)
- [ ] Late-arriving dimension handling in Silver layer (K033 integration)
- [ ] Incremental processing strategy for Silver and Gold layers
- [ ] Data Vault 2.0 evaluated as alternative to Medallion (K044 integration)

---

# Architecture Checklist

- [ ] Bronze layer: append-only, immutable, raw data as received (schema-on-read)
- [ ] Silver layer: cleaned, deduplicated, validated, conformed dimensions
- [ ] Gold layer: aggregated, pre-joined, business marts for dashboards
- [ ] Data promotion (Bronze -> Silver -> Gold) incremental, not full daily reload
- [ ] Schema evolution at Bronze does not break downstream Silver/Gold
- [ ] Each layer has separate storage (separate ClickHouse DBs or schemas)

---

# Implementation Checklist

- [ ] Bronze table defined with raw data columns + metadata (ingested_at, source, batch_id)
- [ ] Silver table defined with cleaned types, deduplication logic, validated constraints
- [ ] Gold table defined with aggregations, pre-joins, business-friendly column names
- [ ] dbt models map to layers: staging = Bronze, intermediate = Silver, marts = Gold
- [ ] Incremental model configured for Silver/Gold with appropriate strategy (K015)
- [ ] Late-arriving dimension placeholder row seeded in Silver (K033)

---

# Performance Checklist

- [ ] Bronze tables use low-compression codecs (LZ4) for fast write, no indexing
- [ ] Silver tables use indexed columns for deduplication and join performance
- [ ] Gold tables use pre-aggregated data for dashboard sub-second queries
- [ ] Data promotion batch-size tuned per layer to balance latency and throughput
- [ ] MergeTree ORDER BY optimized per layer — ingestion time for Bronze, query keys for Gold

---

# Security Checklist

- [ ] Bronze accessible only to ETL pipeline — raw data may contain PII
- [ ] Silver access controlled with masking for sensitive columns
- [ ] Gold accessible to dashboard consumers with row-level security per business unit
- [ ] Data lineage tracked: record_source column in all layers for audit
- [ ] Layer isolation prevents accidental direct Bronze query from application

---

# Reliability Checklist

- [ ] Bronze insert-only — no update/delete to preserve raw audit trail
- [ ] Silver deduplication idempotent — re-running produces same cleaned set
- [ ] Gold rebuild tolerant of Silver schema changes (backward-compatible aggregations)
- [ ] Data promotion failure does not affect downstream layer reads (last-good-data available)
- [ ] Layer pipeline can restart from point of failure (incremental checkpoint)

---

# Testing Checklist

- [ ] Test Bronze insert produces immutable, append-only rows
- [ ] Test Silver deduplication with duplicate input — deduped correctly
- [ ] Test Gold aggregation results match manual calculation
- [ ] Test incremental promotion from Bronze to Silver produces incremental only
- [ ] Test Silver validation rejects malformed data from Bronze
- [ ] Test full pipeline restart from checkpoint does not duplicate or skip rows

---

# Maintainability Checklist

- [ ] Layer directory structure in dbt project: staging (Bronze), intermediate (Silver), marts (Gold)
- [ ] Data promotion logic in dbt models, not in ad-hoc SQL scripts
- [ ] Each layer documented with schema version, owner, and SLA
- [ ] Column naming convention per layer: bronze_{source}_{field}, silver_{field}, gold_{field}
- [ ] Layer dependency graph documented and checked in CI

---

# Anti-Pattern Prevention Checklist

- [ ] Do not update Bronze — it is append-only; corrections happen in Silver
- [ ] Do not skip Silver and build Gold directly from Bronze — bypasses validation
- [ ] Do not make Silver depend on Gold — layers are directional
- [ ] Do not use same storage tier for all layers — Bronze cheap, Gold performant
- [ ] Do not query Bronze from application — always use Silver or Gold

---

# Production Readiness Checklist

- [ ] Prometheus metrics for Bronze ingestion rate, Silver dedup rate, Gold query latency
- [ ] Logged warning when Silver deduplication detects >5% duplicates
- [ ] Alert when data promotion pipeline fails for any layer
- [ ] Bronze retention policy defined (raw data purged after N days)
- [ ] Deploy checklist includes layer isolation verification and schema migration test
- [ ] Runbook for layer recovery: rebuild Silver from Bronze, then Gold from Silver

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: three-layer separation, incremental promotion, schema evolution at Bronze
- [ ] Security requirements satisfied: Bronze pipeline-only, Silver masking, Gold row-level security, lineage tracking
- [ ] Performance requirements satisfied: write-optimized Bronze, indexed Silver, pre-aggregated Gold, batched promotion
- [ ] Testing requirements satisfied: immutability, deduplication, aggregation accuracy, checkpoint restart
- [ ] Anti-pattern checks passed: Bronze append-only, no direct Gold-from-Bronze, directional layers
- [ ] Production readiness verified: layer metrics, duplicate detection, pipeline failure alerts, retention policy

---

# Related References

- K004 (ETL Manifesto): Extracts from sources — feeds Bronze layer
- K015 (dbt Incremental Models): dbt's incremental strategy for Silver/Gold
- K033 (Late-Arriving Dimensions): Handling delayed data in Silver layer
- K044 (Data Vault 2.0): Alternative to Medallion with Hubs/Links/Satellites
