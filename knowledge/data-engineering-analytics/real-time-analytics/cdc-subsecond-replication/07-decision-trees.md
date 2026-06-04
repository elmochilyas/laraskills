# Decision Trees: Real-Time CDC with Sub-Second Replication

## Decision: CDC vs Standard Replication

**Q: Is < 1 second data freshness required?**
- Yes → CDC pipeline (selective, transformable)
- No → Standard streaming replication (simpler, full DB copy)

## Decision: Buffered vs Direct Ingestion

**Q: Is data durability more important than 50ms latency?**
- Yes (most production systems) → Buffer CDC events in Kafka first
- No (experimental, low-value data) → Direct ingestion from Debezium

## Decision: ClickPipes vs Custom Ingestion

**Q: Is ClickHouse managed service (ClickHouse Cloud) being used?**
- Yes → ClickPipes (managed Kafka → ClickHouse connector)
- No → Custom ingestion via Kafka engine table + materialized view

## Decision: Micro-Batch Size

**Q: What is the latency requirement?**
- < 200ms → Streaming (each event individually, lower throughput)
- 200-500ms → Micro-batch 50ms window (balance throughput and latency)
- 500-1000ms → Micro-batch 200ms window (higher throughput)
