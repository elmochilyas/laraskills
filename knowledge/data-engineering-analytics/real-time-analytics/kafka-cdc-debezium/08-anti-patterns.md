# Anti-Patterns: Kafka CDC with Debezium for Real-Time Analytics

## No Schema Registry
Debezium serializes events without a schema registry. A column type change from INT to BIGINT causes serialization errors. Events cannot be processed and the analytics pipeline stalls.

**Solution:** Always configure a schema registry. Use Avro or JSON Schema with backward-compatible evolution.

## Non-Idempotent Consumers
CDC consumers perform INSERT instead of UPSERT. A network error causes event reprocessing, creating duplicate rows in analytics tables.

**Solution:** Implement idempotent consumers. Use INSERT ON CONFLICT ... UPDATE for PostgreSQL or ReplacingMergeTree for ClickHouse.

## Ignoring DDL Changes
Source table adds a column. Debezium includes the new column in subsequent events, but consumers expect the old schema. The consumer crashes.

**Solution:** Use schema registry with evolution support. Implement consumer-level schema version handling.

## Single Consumer for All Topics
One Kafka consumer processes events from 50+ tables. A high-volume table (orders) delays processing for all other tables (customer, product, categories).

**Solution:** Assign dedicated consumer groups to high-volume tables. Use per-table or per-domain consumer parallelism.

## No Monitoring
CDC lag, consumer lag, and error rates are not monitored. A Debezium connector fails silently. Analytics data is hours stale. No one notices until the daily standup.

**Solution:** Monitor CDC lag, consumer lag, error rates, and processed event counts. Alert on anomalies.
