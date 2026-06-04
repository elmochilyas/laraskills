# Skill: Implement the Transactional Inbox Pattern for Reliable Event Processing

## Purpose
Use the transactional inbox pattern to reliably process incoming webhooks or messages by storing them in the same database transaction as domain changes, ensuring exactly-once processing.

## When To Use
- Reliable processing of incoming webhooks/messages
- Ensuring exactly-once processing semantics
- Integrating with at-least-once delivery systems
- Preventing duplicate processing from retried deliveries

## When NOT To Use
- Idempotent-only processing (simpler approach works)
- Low-volume, non-critical integrations

## Prerequisites
- Database for inbox storage
- Queue system for processing inbox records

## Workflow
1. Create `inbox_messages` table: id, message_type, payload, idempotency_key, status, created_at
2. Store incoming message in database transaction
3. Use unique constraint on idempotency key for deduplication
4. Dispatch processing job after transaction commit
5. Process message, update status to `completed`
6. Handle failed messages with retry and dead-letter
7. Implement message pruning for retention
8. Monitor inbox queue depth and processing lag

## Validation Checklist
- [ ] `inbox_messages` table with idempotency key
- [ ] Messages stored in database transaction
- [ ] Unique constraint on idempotency key prevents duplicates
- [ ] Processing job dispatched after transaction commit
- [ ] Status tracking: received → processing → completed/failed
- [ ] Dead-letter handling for failed messages
- [ ] Inbox depth and lag monitored
