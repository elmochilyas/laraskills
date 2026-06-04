# Skills: Kafka CDC with Debezium for Real-Time Analytics

## Skill: Setting Up Debezium CDC Pipeline
**Purpose:** Configure Debezium to stream database changes to Kafka for real-time analytics.
**When to use:** Building real-time analytics from operational database changes.
**Steps:**
1. Configure source database for CDC (WAL for PostgreSQL, binlog for MySQL)
2. Deploy Kafka and Kafka Connect cluster
3. Install Debezium connector plugin
4. Configure Debezium source connector for target database
5. Set up schema registry for event serialization
6. Create Kafka topics with appropriate partitioning
7. Implement Laravel consumer for CDC events
8. Test connector with INSERT, UPDATE, DELETE operations
9. Monitor CDC lag and consumer processing rate
