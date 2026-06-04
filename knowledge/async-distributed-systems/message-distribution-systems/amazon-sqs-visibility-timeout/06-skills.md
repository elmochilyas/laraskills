# Skill: Configure Amazon SQS Visibility Timeout and Queue Types

## Purpose
Correctly configure SQS visibility timeout relative to Laravel's `retry_after`, choose between Standard and FIFO queues, and use long polling and redrive policies to prevent double processing and poison message cycles.

## When To Use
Using SQS as the Laravel queue driver; need to prevent double processing from visibility timeout misconfiguration; choosing between Standard vs FIFO queue types.

## When NOT To Use
Sub-millisecond latency required (SQS adds 20-100ms per API call); Horizon monitoring needed (Horizon only supports Redis); FIFO throughput exceeds 300 TPS.

## Prerequisites
- AWS SQS queue created
- Laravel `sqs` queue driver configured in `config/queue.php`
- IAM credentials with `sqs:*` permissions

## Inputs
- Queue type (Standard or FIFO)
- Visibility timeout (seconds)
- `retry_after` config value
- Redrive policy (maxReceiveCount, DLQ ARN)

## Workflow
1. Set SQS visibility timeout (e.g., 60s for default queue)
2. Set `retry_after` in `config/queue.php` 5-10s LESS than visibility timeout
3. Enable long polling: `WaitTimeSeconds=20`
4. Configure redrive policy: `maxReceiveCount=3`, DLQ target
5. For FIFO: enable `ContentBasedDeduplication` or send `MessageDeduplicationId`
6. For FIFO: always include `MessageGroupId` in job payload
7. Test visibility timeout: verify no double processing if worker crashes at `retry_after` boundary

## Validation Checklist
- [ ] `retry_after` < SQS visibility timeout (by 5-10s)
- [ ] Long polling enabled (`WaitTimeSeconds=20`)
- [ ] Redrive policy configured with `maxReceiveCount` and DLQ
- [ ] FIFO queues have `MessageGroupId` on all messages
- [ ] FIFO deduplication configured (content-based or explicit ID)
- [ ] Standard queue selected for throughput > 300 TPS
- [ ] No double processing during crash recovery tests

## Common Failures
- `retry_after` > visibility timeout — double processing
- Short polling default — 10x more API calls
- No redrive policy — poison message cycles forever
- FIFO without `MessageGroupId` — message rejected
- FIFO throughput > 300 TPS — throttling errors

## Decision Points
- Standard: high throughput, no ordering needed
- FIFO: strict ordering needed, < 300 TPS per group
- Visibility timeout: align with max expected job runtime

## Related Rules
- Rule 1: set-retry-after-less-than-visibility-timeout
- Rule 2: use-long-polling
- Rule 3: set-redrive-policy-with-max-receive-count
- Rule 4: use-message-group-id-for-fifo-ordering

## Related Skills
- Implement Dead-Letter Queue Pattern
- Configure Queue Driver Architecture
- Set Backoff Strategies for Retry Timing

## Success Criteria
SQS queue is configured with visibility timeout matching workload, `retry_after` set safely below visibility timeout, long polling enabled, redrive policy preventing poison message cycles, and no double processing under crash scenarios.
