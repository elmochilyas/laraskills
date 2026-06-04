# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 05-olap-modeling
**Knowledge Unit:** scd-dimensions
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] SCD Type 1 (overwrite, no history) vs Type 2 (row versioning, full history) decision made per dimension
- [ ] SCD Type 3 (attribute addition) and Type 0 (retain) evaluated for edge cases
- [ ] Surrogate key + natural key strategy defined for dimension tables
- [ ] Current row marker implemented for Type 2 dimension filtering
- [ ] Late-arriving dimensions (K033) integrated with SCD strategy
- [ ] ETL Manifesto (K004) configured for SCD dimension loading

---

# Architecture Checklist

- [ ] Type 1 dimensions: attributes overwritten on change, no historical tracking
- [ ] Type 2 dimensions: new row inserted on change with effective_date, end_date, current_flag
- [ ] Surrogate key used as dimension PK (auto-increment), natural key for business identification
- [ ] Type 2 fact query uses effective_date between dimension start/end for point-in-time accuracy
- [ ] SCD implemented in Silver-to-Gold transformation (K014 Medallion)
- [ ] SCD dimension logic in ETL Manifesto config or dbt model, not ad-hoc scripts

---

# Implementation Checklist

- [ ] Type 2 dimension table: id (surrogate), natural_key, attr1, attr2, effective_date, end_date, current_flag
- [ ] Type 1 dimension table: id (surrogate), natural_key, attr1, attr2 (no date columns)
- [ ] SCD detection SQL: compare incoming hash with current row hash — if different, expire old, insert new
- [ ] Current row: current_flag = true OR end_date = '9999-12-31'
- [ ] Fact query joins on dimension natural_key and fact_date BETWEEN effective_date AND end_date
- [ ] SCD Type 3: previous_value and current_value columns for limited historical tracking

---

# Performance Checklist

- [ ] Surrogate key indexed for fact-to-dimension join performance
- [ ] effective_date + end_date indexed for Type 2 point-in-time joins
- [ ] current_flag indexed for current-row-only queries (99% of dashboard queries)
- [ ] Hash comparison (MD5 of concatenated attributes) optimized — compute in DB, not PHP
- [ ] Type 2 dimension row count growth rate projected and monitored
- [ ] MergeTree ORDER BY optimized for date + natural_key in ClickHouse

---

# Security Checklist

- [ ] Historical dimension data with PII access-controlled (Type 2 preserves all attribute versions)
- [ ] Surrogate keys do not expose internal sequence numbers to end users
- [ ] SCD detection hash does not include sensitive columns
- [ ] Current_row marker used for data masking — expired rows with PII can be restricted
- [ ] SCD update process logs all changes for audit trail

---

# Reliability Checklist

- [ ] SCD Type 2 idempotent — re-running dimension load does not create duplicate rows
- [ ] Overlapping effective date ranges detected and prevented
- [ ] Concurrent dimension updates handled (SELECT ... FOR UPDATE or upsert pattern)
- [ ] Type 1 overwrite does not delete rows — uses UPDATE properly
- [ ] SCD replay from source possible — rebuild all dimension versions from event history

---

# Testing Checklist

- [ ] Test Type 1 overwrite changes attribute value without adding row
- [ ] Test Type 2 insert creates new row and expires old row correctly
- [ ] Test point-in-time fact query returns correct dimension value for given date
- [ ] Test current_flag filter returns only active rows
- [ ] Test SCD detection hash correctly identifies changed vs unchanged attributes
- [ ] Test SCD replay — rebuild all dimension versions from source data

---

# Maintainability Checklist

- [ ] SCD type decision documented per dimension column in data dictionary
- [ ] SCD detection logic in dbt generic test or macro for reuse
- [ ] Type 2 dimension row count tracked to predict storage growth
- [ ] Surrogate key sequence documented for data lineage
- [ ] SCD loading SQL parameterized by dimension — no hardcoded column lists

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use Type 2 for all dimensions — Type 1 is cheaper and sufficient for non-critical attributes
- [ ] Do not use natural key as surrogate key — natural keys change, surrogate keys never change
- [ ] Do not skip current_flag on Type 2 — querying without it requires end_date IS NULL filter
- [ ] Do not update Type 2 end_date without setting current_flag = false
- [ ] Do not join fact to Type 2 dimension without effective/end date — returns multiple rows

---

# Production Readiness Checklist

- [ ] Prometheus metrics for SCD load row count (inserts = changes detected)
- [ ] Logged warning when Type 2 row insert rate spikes (possible dimension attribute thrashing)
- [ ] Alert if SCD load detects no changes for expected volatile dimensions
- [ ] Type 2 dimension storage growth projected monthly
- [ ] Deploy checklist includes SCD type verification for new dimensions
- [ ] Staging SCD load validates detection logic with known changed attributes

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: Type 1 vs Type 2 decision per dimension, Silver-to-Gold implementation
- [ ] Security requirements satisfied: historical PII access control, surrogate key privacy, audit trail
- [ ] Performance requirements satisfied: indexed surrogate keys, effective_date, current_flag, hash in DB
- [ ] Testing requirements satisfied: Type 1/2 correctness, point-in-time accuracy, detection hash, replay
- [ ] Anti-pattern checks passed: selective Type 2 usage, natural != surrogate key, current_flag present
- [ ] Production readiness verified: row count metrics, thrashing alerts, storage projections, staging validation

---

# Related References

- K006 (Star Schema): Dimension modeling fundamentals that SCD extends
- K033 (Late-Arriving Dimensions): Fact loading when facts arrive after their related dimension has changed
- K014 (Medallion Architecture): SCD is typically implemented in the Silver-to-Gold transformation
- K004 (ETL Manifesto): ETL framework that supports SCD dimension configuration
