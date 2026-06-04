# Skill: Store Webhook Payloads with Idempotency Tracking

## Purpose
Store incoming webhook payloads with idempotency key tracking to enable deduplication, reprocessing, and audit trails for at-least-once delivery guarantees.

## When To Use
- Webhook endpoints with at-least-once delivery semantics
- Need to track duplicate webhook deliveries
- Audit trails for all received webhook payloads
- Manual reprocessing of failed webhooks

## When NOT To Use
- Low-volume, informational webhooks without reprocessing needs
- When storage costs outweigh benefits

## Prerequisites
- Database table or storage for webhook payloads
- Idempotency key or webhook ID from provider

## Workflow
1. Create `webhook_payloads` table: id, source, event_type, payload (JSON), idempotency_key, status, created_at
2. Extract idempotency key from webhook header (`X-Webhook-ID`, `X-Idempotency-Key`)
3. Store payload before processing with status `received`
4. Check for duplicate via idempotency key index
5. Update status to `processing`, `completed`, or `failed`
6. Enable manual reprocessing from admin UI
7. Implement retention/pruning policy for old payloads
8. Log all idempotency checks and results

## Validation Checklist
- [ ] `webhook_payloads` table with idempotency key
- [ ] Payload stored before processing with `received` status
- [ ] Duplicate check via idempotency key
- [ ] Status tracking: received → processing → completed/failed
- [ ] Manual reprocessing available
- [ ] Retention policy configured
- [ ] Idempotency checks logged
