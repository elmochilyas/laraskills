# ECC Anti-Patterns — Amazon SQS

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | async-distributed-systems |
| **Subdomain** | 06-message-distribution-systems |
| **Knowledge Unit** | Amazon SQS |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Visibility Timeout Shorter Than Job Duration — Duplicate Processing
2. Creating Queues Dynamically at Runtime
3. Short Polling — Wasted API Calls and CPU
4. Wrong MessageGroupId — Serial Processing Bottleneck
5. Infinite Retention — Unbounded Queue Growth
6. No Dead-Letter Queue Configuration

---

## Repository-Wide Anti-Patterns

- Defaulting to Standard Queue When FIFO Required
- Ignoring SQS Extended Client for Large Payloads

---

## Anti-Pattern 1: Visibility Timeout Shorter Than Job Duration

### Category
Performance | Reliability

### Description
Setting SQS visibility timeout shorter than the maximum job execution time, causing message redelivery mid-processing and duplicate job execution.

### Why It Happens
Default visibility timeout (30s) is used without considering actual job duration. Teams don't audit job execution times.

### Warning Signs
- Duplicate job processing in production
- Jobs complete successfully but appear to have been processed multiple times
- `visibility_timeout` set to default 30s regardless of job complexity
- Job execution time occasionally exceeds visibility timeout

### Why It Is Harmful
Duplicate side effects — double charges, duplicate notifications, data integrity violations. Wasted worker capacity processing duplicates.

### Real-World Consequences
A 2-minute report generation job has a 30-second visibility timeout — after 30 seconds, a second worker picks up the same message. Both workers generate and email the report. Recipient gets identical reports.

### Preferred Alternative
Set visibility timeout to the job's `timeout at 3×` to account for retries and latency spikes. Use SQS extended client with heartbeats for very long jobs.

### Refactoring Strategy
1. Audit all queue jobs for maximum execution time
2. Set `visibility_timeout` to match the longest job's timeout
3. For long-running jobs, implement heartbeats using SQS extended client
4. Add monitoring for jobs approaching visibility timeout
5. Test with artificially delayed jobs to verify no redelivery

### Detection Checklist
- [ ] `visibility_timeout` uses default 30s value
- [ ] Jobs with execution time exceeding visibility timeout exist
- [ ] Duplicate processing observed in production logs
- [ ] No heartbeat mechanism for long-running jobs

### Related Rules
Always set SQS visibility timeout equal to longest job's timeout at 3× (05-rules.md)

### Related Skills
Configure and Manage Amazon SQS Queues (06-skills.md)

### Related Decision Trees
Queue Platform Selection (07-decision-trees.md)

---

## Anti-Pattern 2: Creating Queues Dynamically at Runtime

### Category
Security | Infrastructure

### Description
Creating SQS queues dynamically in application code instead of pre-provisioning them through infrastructure-as-code.

### Why It Happens
Convenience — creating a queue on demand seems simpler than adding it to Terraform. Dynamic routing patterns generate queue names at runtime.

### Warning Signs
- Queue URL constructed dynamically with user input in queue name
- Application code calls SQS `CreateQueue` API
- IAM policy includes `sqs:CreateQueue` permission for application role
- New queue names appear in AWS console without infrastructure change

### Why It Is Harmful
SQS API rate limits (3000 req/s per account) can be exhausted by an attacker. IAM permissions must be overly permissive. No infrastructure-as-code audit trail. Cost explosion from unmonitored queues.

### Real-World Consequences
An attacker sends requests with randomized queue names — SQS API rate limit is hit, legitimate queue operations fail, and AWS bills spike with thousands of tiny unused queues.

### Preferred Alternative
Pre-provision all queues via Terraform or CloudFormation. Use only pre-defined queue names in application code.

### Refactoring Strategy
1. Identify all dynamic queue creation sites in application code
2. Determine the set of queues needed and create them via Terraform
3. Replace dynamic queue names with static, pre-provisioned queue URLs
4. Remove `sqs:CreateQueue` from application IAM policy
5. Add IAM policy enforcement to block dynamic queue creation

### Detection Checklist
- [ ] Application code contains `CreateQueue` API calls
- [ ] Queue URLs contain dynamically generated segments
- [ ] IAM policy includes `sqs:CreateQueue` for application role
- [ ] New queues appear in AWS console without infrastructure PR

### Related Rules
Never create SQS queues dynamically at runtime (05-rules.md)

### Related Skills
Configure and Manage Amazon SQS Queues (06-skills.md)

### Related Decision Trees
Queue Platform Selection (07-decision-trees.md)

---

## Anti-Pattern 3: Short Polling — Wasted API Calls and CPU

### Category
Performance | Cost

### Description
Using SQS short polling (default `WaitTimeSeconds = 0`) instead of long polling, causing workers to poll frequently with empty responses.

### Why It Happens
Default configuration is not overridden. Teams don't understand the cost implications of short vs long polling.

### Warning Signs
- High SQS API call volume relative to actual message volume
- Worker CPU at 80%+ with low job throughput
- `WaitTimeSeconds` not set in queue configuration
- SQS cost line item higher than expected for message volume

