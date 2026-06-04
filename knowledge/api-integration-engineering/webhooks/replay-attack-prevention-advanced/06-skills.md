# Skill: Prevent Incoming Webhook Replay Attacks

## Purpose
Implement replay attack prevention for incoming webhooks using timestamp validation and nonce/idempotency key tracking.

## When To Use
- All webhooks processing mutating operations
- Financial, compliance, or security-sensitive webhook data
- Idempotency-critical webhook endpoints

## When NOT To Use
- Read-only/informational webhook processing
- Provider-managed replay protection

## Prerequisites
- Timestamp or nonce in webhook header
- Cache driver for nonce storage

## Workflow
1. Check `X-Webhook-Timestamp` header is present
2. Validate timestamp is within acceptable window (default: 5 minutes)
3. Check `X-Webhook-Nonce` or `Idempotency-Key` in cache for duplicates
4. Store nonce in cache with TTL matching the timestamp window
5. Verify signature includes the timestamp
6. Reject requests outside the window (401/400)
7. Accept duplicates silently (return 200) for idempotency
8. Log replay attempts for security monitoring

## Validation Checklist
- [ ] Timestamp validated within acceptable window
- [ ] Nonce/idempotency key cached and checked
- [ ] Duplicate requests return 200 (idempotent)
- [ ] Signature includes timestamp in computation
- [ ] Outside-window requests rejected
- [ ] Replay attempts logged
