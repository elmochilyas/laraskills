# Metadata

**Domain:** api-integration-engineering
**Subdomain:** integration-architecture
**Knowledge Unit:** outbox-pattern
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Idempotency prevents duplicate delivery from relay reprocessing
- [ ] Outbox record created in same transaction as business operation
- [ ] Process crash before relay does not lose outbox records
- [ ] Archive Processed Outbox Records
- [ ] Batch Process Outbox Records
- [ ] Create Outbox Record in Same Transaction as Business Operation
- [ ] Implement Idempotency on Outbox Records
- [ ] Process Outbox via Queue or Scheduler
- [ ] `outbox_messages` table with status tracking
- [ ] Outbox record stored in same transaction as domain change
- [ ] Outbox size and publish lag monitored
- [ ] Create `outbox_messages` table: id, event_type, payload, status, created_at
- [ ] Implement retry for failed publishes
- [ ] Monitor outbox table size and publish lag

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Create `outbox_messages` table: id, event_type, payload, status, created_at
- [ ] Implement retry for failed publishes
- [ ] Monitor outbox table size and publish lag
- [ ] Prune published records after retention period
- [ ] Publish pending messages to broker/webhook dispatch
- [ ] Store outbox record in same transaction as domain changes
- [ ] Update status to `published` on successful publish
- [ ] Worker polls outbox for pending messages periodically
- [ ] Archive Processed Outbox Records
- [ ] Batch Process Outbox Records
- [ ] Create Outbox Record in Same Transaction as Business Operation
- [ ] Implement Idempotency on Outbox Records

---

# Performance Checklist

- [ ] Archive/pruning of processed records to prevent table growth
- [ ] Index `status` and `scheduled_at` for efficient relay queries
- [ ] Outbox write is a DB INSERT within the transaction (~2-5ms)
- [ ] Relay processing: batch of 100 records per worker iteration

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Reliability measures implemented

---

# Testing Checklist

- [ ] `outbox_messages` table with status tracking
- [ ] Idempotency prevents duplicate delivery from relay reprocessing
- [ ] Outbox record created in same transaction as business operation
- [ ] Outbox record stored in same transaction as domain change
- [ ] Outbox size and publish lag monitored
- [ ] Process crash before relay does not lose outbox records
- [ ] Processed records archived or cleaned up on schedule
- [ ] Published records pruned after retention
- [ ] Relay processes outbox records and dispatches webhooks
- [ ] Retry for failed publishes

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Dispatching Webhooks Outside the Business Transaction]
- [ ] [Piggybacking Outbox Records on Business Tables]
- [ ] [No Idempotency in Outbox Relay Processing]
- [ ] [Polling Without Index Strategy]
- [ ] [Not Monitoring Outbox Relay Lag]

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


