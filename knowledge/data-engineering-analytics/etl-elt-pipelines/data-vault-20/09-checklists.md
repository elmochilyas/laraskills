# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 03-etl-elt-pipelines
**Knowledge Unit:** data-vault-20
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Hub (business key), Link (relationship), and Satellite (context) constructs understood
- [ ] Data Vault 2.0 vs star schema decision made based on auditability and flexibility requirements
- [ ] PIT (Point-In-Time) table designed for temporal query patterns
- [ ] Bridge table designed for many-to-many relationship traversal
- [ ] Satellite effective-dating strategy defined (subsumes SCD Type 2)
- [ ] Data Vault layered in Medallion — Hubs/Links in Silver, Satellites in Silver detail

---

# Architecture Checklist

- [ ] Hub tables defined for each core business entity with natural business key as primary key
- [ ] Link tables normalize many-to-many and many-to-one relationships between hubs
- [ ] Satellite tables store descriptive attributes for hubs/links with effective date ranges
- [ ] PIT table materialized for querying state at any point in time
- [ ] Bridge table provides pre-joined paths through hub-link graph for query performance
- [ ] Data Vault layer placement in Medallion architecture decided (Silver replacement or complement)

---

# Implementation Checklist

- [ ] Hub schema: business_key (natural key), record_source, load_date, last_seen_date
- [ ] Link schema: hub_key references, record_source, load_date, effective_range (if temporal)
- [ ] Satellite schema: hub/link FK, effective_date, end_date, descriptive attributes, record_source
- [ ] PIT table built from satellite effective-dating with compact snapshot per hub
- [ ] Bridge table pre-computed via dbt or SQL for common access paths
- [ ] Parallel loading supported — hubs, links, satellites insertable concurrently

---

# Performance Checklist

- [ ] Hub business_key indexed for foreign key lookups from links and satellites
- [ ] Satellite effective_date range indexed for temporal query pruning
- [ ] PIT table materialized incremental to avoid full rebuild on each load
- [ ] Bridge table refreshed on schedule, not per-query, for consistent performance
- [ ] MergeTree ORDER BY optimized for hub key + load_date pattern in ClickHouse
- [ ] Satellite columns organized by change frequency (high-change vs static in separate satellites)

---

# Security Checklist

- [ ] Record_source column in hubs/links/satellites for lineage auditing
- [ ] Data Vault schema accessible only to ETL pipeline — not exposed to end-user dashboards
- [ ] Gold-layer views/marts constructed from Data Vault with row-level security
- [ ] PIT and bridge tables generation audited for correctness and completeness
- [ ] Sensitive columns in satellites identified and access-restricted

---

# Reliability Checklist

- [ ] Hub load is idempotent — re-inserting same business_key ignored (no duplicates)
- [ ] Link load handles concurrent inserts from multiple sources without collision
- [ ] Satellite inserts use effective_date to handle late-arriving attributes
- [ ] PIT rebuild handles overlapping date ranges in satellite records
- [ ] Bridge rebuild removes stale paths when hubs/links are deprecated

---

# Testing Checklist

- [ ] Test hub deduplication — same business_key from different sources does not duplicate
- [ ] Test link relationship integrity — hub foreign keys reference existing records
- [ ] Test satellite effective-dating — overlapping dates handled correctly
- [ ] Test PIT query returns correct state at any historical point in time
- [ ] Test bridge pre-join produces correct rows for common query patterns
- [ ] Test parallel load — concurrent hub, link, satellite inserts succeed

---

# Maintainability Checklist

- [ ] Hub/Link/Satellite generation automated via dbt macros or code generation
- [ ] Data Vault model documented with entity-relationship diagram
- [ ] PIT rebuild logic in scheduled dbt model, not ad-hoc script
- [ ] Naming convention: hub_{entity}, link_{entity1}_{entity2}, sat_{entity}_{context}
- [ ] Source-to-target mapping documented for each hub/link/satellite

---

# Anti-Pattern Prevention Checklist

- [ ] Do not put descriptive attributes in hubs — hubs hold only business key and metadata
- [ ] Do not use surrogate keys as hub primary key — natural business key is the hub PK
- [ ] Do not put relationships in satellites — relationships belong in links
- [ ] Do not skip record_source — every row needs source lineage
- [ ] Do not query Data Vault directly from dashboards — use Gold layer marts

---

# Production Readiness Checklist

- [ ] Prometheus metrics for Data Vault load timing per hub/link/satellite
- [ ] Logged warning when record_source count shows unexpected new source
- [ ] Alert if hub key deduplication detects same business key from conflicting sources
- [ ] PIT rebuild monitored for completion time and row count consistency
- [ ] Deploy checklist includes Data Vault layer verification after schema migration
- [ ] Data lineage report available for audit (record_source chain per record)

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: hub/link/satellite separation, PIT/bridge design, Medallion placement
- [ ] Security requirements satisfied: record_source lineage, restricted direct access, column-level security
- [ ] Performance requirements satisfied: indexed keys, incremental PIT, ordered MergeTree, change-frequency satellites
- [ ] Testing requirements satisfied: deduplication, relationship integrity, temporal queries, parallel loads
- [ ] Anti-pattern checks passed: no attributes in hubs, natural key PK, record_source everywhere
- [ ] Production readiness verified: timing metrics, source lineage alerts, PIT monitoring, deploy verification

---

# Related References

- K006 (Star Schema): Contrast — Data Vault vs star schema decision framework
- K014 (Medallion Architecture): Data Vault can replace or complement medallion — Hubs/Links approx. Silver, Satellites approx. Silver detail
- K029 (Temporal Queries): PIT tables enable temporal query patterns
- K030 (SCD Type 1/2): Data Vault's satellite effective-dating subsumes SCD Type 2
