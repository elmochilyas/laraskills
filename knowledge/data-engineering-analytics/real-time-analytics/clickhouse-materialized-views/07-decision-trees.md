# Decision Trees: ClickHouse Materialized View Trigger Model

## Decision: MV vs Projection

**Q: Is the transformation simple (reorder, aggregate)?**
- Yes → Consider projection (simpler, no write amplification for reordering)
- No → MV required

**Q: Is independent lifecycle needed?**
- Yes (different TTL, partition, codecs) → MV
- No → Projection (inline with source table lifecycle)

## Decision: MV vs Query-Time Transformation

**Q: How frequently is the transformation queried?**
- Every minute → MV (pre-compute at write time)
- Hourly → MV or refreshable MV
- On-demand → Query-time transformation is simpler
