# Skills: Real-Time CDC with Sub-Second Replication

## Skill: Setting Up Sub-Second CDC Pipeline
**Purpose:** Build a CDC pipeline from PostgreSQL to ClickHouse with < 1 second latency.
**When to use:** Real-time analytics requiring current data from OLTP database.
**Steps:**
1. Configure PostgreSQL: `wal_level=logical`, tune `wal_writer_delay=10ms`
2. Set up Debezium connector for PostgreSQL logical decoding
3. Configure Kafka with idempotent producer and appropriate retention
4. Set up ClickHouse Kafka engine table or ClickPipes for ingestion
5. Create materialized views for data transformation
6. Configure monitoring for WAL lag, Kafka lag, and ClickHouse ingestion latency
7. Test end-to-end latency with timestamp tracking
