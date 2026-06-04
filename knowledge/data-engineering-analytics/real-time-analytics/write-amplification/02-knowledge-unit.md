# Write Amplification

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 06-real-time-analytics
- **Knowledge Unit:** write-amplification
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary

Write amplification in ClickHouse refers to the multiplicative effect where each inserted row generates additional writes across materialized views, projections, and replication — in cascading MV chains, a single raw event can trigger 5-10x or more actual disk writes. Understanding and managing write amplification is critical for cost-effective ClickHouse operations, directly impacting insert throughput, disk I/O, merge pressure, and storage costs.

---

## Core Concepts

- **Amplification Factor:** Ratio of total disk writes to source INSERT data volume — amplification factor of 5 means each 1GB of inserted data generates 5GB of actual disk writes across MVs, projections, and replication
- **MV Target Writes:** Each materialized view writes transformed data to its target table — if MV applies aggregation, writes are compressed; if MV duplicates data (SELECT *), writes equal source data volume
- **Projection Writes:** Projections maintain alternative data orderings within same table — each projection writes additional data during INSERT and merge operations — amplification proportional to number of projections
- **Replication Writes:** ReplicatedMergeTree copies data to replica nodes — each insert generates writes on all replicas — for 3-node replication, amplification factor = 3 for replication alone
- **Merge Amplification:** Background merges read parts, combine them, write new parts — internal write amplification not visible in INSERT metrics — typically adds 10-50% overhead

---

## Mental Models

- **Amplification as Photocopying:** Each insert is like photocopying a document. MVs are like making copies for different departments — each department (MV) gets its own copy. Projections are like making copies sorted differently. Replication is like sending copies to different offices. If you make 5 copies of each document, you need 5x the paper.
- **Write Budget:** Think of your disk's write capacity as a monthly budget. Each insert spends from the budget. Amplification means each insert costs more than you'd expect. A 1GB insert with 5x amplification spends 5GB from your budget.

---

## Internal Mechanics

When data is inserted into a ClickHouse table with MVs, the insert is written to the source table's parts. Then each MV fires, executing its SELECT on the new data block and writing results to its target table (creating new parts in the target). If the target table has its own MVs, the amplification cascades. Projections write additional data during the same insert operation. Replication copies the data to replica nodes asynchronously. Background merges rewrite parts, adding further amplification. Monitoring `system.writes` and query metrics helps calculate the actual amplification factor.

---

## Patterns

- **Measure Amplification:** Track `system.writes` and merge metrics — calculate actual amplification factor — target < 3x for production pipelines
- **Limit MV Count:** Each MV adds at least 1x amplification — limit MVs to those providing measurable query performance benefit — consolidate transformations into fewer MVs
- **Use WAL-Backed MVs:** ClickHouse 24.8+ WAL-backed MVs reduce write amplification by 50%+ compared to trigger-based MVs by batching writes
- **Prefer Projections Over MVs:** Projections have lower amplification than MVs for simple aggregation changes because they share the source table's write path

---

## Architectural Decisions

Target amplification factor < 3x for production pipelines. Model amplification before creating MVs or projections — understand the impact on insert throughput and storage costs. Use refreshable MVs for non-real-time aggregations — they have zero write-time amplification. Avoid cascading MV chains — consolidate into single MVs where possible. Use WAL-backed MVs on ClickHouse 24.8+ for new deployments.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| MVs enable real-time pre-aggregation | Each MV adds 1x+ amplification | Amplification factor 3x = 50% insert throughput |
| Projections share write path | Limited to simple reordering | Lower amplification than MVs |
| Replication provides HA | 3x amplification for 3 replicas | Unavoidable for production deployments |
| WAL-backed MVs reduce amplification | Requires ClickHouse 24.8+ | Future improvement for new deployments |

---

## Performance Considerations

Insert throughput decreases linearly with amplification factor — 2x amplification = 50% insert throughput. Merge pressure increases with amplification — more parts, more background merge work. Storage costs increase with amplification — 5x amplification = 5x storage cost. Replication amplification is fixed (3x for 3 replicas) and unavoidable.

---

## Production Considerations

Monitor amplification factor over time — it can increase as new MVs are added. Alert on threshold breaches. Track improvements when consolidating MVs or switching to WAL-backed MVs. Consider the amplification impact when designing the ClickHouse table architecture — every MV and projection adds to the amplification factor.

---

## Common Mistakes

- **Unmonitored Amplification:** MVs and projections added without tracking amplification — insert throughput drops by 80%, no one knows why. Better: track amplification factor, alert on thresholds, model amplification before adding MVs.
- **Cascading MVs Without Need:** MV1 → AggTable, MV2 → DailyAgg — DailyAgg could be refreshable MV but implemented as cascading MV — amplification factor 3x+ instead of 1x. Better: use refreshable MVs for non-real-time aggregations.
- **Many Duplicating MVs:** Three MVs on same source table, each doing SELECT * (no aggregation) — each MV writes full copy of data — 3x amplification for MVs + replication. Better: create one MV with all transformations, or use projections for different sort orders.

---

## Failure Modes

- **Insert Throughput Collapse:** Amplification factor reaches 8x+ due to cascading MVs — insert throughput drops to 12.5% of base, ingestion falls behind schedule. Mitigation: model amplification before adding MVs, monitor throughput.
- **Storage Cost Explosion:** Multiple replicating MVs on high-volume tables — storage costs grow 5-10x faster than expected, infrastructure budget exceeded. Mitigation: calculate amplification factor for storage planning.
- **Merge Pressure Overload:** High amplification generates excessive parts — merge queue overflows, performance degrades. Mitigation: limit MV count, use larger batch inserts.

---

## Ecosystem Usage

Write amplification is primarily a ClickHouse infrastructure concern but affects Laravel applications through insert throughput and storage costs. When designing ClickHouse schemas for `laravel-clickhouse`, the amplification factor should be calculated. ETL Manifesto and dbt pipelines that feed ClickHouse must account for amplification in capacity planning.

---

## Related Knowledge Units

### Prerequisites
- ClickHouse MergeTree — Understanding merges and parts
- ClickHouse Materialized Views — MV mechanism that causes amplification

### Related Topics
- AggregatingMergeTree — MV + AMT pattern amplification
- Projections vs Materialized Views — Comparing amplification of projections vs MVs

### Advanced Follow-up Topics
- ClickHouse Codecs — Compression to mitigate storage amplification
- CDC Sub-Second Replication — CDC volume amplified through MV chains

---

## Research Notes

Write amplification is the primary driver of ClickHouse infrastructure costs and performance bottlenecks. The amplification factor should be a key metric in any ClickHouse production deployment. WAL-backed MVs (ClickHouse 24.8+) are the most significant recent improvement for reducing MV-related amplification. The guideline of "One MV chain deep" (avoid cascading) is a universal best practice for controlling amplification.
