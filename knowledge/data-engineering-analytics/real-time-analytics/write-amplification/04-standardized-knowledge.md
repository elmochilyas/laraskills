# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 06-real-time-analytics
**Knowledge Unit:** write-amplification
**Difficulty:** Foundation
**Category:** ClickHouse Performance
**Last Updated:** 2026-06-03

---

# Overview

Write amplification in ClickHouse refers to the multiplicative effect where each inserted row generates additional writes across materialized views, projections, and replication. In cascading MV chains — where one MV feeds another — a single raw event can trigger 5-10x or more actual disk writes. Understanding and managing write amplification is critical for cost-effective ClickHouse operations, directly impacting insert throughput, disk I/O, merge pressure, and storage costs.

Engineers must care because write amplification is the primary driver of ClickHouse infrastructure costs and performance bottlenecks. A high-amplification pipeline requires more powerful hardware, consumes more storage, and has lower insert throughput.

---

# Core Concepts

## Amplification Factor

The ratio of total disk writes to source INSERT data volume. An amplification factor of 5 means each 1GB of inserted data generates 5GB of actual disk writes across MVs, projections, and replication.

## MV Target Writes

Each materialized view writes transformed data to its target table. If the MV applies aggregation (AggregatingMergeTree), writes are compressed. If the MV duplicates data (pass-through SELECT *), writes equal source data volume.

## Projection Writes

Projections maintain alternative data orderings within the same table. Each projection writes additional data during INSERT and merge operations. The amplification is proportional to the number of projections.

## Replication Writes

ReplicatedMergeTree copies data to replica nodes. Each insert generates writes on all replicas. For 3-node replication, amplification factor = 3 for replication alone.

## Merge Amplification

Background merges read parts, combine them, and write new parts. This is internal write amplification not visible in INSERT metrics. Merge amplification typically adds 10-50% overhead.

---

# When To Use

- Designing ClickHouse table architectures: understanding amplification before creating MVs/projections
- Capacity planning: estimating storage and I/O requirements
- Performance troubleshooting: identifying amplification sources
- Cost optimization: reducing unnecessary amplification

---

# When NOT To Use

- Simple single-table queries without MVs or projections
- Low-volume tables (< 1M rows/day) — amplification impact is negligible
- Development environments where cost is not a concern

---

# Best Practices

## Measure Amplification

Track `system.writes` and merge metrics. Calculate actual amplification factor. Target: < 3x for production pipelines.

## Limit MV Count

Each MV adds at least 1x amplification. Limit MVs to those that provide measurable query performance benefit. Consolidate transformations into fewer MVs.

## Use WAL-Backed MVs

ClickHouse 24.8+ WAL-backed MVs reduce write amplification by 50%+ compared to trigger-based MVs by batching writes.

## Prefer Projections Over MVs

Projections have lower amplification than MVs for simple aggregation changes because they share the source table's write path.

---

# Performance Considerations

- Insert throughput decreases linearly with amplification factor: 2x amplification = 50% insert throughput.
- Merge pressure increases with amplification: more parts, more background merge work.
- Storage costs increase with amplification: 5x amplification = 5x storage cost.
- Replication amplification is fixed (3x for 3 replicas) and unavoidable.

---

# Common Mistakes

## Mistake: Unmonitored Amplification

MVs and projections are added without tracking amplification. Insert throughput drops by 80%, and no one knows why.

**Better approach:** Track amplification factor. Alert on thresholds. Model amplification before adding MVs.

## Mistake: Cascading MVs Without Need

MV1 → AggTable, MV2 → DailyAgg. DailyAgg could be a refreshable MV (periodic batch) but is implemented as a cascading MV. Amplification factor is 3x+ instead of 1x.

**Better approach:** Use refreshable MVs for non-real-time aggregations. They have zero write-time amplification.

## Mistake: Many Duplicating MVs

Three MVs on the same source table, each doing SELECT * FROM source (no aggregation). Each MV writes a full copy of the data. Amplification: 3x for MVs + replication.

**Better approach:** If multiple MVs need the same data, create one MV with all transformations, or use projections for different sort orders.
