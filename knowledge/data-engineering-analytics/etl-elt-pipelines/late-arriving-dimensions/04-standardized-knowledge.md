# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 03-etl-elt-pipelines
**Knowledge Unit:** late-arriving-dimensions
**Difficulty:** Intermediate
**Category:** Data Modeling
**Last Updated:** 2026-06-03

---

# Overview

Late-arriving dimensions occur when a fact record references a dimension key that hasn't been loaded yet. For example, an order references `customer_id = 12345`, but the customer profile hasn't arrived from the CRM system. In traditional star-schema ETL, dimensions must exist before facts reference them — but in real-world data pipelines, facts and dimensions arrive from different sources at different times.

The engineering challenge is handling this temporal mismatch without blocking fact loading or corrupting dimension references. Three primary strategies exist: **placeholder rows** (insert a sentinel dimension row on first reference), **deferred resolution** (store the natural key and resolve the dimension later), and **reprocessing** (load facts with null dimension keys and retroactively update when the dimension arrives).

Engineers must care because late-arriving dimensions are the rule, not the exception, in real-world analytics pipelines. CRM data arrives minutes after orders. Product catalogs update hours after purchases. Handling these delays correctly is the difference between accurate analytics and data with mysterious nulls.

---

# Core Concepts

## Late-Arriving Dimension

A dimension record that arrives after the fact record that references it. The fact is "early" because it was loaded before its related dimension was available.

## Placeholder Row Strategy

When a fact references a dimension key that doesn't exist, the ETL inserts a "placeholder" or "unknown member" row into the dimension table with that key and default attribute values. When the real dimension record arrives, the placeholder is updated (Type 1) or superseded (Type 2).

## Deferred Resolution Strategy

The fact table stores the natural key (not the surrogate key) for unresolved dimensions. A separate resolution process periodically matches natural keys to dimension rows and backfills the surrogate key into the fact table.

## Reprocessing Strategy

Facts are loaded with null dimension foreign keys. When the dimension arrives, facts referencing that natural key are reprocessed to set the correct foreign key. This requires the ETL pipeline to support selective reprocessing.

---

# When To Use

- Multi-source data pipelines where dimensions and facts arrive from different systems
- CRM data that arrives after transactional data
- Product catalog feeds that are updated asynchronously from orders
- User profile enrichment where base events arrive before full profile data
- Any pipeline where source systems have independent timing

---

# When NOT To Use

- All data arrives from a single source in correct order (dimensions before facts)
- Dimensions are created in the same transaction as facts (synchronous creation)
- The dimension table is very small and can be pre-loaded before facts
- Late-arriving data is exceptionally rare and can be handled manually

---

# Best Practices

## Always Have a Placeholder Row

Every dimension table should have a placeholder row (surrogate key 0 or -1, natural key "Unknown" or `__missing__`). Facts referencing unknown dimensions can safely point to this row until the real dimension arrives.

## Use Natural Keys in Facts

Store the natural key alongside the surrogate key in fact tables. This enables deferred resolution without joining back to the dimension table. The natural key is the join key for the late-arriving resolution process.

## Implement Idempotent Resolution

The resolution process (backfilling fact foreign keys) must be idempotent. Running it multiple times should produce the same result. This enables safe retries and scheduled execution.

## Log All Late-Arriving Events

Every late-arriving dimension event should be logged: fact ID, dimension type, natural key, resolution timestamp, and previous/current dimension values. This audit trail helps debug data quality issues.

---

# Architecture Guidelines

## Layer Placement

Late-arriving dimension handling belongs in the Silver layer of the medallion architecture. Facts land in Bronze with natural keys. Silver resolves dimensions and sets correct foreign keys.

## Resolution Pipeline

1. Fact arrives in Bronze with natural key
2. Silver layer checks: does the dimension row exist?
3. If yes: set surrogate key, proceed
4. If no: set placeholder key, queue for resolution
5. Dimension arrives later: resolve queued facts, update surrogate keys

## Combined Pattern with SCD

Late-arriving dimensions often combine with slowly changing dimensions. When a late-arriving dimension finally arrives, it may have effective dates that overlap existing placeholder records. The SCD merge logic must handle this overlap.

---

# Performance Considerations

- Placeholder lookup is a single query per fact; use caching in ETL jobs.
- Deferred resolution requires batch updates on fact tables; use chunked updates to avoid long-running transactions.
- Reprocessing historical facts can be expensive. Limit reprocessing windows or use incremental resolution.
- Index natural keys on both fact and dimension tables for the resolution query.

---

# Security Considerations

- Placeholder rows may contain null or default values. Ensure these defaults do not inadvertently expose data from other tenants or users.
- The resolution process must respect row-level security. A late-arriving dimension resolution should not grant access to facts the user should not see.
- Audit logging of resolution changes is essential for compliance.

---

# Common Mistakes

## Mistake: No Placeholder Row

The fact insert fails with a foreign key violation when the dimension doesn't exist. The entire batch of facts is rejected, including facts that have valid dimension references.

**Better approach:** Always create a placeholder dimension row before fact loading. Use surrogate key 0 or -1 for "unknown."

## Mistake: Assuming Dimensions Arrive First

The ETL processes dimensions before facts, but a source system sends a fact with a dimension key that hasn't arrived yet. The ETL fails silently or blocks further processing.

**Better approach:** Design all ETL pipelines assuming dimensions may arrive after facts. Implement one of the three strategies by default.

## Mistake: Single Resolution Pass

The resolution process runs once and assumes all dimensions have arrived. Facts that reference dimensions arriving later are never resolved and remain as placeholder rows permanently.

**Better approach:** Run the resolution process on a schedule or trigger it when new dimension data arrives. Log unresolved facts for monitoring.

---

# Anti-Patterns

## Blocking Fact Loading
The ETL pipeline blocks fact loading until all referenced dimensions exist. Facts pile up in a staging table, and dashboard latency increases as dimensions take longer to arrive.

**Solution:** Load facts immediately with placeholder or null dimension keys. Resolve later.

## Rewriting History Without Audit
When a late-arriving dimension arrives, the fact table is updated with the correct surrogate key, but no audit record is created. If the dimension data was wrong and subsequently corrected, the fact history is lost.

**Solution:** Log all late-arriving dimension resolution events. Track before and after values. Consider using SCD Type 2 for the dimension to retain full history.

## Ignoring Late-Arriving Dimensions in Star Schema Design
The star schema is designed without considering late-arriving dimensions. Foreign key constraints prevent fact loading. Schema redesign is required to accommodate real-world data timing.

**Solution:** Design all star schemas with late-arriving dimensions in mind from the start. Use nullable foreign keys or placeholder rows by default.
