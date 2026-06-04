# Rules: Kafka CDC with Debezium for Real-Time Analytics

## Rule CDC-01: Schema Registry Required
Debezium MUST be configured with a schema registry. Without it, schema changes break downstream consumers.

## Rule CDC-02: Idempotent Consumers
CDC consumers MUST be idempotent. At-least-once delivery means duplicate events can occur. Use upsert patterns with position-based deduplication.

## Rule CDC-03: Monitor Lag
CDC lag (WAL position to Kafka event) MUST be monitored. Alert when lag exceeds 60 seconds.

## Rule CDC-04: Handle Tombstone Events
CDC consumers MUST handle DELETE events (tombstone records). Ignoring tombstones leaves deleted records in analytics tables.

## Rule CDC-05: Separate Consumer Groups
High-volume tables MUST have dedicated consumer groups. Shared consumer groups cause processing delays for all tables.

## Rule CDC-06: Replication User Privileges
The Debezium database user MUST have minimal privileges: REPLICATION and SELECT on tracked tables only.

## Rule CDC-07: Plan Schema Changes
Source table schema changes MUST be planned with CDC compatibility in mind. Debezium handles additive changes; breaking changes require connector restart.

## Rule CDC-08: Handle Out-of-Order Events
Consumers MUST handle out-of-order events per row. Kafka partitions by primary key guarantee per-row ordering but not cross-row ordering.

## Rule CDC-09: Topic Retention Configured
Kafka topic retention MUST be configured for CDC topics. Retention determines how far back a consumer can re-read events.

## Rule CDC-10: Test Connector Lifecycle
Debezium connector lifecycle (pause, resume, restart) MUST be tested. Connector failures during source database schema changes are common.
