# Anti-Patterns: Saga Pattern with Kafka for Analytics Transactions

## Missing Compensating Transactions
A saga orchestrates PostgreSQL insert → Kafka event → ClickHouse aggregation. The ClickHouse step fails. The PostgreSQL insert and Kafka event have no compensating transactions. Data is in a partial state permanently.

**Solution:** Every step must have a compensating transaction. Design compensation before forward logic.

## Non-Idempotent Consumer
A saga step inserts a row into ClickHouse. The consumer crashes after the insert but before committing the Kafka offset. On restart, the message is reprocessed. The row is duplicated.

**Solution:** Implement idempotency key checks. Use UPSERT semantics (ReplacingMergeTree in ClickHouse) where possible.

## Orchestrator Without State Persistence
The saga orchestrator maintains sagas in memory. The orchestrator process crashes. All 500 in-flight sagas are lost. The system has partial work with no recovery mechanism.

**Solution:** Persist saga state to a compacted Kafka topic or database. On restart, replay the state topic to rebuild in-flight sagas.

## No Stuck Saga Alerting
A saga consumer fails silently. 50 sagas are stuck in STEP_2_PENDING state. No alert fires. The stuck sagas are discovered weeks later during a cleanup audit.

**Solution:** Monitor saga in-flight duration. Alert on sagas stuck in one state for > 1 hour. Implement saga timeout and automatic compensation for timed-out sagas.
