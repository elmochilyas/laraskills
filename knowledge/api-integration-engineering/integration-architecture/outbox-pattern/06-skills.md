# Skill: Implement the Transactional Outbox Pattern for Reliable Event Publishing

## Purpose
Use the transactional outbox pattern to reliably publish events (webhooks, messages) by storing them in the same database transaction as domain changes, ensuring eventual delivery.

## When To Use
- Reliable publishing of webhooks or domain events
- Ensuring events are published even if the publisher crashes
- Integrating with message brokers or webhook delivery systems
- Maintaining consistency between database state and event publication

## When NOT To Use
- Eventual consistency is acceptable without outbox
- Simple synchronous event dispatch suffices

## Prerequisites
- Database for outbox storage
- Queue or worker to publish outbox records

## Workflow
1. Create `outbox_messages` table: id, event_type, payload, status, created_at
2. Store outbox record in same transaction as domain changes
3. Worker polls outbox for pending messages periodically
4. Publish pending messages to broker/webhook dispatch
5. Update status to `published` on successful publish
6. Implement retry for failed publishes
7. Prune published records after retention period
8. Monitor outbox table size and publish lag

## Validation Checklist
- [ ] `outbox_messages` table with status tracking
- [ ] Outbox record stored in same transaction as domain change
- [ ] Worker polls and publishes pending messages
- [ ] Status updated on successful publish
- [ ] Retry for failed publishes
- [ ] Published records pruned after retention
- [ ] Outbox size and publish lag monitored
