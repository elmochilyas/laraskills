# Skills: Saga Pattern Implementation with Kafka for Distributed Analytics Transactions

## Skill: Implementing a Saga with Kafka
**Purpose:** Coordinate a distributed transaction across PostgreSQL, Kafka, and ClickHouse using the Saga pattern.
**When to use:** Cross-system workflows requiring consistency without 2PC.
**Steps:**
1. Design compensating transactions for each step
2. Choose choreography (simple, 2-3 steps) or orchestration (complex, 3+ steps)
3. Create saga state topic with `cleanup.policy=compact`
4. Implement step consumers with idempotency key checking
5. Implement compensating transaction handlers
6. Configure monitoring for saga health
7. Document manual intervention procedures
8. Test end-to-end: forward flow, failure at each step, compensation flow
