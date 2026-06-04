# Anti-Patterns: Real-Time CDC with Sub-Second Replication

## Direct Debezium-to-ClickHouse Without Kafka Buffering
Debezium streams change events directly to ClickHouse via HTTP INSERT. ClickHouse merge pressure causes backpressure → Debezium memory fills → WAL retention grows unbounded → PostgreSQL disk fills.

**Solution:** Always buffer CDC events in Kafka. Use Kafka engine table or ClickPipes for ClickHouse ingestion.

## Cross-Region CDC Pipeline
PostgreSQL is in us-east-1, Kafka in eu-west-1, ClickHouse in ap-southeast-1. Network latency is 100-300ms per hop. Total pipeline latency: 1-3 seconds minimum.

**Solution:** Co-locate all CDC components in the same region. Use Availability Zones for fault tolerance.

## No Schema Evolution Handling
Source table adds a column. Debezium emits the new schema. ClickHouse Kafka engine table schema doesn't match. Ingestion fails silently.

**Solution:** Use schema registry with Avro/Protobuf serialization. Handle schema changes with ALTER TABLE ADD COLUMN before deploying schema changes.

## Single Replication Slot
A single PostgreSQL replication slot is shared across all CDC consumers. One slow consumer blocks all CDC pipelines. All analytics dashboards fall behind.

**Solution:** Create one replication slot per consumer group. Each consumer has independent lag tracking.
