# Skill: Configure and Manage Amazon SQS Queues

## Purpose
Configure Amazon SQS as a Laravel queue driver, set up Standard and FIFO queues with correct visibility timeout alignment, long polling, dead-letter queues, and IAM least-privilege policies.

## When To Use
Using SQS as the primary Laravel queue driver; migrating from Redis to SQS for managed queue infrastructure; setting up SQS for a new Laravel application; configuring FIFO queues for ordered processing.

## When NOT To Use
Horizon monitoring required; sub-millisecond latency needed; FIFO throughput > 300 TPS per group; simple single-server applications where database queue suffices.

## Prerequisites
- AWS account with SQS access
- IAM user/role with queue permissions
- Laravel 11+ application
- AWS SDK for PHP (`aws/aws-sdk-php`) installed
- Queue driver config in `config/queue.php`

## Inputs
- Queue type (Standard or FIFO)
- Queue name and region
- Visibility timeout in seconds
- Worker job timeout configuration
- Expected throughput per queue
- Dead-letter queue target (optional)
- IAM policy requirements

## Workflow
1. **Choose queue type:** Standard for high throughput/no ordering; FIFO for strict ordering ≤ 300 TPS
2. **Provision queues via IaC:** Create queue + DLQ via Terraform/CloudFormation
3. **Configure `config/queue.php`:**
   - Set `driver` to `'sqs'`
   - Provide `key`, `secret`, `prefix`, `queue`, `region`
   - Set `retry_after` to 5-10s less than SQS visibility timeout
   - Add `attributes.WaitTimeSeconds` = 20 for long polling
   - Add `attributes.MessageRetentionPeriod` = 345600 (4 days)
4. **Configure DLQ:**
   - Create DLQ with same configuration as source queue
   - Set `RedrivePolicy` on source queue: `maxReceiveCount=3`, DLQ ARN
   - Grant source queue `sqs:SendMessage` to DLQ
5. **For FIFO queues:**
   - Append `.fifo` to queue name
   - Enable `ContentBasedDeduplication` or provide `MessageDeduplicationId`
   - Always include `MessageGroupId` in dispatched jobs
6. **Set IAM least privilege:**
   - Application role: `sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:ChangeMessageVisibility`, `sqs:SendMessage`
   - Infrastructure role: `sqs:CreateQueue`, `sqs:DeleteQueue`, `sqs:SetQueueAttributes`, `sqs:TagQueue`
7. **Test visibility timeout alignment:**
   - Dispatch a job that simulates crash at `retry_after` boundary
   - Verify no double processing
8. **Monitor queue health:**
   - Set up CloudWatch alarms: `ApproximateNumberOfMessagesVisible`, `ApproximateAgeOfOldestMessage`, DLQ depth
   - Monitor API call volume and cost

## Validation Checklist
- [ ] Queue created via IaC, not dynamically in application code
- [ ] `retry_after` < visibility timeout (5-10s margin)
- [ ] Long polling enabled (`WaitTimeSeconds=20`)
- [ ] DLQ configured with `maxReceiveCount=3`
- [ ] FIFO queue name ends with `.fifo`
- [ ] FIFO deduplication configured (content-based or explicit ID)
- [ ] `MessageGroupId` set on all FIFO dispatches
- [ ] IAM policy uses least privilege (no `CreateQueue` for app role)
- [ ] CloudWatch alarms configured for queue depth and DLQ
- [ ] Double-processing test passes with crash-at-boundary scenario
- [ ] Job serialization compatible across all consuming applications
- [ ] Delayed dispatching not used with FIFO (not supported)

## Common Failures
- **Double processing:** `retry_after` > visibility timeout — fix by reducing `retry_after`
- **Cost explosion:** Short polling default — enable long polling
- **Poison message loop:** No DLQ — add RedrivePolicy
- **FIFO throttling:** Throughput > 300 TPS — use multiple group IDs or switch to Standard
- **FIFO message rejection:** Missing `MessageGroupId` — always include it
- **Queue creation rate limited:** Dynamic queue creation — pre-provision all queues
- **Cross-app job deserialization:** Different Laravel versions or class maps — standardize across apps

## Decision Points
- Standard vs FIFO: ordering requirement + throughput
- `retry_after` value: max job runtime + 10s margin
- DLQ `maxReceiveCount`: 3 for most jobs, 5 for flaky external dependencies
- Long polling timeout: 20s for production, 0-5s for dev

## Related Rules
- bump-visibility-timeout-for-job-duration (05-rules.md)
- never-create-queues-on-the-fly (05-rules.md)
- use-same-message-group-id-for-dedup (05-rules.md)
- handle-sqs-long-poll-correctly (05-rules.md)

## Related Skills
- Configure Job Retry and Failure Strategies
- Implement Dead-Letter Queue Pattern
- Set Up Queue Monitoring with CloudWatch
- Design IAM Policies for Queue Access

## Related Decision Trees
- Queue Platform Selection (07-decision-trees.md)
- Standard vs FIFO Queue Selection (07-decision-trees.md)

## Success Criteria
SQS queues are provisioned via IaC, configured with correct visibility timeout alignment, long polling enabled, DLQ set up for poison message handling, FIFO queues properly configured with group IDs and deduplication, IAM policies follow least privilege, and monitoring alerts on queue depth and DLQ activity.
