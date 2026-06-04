# Late-Arriving Dimensions

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 03-etl-elt-pipelines
- **Knowledge Unit:** late-arriving-dimensions
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Late-arriving dimensions occur when a fact record references a dimension key that hasn't been loaded yet — the rule, not the exception, in real-world analytics pipelines where CRM data arrives minutes after orders and product catalogs update hours after purchases. Three strategies address this temporal mismatch: placeholder rows, deferred resolution, and reprocessing.

---

## Core Concepts

- **Late-Arriving Dimension:** A dimension record that arrives after the fact record that references it — the fact is "early" because it was loaded before its related dimension was available
- **Placeholder Row Strategy:** When a fact references a non-existent dimension key, the ETL inserts a "placeholder" row with that key and default values — updated or superseded when the real record arrives
- **Deferred Resolution Strategy:** Fact table stores the natural key for unresolved dimensions — a separate resolution process periodically matches natural keys and backfills the surrogate key
- **Reprocessing Strategy:** Facts loaded with null foreign keys — when the dimension arrives, facts referencing that natural key are reprocessed to set the correct foreign key

---

## Mental Models

- **Placeholder as Holding Cell:** The placeholder row is a holding cell for facts that arrived before their dimension data. When the real dimension arrives, it takes the placeholder's place, and the facts are correctly attributed. Without the placeholder, the facts would be rejected at the door.
- **Late Arrivals as Hotel Guests:** Think of facts as hotel guests checking in, and dimensions as their luggage. Sometimes luggage arrives after the guest. The hotel (placeholder) provides essentials until the luggage arrives. The guest doesn't wait at reception for their bags.

---

## Internal Mechanics

In the Silver layer of the medallion architecture, when a fact arrives with a natural key, the system checks if the dimension row exists. If yes, the surrogate key is set. If no, a placeholder key is assigned and the fact is queued for resolution. When the dimension data arrives later, the resolution process finds all facts referencing that natural key and updates their surrogate keys. The resolution process must be idempotent — running it multiple times produces the same result. Natural keys stored alongside surrogate keys in fact tables enable deferred resolution without joining back to the dimension table.

---

## Patterns

- **Always Have a Placeholder Row:** Every dimension table should have a placeholder row (surrogate key 0 or -1, natural key "Unknown") — facts referencing unknown dimensions can safely point to this row
- **Store Natural Keys in Facts:** Store the natural key alongside the surrogate key in fact tables — enables deferred resolution without joining back to the dimension table
- **Idempotent Resolution Process:** The resolution process (backfilling fact foreign keys) must be idempotent — running it multiple times produces the same result

---

## Architectural Decisions

Use placeholder rows by default for all dimension tables — they are the simplest and most reliable strategy. Consider deferred resolution when facts must be queryable immediately and dimension resolution can happen asynchronously. Use reprocessing only when the ETL pipeline already supports selective reprocessing. Design all star schemas with late-arriving dimensions in mind from the start — use nullable foreign keys or placeholder rows by default.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Fact loading never blocked (placeholder) | Extra logic for placeholder creation/maintenance | Must always create placeholder before fact loading |
| Natural keys enable deferred resolution | Additional storage for natural keys in facts | Enables asynchronous resolution pipeline |
| Reprocessing handles all edge cases | Expensive for large fact tables | Limit reprocessing windows or use incremental resolution |
| All strategies handle temporal mismatch | Combination with SCD creates complexity | Need clear resolution rules for overlapping dates |

---

## Performance Considerations

Placeholder lookup is a single query per fact — use caching in ETL jobs. Deferred resolution requires batch updates on fact tables — use chunked updates to avoid long-running transactions. Reprocessing historical facts can be expensive — limit reprocessing windows or use incremental resolution. Index natural keys on both fact and dimension tables for resolution queries.

---

## Production Considerations

Placeholder rows may contain null or default values — ensure defaults do not inadvertently expose data from other tenants or users. The resolution process must respect row-level security — a late-arriving resolution should not grant access to facts the user should not see. Audit logging of resolution changes is essential for compliance. Log every late-arriving event with fact ID, dimension type, natural key, resolution timestamp, and previous/current values.

---

## Common Mistakes

- **No Placeholder Row:** Fact insert fails with foreign key violation when dimension doesn't exist — entire batch of facts rejected. Better: always create placeholder row before fact loading.
- **Assuming Dimensions Arrive First:** ETL processes dimensions before facts but a source sends a fact with a dimension key that hasn't arrived yet — ETL fails silently or blocks. Better: design all ETL pipelines assuming dimensions may arrive after facts.
- **Single Resolution Pass:** Resolution process runs once and assumes all dimensions have arrived — facts referencing later-arriving dimensions remain as placeholders permanently. Better: run resolution on a schedule or trigger when new dimension data arrives.

---

## Failure Modes

- **Blocking Fact Loading:** ETL blocks fact loading until all referenced dimensions exist — facts pile up in staging, dashboard latency increases. Mitigation: load facts immediately with placeholder or null keys, resolve later.
- **Rewriting History Without Audit:** Fact table updated with correct surrogate key but no audit record created — if data was wrong and corrected, fact history is lost. Mitigation: log all resolution events with before/after values.
- **Ignoring in Schema Design:** Star schema designed without considering late-arriving dimensions — foreign key constraints prevent fact loading. Mitigation: design all schemas with nullable foreign keys or placeholder rows by default.

---

## Ecosystem Usage

Late-arriving dimension handling is relevant to Laravel analytics pipelines when events are captured before associated user or product data is available. The `laravel-analytics` pipeline should implement placeholder rows or deferred resolution in the enrichment stage. ETL Manifesto can include default placeholder creation in its pipeline definitions. dbt snapshots can be configured to handle late-arriving dimension resolution.

---

## Related Knowledge Units

### Prerequisites
- Star Schema — The schema design context where late-arriving dimensions occur
- Medallion Architecture — Silver layer handles late-arriving resolution

### Related Topics
- SCD Dimensions — Combined pattern with slowly changing dimensions
- ETL Manifesto — ETL extraction where late arrivals are handled

### Advanced Follow-up Topics
- Data Vault 2.0 — Enterprise patterns for late-arriving data in Hubs/Satellites

---

## Research Notes

Late-arriving dimensions are one of the most common real-world data warehouse challenges. In multi-source pipelines, facts and dimensions almost never arrive in perfect order. The three strategies (placeholder, deferred resolution, reprocessing) each handle different timing scenarios. The combination of late-arriving dimensions with SCD Type 2 creates particular complexity — clear resolution rules must be defined for overlapping effective dates.
