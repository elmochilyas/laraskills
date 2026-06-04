# Decision Trees: Saga Pattern with Kafka for Analytics Transactions

## Decision: Choreography vs Orchestration

**Q: How many services/systems are involved in the saga?**
- 2-3 services → Choreography (simpler, no single point of failure)
- 4+ services → Orchestration (manageable state machine, traceable flow)

**Q: Is the saga flow linear or branching?**
- Linear (step1 → step2 → step3) → Either pattern works
- Branching (conditional steps, parallel steps) → Orchestration required

## Decision: Saga vs 2PC

**Q: Are all participants in the same database system?**
- Yes → 2PC (XA transactions, stronger consistency)
- No (PostgreSQL + Kafka + ClickHouse) → Saga pattern required

## Decision: State Storage

**Q: What is the expected saga volume?**
- < 1000 sagas per hour → Database table (simpler, ACID state)
- > 1000 sagas per hour → Compacted Kafka topic (higher throughput)
