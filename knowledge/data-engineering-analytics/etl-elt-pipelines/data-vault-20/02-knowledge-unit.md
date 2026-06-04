# Data Vault 2.0

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 03-etl-elt-pipelines
- **Knowledge Unit:** data-vault-20
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Data Vault 2.0 is an enterprise-grade data modeling methodology that separates data integration into Hubs (business keys), Links (relationships), and Satellites (context attributes) — optimized for auditability, flexibility, and parallel loading rather than query performance. It handles schema drift, multi-source integration, and full auditability that simpler models like star schema cannot address, making it ideal for large-scale enterprise data warehouses.

---

## Core Concepts

- **Hub:** Stores unique business keys and first-seen metadata (load date, record source) — no context attributes, just the key itself and a surrogate key
- **Link:** Captures relationships between Hubs — stores surrogate keys of related Hubs with relationship-specific metadata, equivalent to fact tables without measures
- **Satellite:** Stores context attributes for a Hub or Link — separate satellites for different source systems or attribute categories, tracking changes over time with load dates
- **PIT (Point-In-Time) Table:** Pre-computed view of all satellites' state at a specific point in time — resolves effective-dating complexity for temporal queries
- **Bridge Table:** Pre-joins Hubs and Links at a specific grain for query performance — the Data Vault equivalent of a materialized view

---

## Mental Models

- **Data Vault as Legal Filing System:** Hubs are case files (business keys), Links show connections between cases, Satellites are folders of evidence attached to each case. The filing system never deletes anything — every piece of evidence is tracked with its receipt date and source.
- **Hub as Skeleton, Satellites as Flesh:** The Hub is the skeleton (the immutable structure), Links are the joints connecting bones, and Satellites are the flesh (attributes that change over time). The skeleton persists; the flesh evolves.

---

## Internal Mechanics

Data Vault occupies the Silver layer in Medallion Architecture. Staging data flows to Hubs (extract business keys), Links (extract relationships), and Satellites (extract context attributes) — these loading operations are fully parallel because Hubs, Links, and Satellites have no interdependencies at insert time. From the Vault layer, PIT and Bridge tables are computed to feed Gold layer presentation marts. Queries through the Vault typically require 15-20 JOINs, which is expected and by design — the model optimizes for loading, not querying.

---

## Patterns

- **Parallel Loading:** Hubs, Links, and Satellites load independently in parallel because they have no insert-time interdependencies — enables massive throughput for batch loading
- **Satellite Separation by Source and Rate of Change:** Group attributes by source system and change frequency — rapidly changing attributes in one satellite, stable attributes in another — prevents unnecessary versioning of stable data
- **Gold Layer as Query Interface:** BI tools query Gold marts (not Data Vault tables directly) — Data Vault is not a presentation layer; Gold marts provide the denormalized, query-optimized views

---

## Architectural Decisions

Use Data Vault only when star schema limitations become blockers — typically with 5+ heterogeneous source systems, regulatory audit requirements, or frequent schema changes. Start with star schema for most analytics and escalate to Data Vault only when needed. Keep satellites to 5-10 per Hub to prevent unmanageable JOIN counts.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Full audit trail and data lineage | 15-20 JOINs per query | PIT and Bridge tables required for performance |
| Parallel loading from multiple sources | Steep learning curve | Team must have Data Vault experience |
| Schema flexibility (new columns = new satellites) | Storage overhead from versioning | Satellite count must be managed |
| Source-agnostic integration | Not suitable for OLTP | Only for data warehouse layer |

---

## Performance Considerations

Data Vault queries require 15-20 JOINs for typical reports — expected and by design. PIT tables reduce temporal query JOINs to 5-7 which is acceptable for most BI tools. Bridge tables reduce complex multi-path relationships to single-access queries. Materialized views or aggregations on Data Vault should use the Gold layer. Consider table sizes and indexing strategies carefully.

---

## Production Considerations

Satellites may contain sensitive data — use separate satellites for PII columns to enable column-level security. Record source metadata can be used for data governance and access control. Data Vault's full audit trail means every data change is tracked — ensure compliance with data retention policies for this metadata. Overlapping satellite effective dates must be prevented.

---

## Common Mistakes

- **Data Vault for OLTP:** Using Data Vault as the application database model — it's designed for batch-loaded data warehouses, not real-time transactions. Better: use Eloquent's normalized models for OLTP, Data Vault only in the warehouse layer.
- **Too Many Satellites:** Creating a separate satellite for every minor attribute category — satellite count becomes unmanageable, queries require joining 50+ satellites. Better: group related attributes, use 5-10 satellites per Hub.
- **Ignoring PIT Tables:** Querying Data Vault directly for temporal reports without PIT tables — each query requires complex window functions. Better: create PIT tables for all Hubs queried for point-in-time analysis.

---

## Failure Modes

- **Business Keys in Satellites:** Storing business key attributes in Satellites instead of Hubs — business keys belong in Hubs, Satellites describe context. Mitigation: move business keys to Hub.
- **Direct Gold Layer Queries on Data Vault:** BI tools querying Data Vault tables directly instead of through PIT/Bridge or Gold marts — poor performance and duplicated temporal logic. Mitigation: always create Gold marts for BI consumption.
- **Data Vault as Silver Bullet:** Applying Data Vault to every problem regardless of scale — complexity only justified when specific advantages needed. Mitigation: start with star schema, escalate when needed.

---

## Ecosystem Usage

Laravel applications serving enterprise clients with complex data integration requirements benefit from Data Vault patterns. While Laravel doesn't have a direct Data Vault package, the ETL Manifesto and dbt integration can implement Data Vault loading logic. Eloquent models map naturally to Hub entities, with Queue-backed projectors handling satellite updates.

---

## Related Knowledge Units

### Prerequisites
- Medallion Architecture — Framework for where Data Vault lives (Silver layer)
- Star Schema — Alternative simpler approach for most analytics needs

### Related Topics
- dbt Incremental Models — How dbt transforms feed the Vault layer
- Late-Arriving Dimensions — Handling delayed dimension data in Vault

### Advanced Follow-up Topics
- SCD Dimensions — Type 2 dimension tracking in Satellites
- Temporal Queries — Point-in-time reconstruction using PIT tables

---

## Research Notes

Data Vault 2.0 was formalized by Dan Linstedt and has become the standard for enterprise data warehouses requiring full auditability. The methodology's parallel loading capability makes it ideal for modern cloud data warehouses where compute is elastic. The combination of Data Vault for Silver layer and star schema for Gold layer has become a best practice in large-scale data platforms.