### Why It Is Harmful
Unnecessary API costs. Worker CPU wasted on empty polls. Reduced worker lifespan due to unnecessary I/O.

### Real-World Consequences
10 workers polling every second with empty responses — 864,000 API calls/day at $0.40/million = ~$10/month per worker for nothing. Worker CPU is 80% empty-poll overhead.

### Preferred Alternative
Enable long polling with `WaitTimeSeconds = 20`. Workers block up to 20 seconds waiting for messages, reducing empty polls by 95%.

### Refactoring Strategy
1. Set `WaitTimeSeconds` to 20 in queue connection configuration
2. Configure queue-level `ReceiveMessageWaitTimeSeconds` attribute to 20
3. Reduce number of workers if they were scaled to handle short-poll overhead
4. Monitor SQS API call volume reduction after change
5. Verify job pickup latency stays within acceptable range

### Detection Checklist
- [ ] `WaitTimeSeconds` absent or set to 0 in queue config
- [ ] High ratio of ReceiveMessage API calls to actual messages processed
- [ ] Worker CPU usage high with low job throughput
- [ ] SQS API costs higher than expected

### Related Rules
Always enable SQS long polling (05-rules.md)

### Related Skills
Configure and Manage Amazon SQS Queues (06-skills.md)

### Related Decision Trees
Queue Platform Selection (07-decision-trees.md)

---

## Anti-Pattern 4: Wrong MessageGroupId — Serial Processing Bottleneck

### Category
Performance | Throughput

### Description
Using the same `MessageGroupId` for all messages in a FIFO queue, forcing serial processing regardless of actual ordering requirements.

### Why It Happens
Teams use a static group ID for simplicity. They don't understand that FIFO ordering is per-group, not global.

### Warning Signs
- All messages use the same `MessageGroupId`
- FIFO queue throughput stuck at 300 msg/s regardless of worker count
- Messages from independent tenants process serially
- Throughput tests show no gain from adding workers

### Why It Is Harmful
Throughput capped at 300 msg/s per group. Workers sit idle waiting for messages in other groups. Processing time scales linearly with message count, not in parallel.

### Real-World Consequences
A queue processing webhook events from 100 tenants uses one global group — throughput is 300 msg/s maximum. Adding 20 workers doesn't help because all messages go to one group. One slow event blocks all subsequent events.

### Preferred Alternative
Use tenant or entity-scoped `MessageGroupId` (e.g., `order:tenant_123`). Messages for different scopes process in parallel.

### Refactoring Strategy
1. Identify the natural ordering scope per message type
2. Update message dispatch to use scoped `MessageGroupId`
3. Verify that messages within the same scope are still ordered
4. Monitor throughput increase from parallel processing
5. Test ordering guarantees within each scope

### Detection Checklist
- [ ] Static `MessageGroupId` used for all messages
- [ ] FIFO queue throughput capped at ~300 msg/s
- [ ] Adding workers doesn't increase throughput
- [ ] Independent entities' messages process serially

### Related Rules
Always use correct MessageGroupId for ordering requirements (05-rules.md)

### Related Skills
Configure and Manage Amazon SQS Queues (06-skills.md)

### Related Decision Trees
Queue Platform Selection (07-decision-trees.md)

---

## Anti-Pattern 5: No Dead-Letter Queue Configuration

### Category
Reliability | Data Integrity

### Description
Not configuring a dead-letter queue (DLQ) for SQS, causing messages that exceed max retries to be lost permanently.

### Why It Happens
Default SQS queue configuration has no DLQ. Teams don't anticipate messages that can't be processed.

### Warning Signs
- Queue has no `RedrivePolicy` configured
- Messages disappear after max receive count without trace
- No mechanism to inspect or reprocess failed messages
- Cannot recover messages that all consumers rejected

### Why It Is Harmful
Irrecoverable message loss. No audit trail for processing failures. Manual reconciliation required to identify and reprocess lost messages.

### Real-World Consequences
A malformed JSON payload enters the queue — all consumers fail to process it. After 3 receive attempts, SQS deletes the message permanently. The underlying event is lost with no record.

### Preferred Alternative
Configure a dead-letter queue (DLQ) for each source queue with `maxReceiveCount = 3-5`. Route messages to DLQ after exceeding the threshold.

### Refactoring Strategy
1. Create a DLQ per source queue (or one DLQ shared by similar queues)
2. Set `RedrivePolicy` on source queue with `maxReceiveCount = 3`
3. Grant source queue permission to send messages to DLQ
4. Set up monitoring and alerting on DLQ message count
5. Create a reprocessing command or UI for DLQ messages

### Detection Checklist
- [ ] No DLQ configured on the queue
- [ ] No `RedrivePolicy` in queue attributes
- [ ] Messages disappear without trace after max retries
- [ ] No monitoring or alerting for messages exceeding retries

### Related Rules
Always set visibility timeout to match job duration (05-rules.md)

### Related Skills
Configure and Manage Amazon SQS Queues (06-skills.md)

### Related Decision Trees
Queue Platform Selection (07-decision-trees.md)
