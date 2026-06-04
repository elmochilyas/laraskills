# SCD Dimensions

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 05-olap-modeling
- **Knowledge Unit:** scd-dimensions
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Slowly Changing Dimensions (SCD) manage how dimension tables handle attribute changes over time in a star schema — Type 1 overwrites (loses history), Type 2 preserves history with new version rows, and the choice determines whether historical fact attribution changes when dimension attributes are updated. Wrong SCD strategy produces incorrect analytics: Type 1 can retroactively change historical attributions, Type 2 requires analysts to handle effective-dated queries.

---

## Core Concepts

- **SCD Type 1 (Overwrite):** Dimension row updated in place — previous values lost — historical fact attribution changes retroactively — simplest to implement — use when historical accuracy of attribution is not required
- **SCD Type 2 (Row Versioning):** New dimension row inserted when attribute changes — each row has effective dates and current flag — historical facts point to version that was current at the time — most common SCD type
- **SCD Type 3 (Attribute Addition):** "Previous value" column added to dimension row — only current and immediately previous values tracked — useful for limited history without row versioning
- **SCD Type 0 (Retain):** Attribute never changed after initial loading — dimension row immutable once created — use for attributes that should never change (date of birth, original source system ID)
- **Surrogate Key + Natural Key:** SCD always requires surrogate keys — natural key identifies real-world entity — surrogate key identifies specific version — facts store surrogate key for dimension version current at the time

---

## Mental Models

- **SCD as Time Machine:** Type 2 creates a time machine for your data. A customer moves from North to South. With Type 2, you can query "what were my sales by region as they were at the time of each sale." Type 1 is like rewriting history — the customer was always in the South, even before they moved.
- **Versioning as Document Revisions:** Type 2 is like tracking document revisions — each version has an effective date range. Type 1 is like editing a document without version history — the latest version replaces everything before it. Type 3 is like showing only the previous edit.

---

## Internal Mechanics

In the Silver → Gold transformation, source dimension data is compared with current dimension rows. The comparison uses hash comparison of significant columns to detect changes. If changes are detected for Type 2, a new version row is inserted with effective dates and current flag, and the previous version's expiry date is set. For Type 1, the existing row is simply updated. The lookup process for Type 2: `SELECT * FROM dim_customer WHERE natural_key = ? AND is_current = 1` (fast, filtered index) or `SELECT * FROM dim_customer WHERE natural_key = ? AND effective_date <= ? AND (expiry_date > ? OR expiry_date IS NULL)` (range scan).

---

## Patterns

- **Minimize Type 2 Columns:** Not every attribute needs Type 2 tracking — analyze which attributes affect historical reporting — use Type 1 for non-analytical attributes to reduce dimension row count
- **Use Effective Dates:** Always use inclusive start dates and exclusive end dates for Type 2 — enables clean BETWEEN queries — convention: `effective_date <= fact_date AND (expiry_date > fact_date OR expiry_date IS NULL)`
- **Index Current Row Marker:** Add filtered index on `WHERE current_flag = 1` — dimension lookups for current rows are the most frequent operation and must be fast

---

## Architectural Decisions

Choose Type 1 for non-critical attributes where historical accuracy is irrelevant (phone number, last login). Choose Type 2 for attributes that affect historical analysis (region, product category, department). Choose Type 3 for attributes where previous value comparison is needed without full history (customer tier changes). Choose Type 0 for immutable attributes. Use dbt `snapshot` for Type 2 implementation rather than custom SQL scripts.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Type 2: preserves historical attribution | Linear growth with change frequency | Customer dim: 100K records → 1M+ in 5 years |
| Type 1: simple, no storage growth | Loses historical attribution permanently | Regulatory/compliance may require history |
| Type 3: tracks previous value only | Limited to single previous value | Cannot reconstruct earlier states |
| Type 0: immutable, predictable | Cannot correct data errors | Requires careful initial data validation |

---

## Performance Considerations

Type 2 dimensions grow linearly with change frequency — a customer dimension with 100K records may grow to 1M+ rows after 5 years of changes. Hash comparison of dimension rows is faster than column-by-column comparison. Current row lookup with filtered index is O(log n). Versioned row lookup requires effective date range scan. Large Type 2 dimensions benefit from partitioning by current flag.

---

## Production Considerations

Historical dimension versions may contain sensitive data that was subsequently changed — ensure access control covers historical versions. Type 2 allows "time travel" querying data as it was historically — document this capability for compliance. Purging old dimension versions must respect data retention policies.

---

## Common Mistakes

- **All Columns Type 2:** Every attribute in the dimension is Type 2 tracked — a customer's phone number change creates a new version, after 3 years 10M customers have 50M+ rows. Better: analyze which attributes affect analytical queries, only Type 2-track those that change reporting results.
- **No Current Flag:** Type 2 dimension has effective dates but no current flag — every lookup requires range scan, slow and error-prone. Better: add boolean `is_current` column, index it for fast lookups.
- **Overlapping Effective Dates:** Two Type 2 rows for same natural key have overlapping date ranges — BETWEEN query returns both rows, creating double-counted facts. Better: enforce date range uniqueness per natural key, use exclusive end dates.

---

## Failure Modes

- **Type 2 on Rapidly Changing Dimensions:** Stock price or CPU load as Type 2 — every change creates new version, millions of rows per day, dimension exceeds fact table in size. Mitigation: move rapidly changing attributes to fact or periodic snapshot table.
- **Manual Type 2 Implementation:** Custom SQL scripts instead of dbt snapshots — each script has different effective date logic. Mitigation: use dbt snapshots for consistent Type 2 across all dimensions.
- **Type 2 Without Surrogate Keys:** Using natural keys with Type 2 — fact table stores natural key + effective date, every query requires effective-date range join. Mitigation: generate surrogate keys for each dimension version.

---

## Ecosystem Usage

SCD management is typically handled in the data warehouse layer (dbt snapshots, ClickHouse ReplacingMergeTree), not in Laravel application code. However, the ETL Manifesto can include SCD logic when exporting data from Laravel to the warehouse. `laravel-analytics` packages may need to handle SCD scenarios when enriching events with customer or product attributes that change over time.

---

## Related Knowledge Units

### Prerequisites
- Star Schema — The dimensional modeling context where SCD applies
- Medallion Architecture — SCD transformation in Silver → Gold transition

### Related Topics
- Late-Arriving Dimensions — Combined pattern with SCD for delayed dimension data
- dbt Incremental Models — How dbt snapshots implement Type 2 SCD

### Advanced Follow-up Topics
- Data Vault 2.0 — SCD patterns in Satellites
- Temporal Queries — Point-in-time dimension state reconstruction

---

## Research Notes

SCD Type 2 is the most common dimension management strategy in data warehousing. The key decision point is whether historical fact attribution must be preserved when dimension attributes change. The combination of SCD with late-arriving dimensions creates the most complex scenario — clear resolution rules for overlapping effective dates must be defined upfront. dbt snapshots have become the standard implementation for Type 2 SCD, replacing custom SQL scripts.
