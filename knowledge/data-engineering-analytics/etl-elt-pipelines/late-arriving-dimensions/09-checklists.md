# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 03-etl-elt-pipelines
**Knowledge Unit:** late-arriving-dimensions
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Late-arriving dimension strategy selected (placeholder row, re-processing, or dimension bridge)
- [ ] Early-arriving fact handling configured — facts referencing unknown dimension keys accepted
- [ ] Unknown member / placeholder row created in dimension tables for unmatched references
- [ ] Re-processing / retroactive update mechanism defined when late dimension arrives
- [ ] Dimension bridge / mapping table strategy evaluated for high-latency sources
- [ ] Combined late-arriving + SCD Type 1/2 pattern designed (K030 integration)

---

# Architecture Checklist

- [ ] Fact tables allow NULL or default dimension foreign keys for early-arriving facts
- [ ] Placeholder row (e.g., id=0, name='Unknown') seeded in each dimension table
- [ ] Dimension bridge table resolves late-arriving updates without key cascade
- [ ] Re-processing pipeline idempotent — re-running updates corrects existing facts
- [ ] Late-arriving handling placed in Silver layer, not Bronze (K014 integration)
- [ ] Star schema fact/dimension model accounts for late-arriving inserts (K006 integration)

---

# Implementation Checklist

- [ ] Unknown member row inserted during dimension table creation with sentinel values
- [ ] Fact load SQL uses COALESCE or LEFT JOIN to map unknown keys to placeholder
- [ ] Dimension bridge table stores old_key -> new_key mapping for retroactive updates
- [ ] Re-processing job scans fact table for placeholder keys, updates when dimension arrives
- [ ] Retroactive update batch-size limited to prevent lock contention on fact table
- [ ] SCD Type 2 effective-dating combined with late-arriving — historical facts not overwritten

---

# Performance Checklist

- [ ] Placeholder row lookup is constant time (small dimension table, all rows cached)
- [ ] Re-processing uses batched updates, not single-row per dimension arrival
- [ ] Dimension bridge lookup indexed on old_key for fast join during re-processing
- [ ] Retroactive update window limited (e.g., last 7 days) to bound processing time
- [ ] MergeTree ORDER BY accounts for dimension key updates in ClickHouse

---

# Security Checklist

- [ ] Placeholder row not exposed to end-user dashboards — filtered in mart layer
- [ ] Dimension bridge table access restricted to ETL pipeline only
- [ ] Retroactive update tracked with audit columns (updated_by, updated_at)
- [ ] Unknown member values do not contain PII or sensitive default text
- [ ] Re-processing logged for data lineage tracing

---

# Reliability Checklist

- [ ] Fact load does not fail when dimension key not found — defaults to placeholder
- [ ] Re-processing idempotent — applying same dimension update twice produces same result
- [ ] Dimension bridge handles multiple late-arriving updates per dimension key
- [ ] Retroactive update fails gracefully if fact table locked by concurrent load
- [ ] Re-processing progress tracked via job status table for resumability

---

# Testing Checklist

- [ ] Test fact inserted with unknown dimension key uses placeholder row correctly
- [ ] Test re-processing updates placeholder references when dimension arrives
- [ ] Test dimension bridge correctly maps old keys to new keys
- [ ] Test retroactive update does not overwrite non-placeholder references
- [ ] Test combined SCD + late-arriving: updated dimension does not change historical fact counts
- [ ] Test large batch re-processing completes within expected window

---

# Maintainability Checklist

- [ ] Late-arriving strategy documented per dimension in data model catalog
- [ ] Placeholder row values documented and consistent across all dimensions
- [ ] Re-processing job scheduled and idempotent — safe to run on schedule
- [ ] Dimension bridge table maintained alongside dimension table in dbt model
- [ ] Strategy decision (placeholder vs bridge vs re-process) documented per source system

---

# Anti-Pattern Prevention Checklist

- [ ] Do not fail fact load on missing dimension key — use placeholder row
- [ ] Do not update all historical facts — apply re-processing window to bound work
- [ ] Do not skip placeholder seeding — fact load breaks without sentinel row
- [ ] Do not use same placeholder for dimension-not-found and null-meaningful
- [ ] Do not re-process facts without idempotency guard — can double-update

---

# Production Readiness Checklist

- [ ] Prometheus metric for placeholder reference count over time (trending down = good)
- [ ] Logged warning when placeholder count increases (late-arriving dimension pattern)
- [ ] Alert when re-processing window exceeds expected duration
- [ ] Re-processing job monitored for row-count drift between runs
- [ ] Deploy checklist includes re-processing trigger for new dimension sources
- [ ] Late-arriving dimension SLA defined per source system (max delay before dimension arrives)

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: placeholder/ignore/bridge strategy, Silver layer handling, star schema compatibility
- [ ] Security requirements satisfied: placeholder not in dashboards, bridge table restricted, audit columns
- [ ] Performance requirements satisfied: batched updates, indexed lookups, bounded window, optimize ORDER BY
- [ ] Testing requirements satisfied: placeholder insertion, retroactive update, bridge mapping, SCT coexistence
- [ ] Anti-pattern checks passed: no fact load failure, bounded window, placeholder seeded, meaningful nulls separate
- [ ] Production readiness verified: placeholder metrics, re-processing alerts, SLA per source, deploy checklist

---

# Related References

- K006 (Star Schema): Fact/dimension modeling context for late-arriving strategies
- K014 (Medallion Architecture): Late-arriving dimensions are handled in Silver layer
- K030 (SCD Type 1/2): Combined pattern — late-arriving + slowly changing dimensions
