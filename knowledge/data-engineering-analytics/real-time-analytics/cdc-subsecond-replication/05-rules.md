# Rules: Real-Time CDC with Sub-Second Replication

## Rule CDC-01: Buffer CDC Events in Kafka
All CDC events MUST be written to Kafka before ingestion to the analytics store. Direct Debezium-to-ClickHouse streaming without Kafka buffering is forbidden.

## Rule CDC-02: Monitor Pipeline Latency
End-to-end CDC latency MUST be monitored as a three-part metric: WAL capture lag, Kafka transport lag, and ClickHouse ingestion lag.

## Rule CDC-03: Configure WAL Retention
`wal_keep_size` MUST be sized to at least 4x the expected daily WAL volume. Replication slot lag MUST be alerted.

## Rule CDC-04: Idempotent Producer
Kafka producer MUST use `enable.idempotence=true` and `acks=all` to prevent duplicate events in the CDC pipeline.

## Rule CDC-05: Co-Locate Services
PostgreSQL, Kafka, and ClickHouse instances involved in sub-second CDC MUST be deployed in the same cloud region.

## Rule CDC-06: Test Network Latency
Network latency between CDC pipeline components MUST be tested and documented. Target: < 5ms between components in the same region.

## Rule CDC-07: Schema Evolution Plan
CDC pipeline MUST have a documented schema evolution strategy. Schema changes to source tables must not break CDC consumers.

## Rule CDC-08: Backpressure Handling
CDC pipeline MUST include backpressure handling and alerting. If ClickHouse ingestion lags, Kafka offsets must not advance without confirmation.

## Rule CDC-09: Document Latency Budget
Each sub-second CDC pipeline MUST document its per-component latency budget. Total budget must not exceed 1000ms.

## Rule CDC-10: Recovery Procedure Documented
CDC pipeline recovery procedures MUST be documented and tested. Full resync from PostgreSQL snapshot must be achievable within defined SLAs.
