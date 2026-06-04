# Skill: Manage Retry and Failure of Incoming Webhook Processing

## Purpose
Handle webhook processing failures with appropriate retry strategies, dead-letter queues, and manual reprocessing for failed webhooks.

## When To Use
- Webhook-dependent business logic that may fail temporarily
- Ensuring no webhook data is lost due to processing errors
- Manual reprocessing of failed webhooks via admin UI

## When NOT To Use
- Idempotent webhook processing where failures are benign
- Log-only webhook consumption

## Prerequisites
- Queue driver for job retries
- Database or cache for failed webhook tracking

## Workflow
1. Classify errors: transient (network, timeout) → retry; permanent (validation) → fail
2. Configure `$tries` and `$backoff` on webhook processing jobs
3. Store failed webhooks in a `failed_webhooks` table with payload, error, timestamp
4. Implement manual reprocessing via admin panel or Artisan command
5. Log failure details with correlation ID for debugging
6. Monitor webhook failure rate and alert on sustained failures
7. Implement exponential backoff for retries with jitter
8. Test failure scenarios: invalid payload, downstream outage, timeout

## Validation Checklist
- [ ] Transient vs permanent error classification
- [ ] `$tries` and `$backoff` configured on jobs
- [ ] Failed webhooks stored for manual reprocessing
- [ ] Admin/command for manual retry
- [ ] Failure rate monitored with alerts
- [ ] Failure scenarios tested end-to-end
