# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 05-olap-modeling
**Knowledge Unit:** scd-dimensions
**Difficulty:** Intermediate
**Category:** Dimension Management
**Last Updated:** 2026-06-03

---

# Overview

Slowly Changing Dimensions (SCD) manage how dimension tables handle attribute changes over time in a star schema. Type 1 overwrites the attribute, losing history. Type 2 preserves history by adding new rows with date-effective ranges. The choice between Type 1, Type 2, Type 3, and Type 0 determines whether historical fact attribution changes when dimension attributes are updated.

The core engineering challenge: a customer changes their region from "North" to "South". If the dimension is Type 1, all historical sales for that customer now show "South". If Type 2, historical sales still show "North". The choice depends on whether analysis requires "as-was" attribution.

Engineers must care because the wrong SCD strategy produces incorrect analytics. Type 1 over-reporting: a customer's region change retroactively applies to all past sales, inflating "South" performance and deflating "North". Type 2 under-reporting: analysts must remember to filter by effective dates.

---

# Core Concepts

## SCD Type 1 (Overwrite)

The dimension row is updated in place. Previous attribute values are lost. Historical fact attribution changes retroactively. Simplest to implement. Use when historical accuracy of attribution is not required.

## SCD Type 2 (Row Versioning)

A new dimension row is inserted when an attribute changes. Each row has effective dates and a current flag. Historical facts point to the version that was current at the time. Most common SCD type in data warehousing.

## SCD Type 3 (Attribute Addition)

A "previous value" column is added to the dimension row. Only the current and immediately previous values are tracked. Useful for tracking limited history without row versioning.

## SCD Type 0 (Retain)

The attribute is never changed after initial loading. The dimension row is immutable once created. Use for attributes that should never change (date of birth, original source system ID).

## Surrogate Key + Natural Key

SCD always requires surrogate keys. The natural key identifies the real-world entity. The surrogate key identifies the specific version. Facts store the surrogate key for the dimension version that was current at the time.

## Current Row Marker

A boolean column or a NULL expiry date indicating which dimension row is the current version. Only one row per natural key should be current at any time.

---

# When To Use

- Type 1: Non-critical attributes where historical accuracy is irrelevant (customer phone number, last login date).
- Type 2: Attributes that affect historical analysis (customer region, product category, employee department).
- Type 3: Attributes where previous value comparison is needed without full history (customer tier changes).
- Type 0: Immutable attributes (date of birth, original customer ID, creation timestamp).

---

# When NOT To Use

- Type 2 on rapidly changing attributes (stock price, CPU usage) — creates millions of version rows.
- Type 1 on regulatory attributes (audit trail required by compliance) — loss of history is non-compliant.
- SCD on fact tables (facts are immutable; use event sourcing instead).
- Type 3 for attributes with many change cycles — only one previous value is tracked.

---

# Best Practices

## Minimize Type 2 Columns

Not every attribute needs Type 2 tracking. Analyze which attributes affect historical reporting. Use Type 1 for non-analytical attributes to reduce dimension row count.

## Use Effective Dates

Always use inclusive start dates and exclusive end dates for Type 2. This enables clean BETWEEN queries. Convention: `effective_date <= fact_date AND (expiry_date > fact_date OR expiry_date IS NULL)`.

## Index Current Row Marker

Add a filtered index on `WHERE current_flag = 1`. Dimension lookups for current rows are the most frequent operation and must be fast.

## Combine with Late-Arriving Dimensions

SCD Type 2 combined with late-arriving dimensions creates complexity. When a dimension row arrives late, its effective dates may overlap existing rows. Define clear resolution rules.

---

# Architecture Guidelines

## Layer Placement

SCD transformation happens in the Silver → Gold transition. Source dimension data lands in Silver. SCD logic in the Gold layer maintains versioned dimension tables.

## ETL SCD Pipeline

Source → Staging → Compare with Current Rows → Update/Insert → Maintain Current Flag → Recalculate Expiry

The comparison step is the most expensive. Use hash comparison of significant columns to detect changes.

## dbt Snapshot for Type 2

dbt provides built-in `snapshot` functionality for Type 2 SCD. It handles versioning, effective dates, and current row markers automatically. Use `dbt snapshot` instead of manual Type 2 implementation.

---

# Performance Considerations

- Type 2 dimensions grow linearly with change frequency. A customer dimension with 100K records may grow to 1M+ rows after 5 years of changes.
- Hash comparison of dimension rows is faster than column-by-column comparison.
- Current row lookup with filtered index is O(log n). Versioned row lookup requires effective date range scan.
- Large Type 2 dimensions benefit from partitioning by current flag.

---

# Security Considerations

- Historical dimension versions may contain sensitive data that was subsequently changed. Ensure access control covers historical versions.
- Type 2 allows "time travel" — querying data as it was historically. Ensure this capability is documented for compliance.
- Purging old dimension versions must respect data retention policies.

---

# Common Mistakes

## Mistake: All Columns Type 2

Every attribute in the dimension is Type 2 tracked. A customer's phone number change creates a new dimension version. After 3 years, 10M customers have 50M+ dimension rows. Queries slow down.

**Better approach:** Analyze which attributes affect analytical queries. Only Type 2-track attributes that change reporting results.

## Mistake: No Current Flag

Type 2 dimension has effective dates but no current flag. Every lookup requires: "find the row where ` @date BETWEEN effective AND expiry`". This is slow and error-prone.

**Better approach:** Add a boolean `is_current` column. Index it for fast current-row lookups.

## Mistake: Overlapping Effective Dates

Two Type 2 rows for the same natural key have overlapping effective date ranges. A BETWEEN query returns both rows, creating double-counted facts.

**Better approach:** Enforce date range uniqueness per natural key. Use exclusive end dates to prevent overlaps.

---

# Anti-Patterns

## Type 2 on Rapidly Changing Dimensions
Stock price or CPU load tracked as Type 2. Every price change creates a new dimension version. Millions of rows per day. The dimension table exceeds the fact table in size.

**Solution:** Move rapidly changing attributes to a fact or a periodic snapshot table. Only Type 2-track attributes that change infrequently.

## Manual Type 2 Implementation
Custom SQL scripts for Type 2 management instead of dbt snapshots or warehouse SCD features. Each script has different logic for effective dates, current flags, and change detection.

**Solution:** Use dbt snapshots for consistent Type 2 SCD across all dimensions. Standardize on one implementation.

## Type 2 Without Surrogate Keys
Using natural keys with Type 2 versioning. The fact table stores the natural key + effective date to identify the dimension version. Every fact query requires an effective-date range join.

**Solution:** Generate surrogate keys for each dimension version. The fact table stores the surrogate key, enabling direct joins without date range logic.

## Ignoring SCD in Star Schema Design
Star schema is designed without considering dimension attribute changes. Six months after launch, analysts discover that historical data is incorrect because dimension attributes were overwritten (Type 1 by default).

**Solution:** Plan SCD strategy during schema design. Document which attributes use which SCD type before building marts.
