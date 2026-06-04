# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 06-real-time-analytics
**Knowledge Unit:** saga-pattern-kafka
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Saga pattern (distributed transaction without 2PC) understood for analytics pipelines
- [ ] Choreography vs orchestration saga approach decided
- [ ] Compensating transaction defined for each saga step
- [ ] Kafka topic as durable saga log configured
- [ ] Idempotency key strategy for saga step deduplication
- [ ] Saga state machine implemented for step success/failure tracking

---

# Architecture Checklist

- [ ] Choreography saga: each step produces event consumed by next step via Kafka
- [ ] Orchestration saga: central coordinator service publishes step commands to Kafka
- [ ] Compensating transaction defined for each forward step
- [ ] Kafka topic stores saga event log for replay and recovery
- [ ] Circuit breaker (K034) protects saga step consumers from failure storms
- [ ] CDC (K017) outbox pattern for reliable saga initiation without dual-write

---

# Implementation Checklist

- [ ] Saga event schema defined: saga_id, step_name, event_type (started/completed/failed), payload
- [ ] Choreography: step completes, publishes next-step event to Kafka topic
- [ ] Orchestration: coordinator publishes Command to step topic, listens for Reply
- [ ] Compensating step: defined for each forward step (e.g., cancel_order for create_order)
- [ ] Idempotency key: saga_id + step_name ensures step runs exactly once
- [ ] Saga state table: tracks which steps completed, failed, or compensated

---

# Performance Checklist

- [ ] Saga step latency measured per hop — end-to-end saga duration
- [ ] Kafka topic throughput for saga events — partition count scaled
- [ ] Compensating transaction path latency — must not exceed forward path timeout
- [ ] Idempotency key unique index overhead — O(1) lookup
- [ ] Saga state table indexed by saga_id for fast status queries
- [ ] CDC outbox latency from DB commit to Kafka event

---

# Security Checklist

- [ ] Saga event topics access-restricted via Kafka ACLs
- [ ] Compensating transaction must be authorized — no unauthorized rollback
- [ ] Saga state table audited — every state transition logged
- [ ] Idempotency key validated server-side — prevents replay attacks
- [ ] Circuit breaker limits compensate retry count to prevent infinite loops

---

# Reliability Checklist

- [ ] Saga step failure triggers compensating transaction for completed previous steps
- [ ] Kafka topic retention configured to retain saga events until compensation confirmed
- [ ] Idempotency key prevents duplicate step execution after consumer restart
- [ ] Saga timeout configured — incomplete saga detected and escalated
- [ ] Saga state table backed up for recovery after catastrophic failure

---

# Testing Checklist

- [ ] Test saga completes all steps successfully (happy path)
- [ ] Test step failure triggers compensating transactions for previous steps
- [ ] Test idempotency key prevents duplicate step execution
- [ ] Test saga recovery from Kafka topic after consumer restart
- [ ] Test saga timeout detects stalled saga and triggers escalation
- [ ] Test CDC outbox (K017) reliably initiates saga

---

# Maintainability Checklist

- [ ] Saga step logic in dedicated classes per step (Saga/Order/CreateOrder, Saga/Order/CancelOrder)
- [ ] Compensating transaction paired with each step in same namespace
- [ ] Saga definition in config/sagas.php with step order and timeout
- [ ] Saga state machine documented as state transition table
- [ ] Kafka topic naming: saga.{saga_name}.{step_name}.{event_type}

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use saga for simple local transactions — saga overhead not justified
- [ ] Do not skip compensating transaction — partial failure leaves system inconsistent
- [ ] Do not use 2PC with saga — saga replaces 2PC for distributed transactions
- [ ] Do not ignore idempotency — Kafka at-least-once delivery causes duplicate steps
- [ ] Do not forget saga timeout — stalled saga blocks resources indefinitely

---

# Production Readiness Checklist

- [ ] Prometheus metrics for saga step latency, compensating transaction count, saga duration
- [ ] Logged warning when saga duration exceeds expected threshold
- [ ] Alert when compensating transaction count exceeds 1% of total saga executions
- [ ] Saga state table monitored for stalled sagas
- [ ] Deploy checklist includes saga step idempotency verification
- [ ] Staging saga test validates compensation on step failure

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: choreography/orchestration decision, compensating transactions, Kafka saga log
- [ ] Security requirements satisfied: topic ACLs, authorized compensation, state audit, idempotency validation
- [ ] Performance requirements satisfied: step latency, throughput, compensation path speed, CDC outbox
- [ ] Testing requirements satisfied: happy path, compensation, idempotency, recovery, timeout
- [ ] Anti-pattern checks passed: saga only for distributed tx, compensation exists, idempotency implemented, timeout set
- [ ] Production readiness verified: step latency metrics, compensation alerts, saga state monitoring, staging validation

---

# Related References

- K017 (Kafka CDC Debezium): Outbox pattern for saga initiation via CDC
- K037 (CDC Sub-Second Replication): Low-latency event capture for saga steps
- K034 (Circuit Breaker): Protecting saga step consumers from failure storms
- K027 (Reverb Scaling): Broadcasting saga status changes to live dashboards
