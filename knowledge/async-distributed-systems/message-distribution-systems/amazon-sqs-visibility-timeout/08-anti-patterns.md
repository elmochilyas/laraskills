---
Domain: Async & Distributed Systems
Subdomain: Message Distribution Systems
Knowledge Unit: K039 — Amazon SQS Visibility Timeout and Queue Types
Knowledge ID: K039
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | `retry_after` Greater Than Visibility Timeout | Configuration | Critical |
| 2 | Short Polling Without `WaitTimeSeconds` | Cost/Performance | Medium |
| 3 | No Redrive Policy for Poison Messages | Reliability | High |
| 4 | FIFO Queue Without `MessageGroupId` | Configuration | High |
| 5 | FIFO Queue for Throughput > 300 TPS | Architecture | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| retry_after > Visibility Timeout | Critical — guaranteed double processing on timeout | Automated config validation; deployment guard |
| No DLQ Configuration | High — poison messages cycle forever consuming workers | Mandatory redrive policy for all queues |
| Short Polling Default | Medium — 10x API cost increase with no benefit | Default `WaitTimeSeconds=20` in queue config |

---

## 1. `retry_after` Greater Than Visibility Timeout

### Category
Configuration

### Description
Setting Laravel's `retry_after` config value higher than the SQS visibility timeout. When the visibility timeout expires, SQS makes the message visible to other workers, but Laravel still considers the job running. A second worker picks up the same message — double processing guaranteed.

### Why It Happens
- Not understanding the relationship between `retry_after` and visibility timeout
- Setting `retry_after` based on job runtime without checking SQS visibility timeout
- Default `retry_after` (90) higher than default visibility timeout (30-60)
- Changing visibility timeout in AWS console without updating Laravel config
- Assuming Laravel controls message visibility (it doesn't — SQS does)

### Warning Signs
- Jobs are processed multiple times under normal operation
- Worker crashes followed by message reappearance in queue
- Duplicate side effects (double emails, double charges) at `retry_after` intervals
- CloudWatch logs show same message processed by different workers
- `ApproximateReceiveCount` on SQS messages is >1 for successful jobs

### Why Harmful
- Guaranteed double processing when job runtime exceeds visibility timeout
- Side effects (emails, API calls, payments) are executed multiple times
- At-least-once delivery becomes at-least-twice delivery every time
- No idempotency layer can save against concurrent processing
- Debugging is confusing — "why is this job running twice?"

### Consequences
- Duplicate charges to customers, duplicate emails, duplicate API calls
- Data inconsistency from duplicate processing
- Customer complaints about double charges or notifications
- Emergency fix required to stop double processing
- Financial impact from repeated side effects

### Alternative
- Always ensure `retry_after` < SQS visibility timeout (by 5-10 seconds):
  ```php
  'sqs' => [
      'retry_after' => 50, // Visibility timeout = 60 (set in AWS)
  ],
  ```
- Set visibility timeout in AWS console to `max_job_runtime + 10`
- Keep a safety margin — never set them equal (race condition)

### Refactoring Strategy
1. Check current SQS visibility timeout in AWS console
2. Set `retry_after` in `config/queue.php` to `visibility_timeout - 10`
3. Deploy config change
4. Verify double processing stops (check ApproximateReceiveCount)
5. Add CI check: warn if `retry_after >= visibility_timeout`

### Detection Checklist
- [ ] `retry_after` < SQS visibility timeout (by 5-10s)
- [ ] No jobs showing `ApproximateReceiveCount > 1` for successful completions
- [ ] Config check in CI pipeline for retry_after vs visibility timeout
- [ ] Visibility timeout documented for each queue
- [ ] No race condition (retry_after != visibility_timeout)

### Related Rules
- set-retry-after-less-than-visibility-timeout

### Related Skills
- Configure Amazon SQS Visibility Timeout and Queue Types

### Related Decision Trees
- retry_after vs Visibility Timeout Alignment

---

## 2. Short Polling Without `WaitTimeSeconds`

### Category
Cost / Performance

### Description
Using SQS short polling (default behavior without `WaitTimeSeconds`) which returns immediately even when the queue is empty. Each empty response costs the same API call as one with messages, leading to 10x more API requests for the same throughput.

### Why It Happens
- Default SQS behavior is short polling (returns immediately)
- Not configuring `WaitTimeSeconds` in the Laravel queue config
- Not knowing SQS charges per API request regardless of response content
- Short polling seems "faster" because it returns immediately
- Copying config from examples that omit long polling

### Warning Signs
- SQS API costs are unexpectedly high
- CloudWatch shows `NumberOfEmptyReceives` >> `NumberOfMessagesReceived`
- Queue worker CPU is dominated by API call overhead (not job processing)
- `ReceiveMessage` API calls are 10x message processing rate
- Config file missing `WaitTimeSeconds` parameter

### Why Harmful
- Each empty receive costs the same as a successful one
- 90%+ of API calls return no messages during quiet periods
- SQS costs scale with polling frequency, not message volume
- Workers spin CPU doing API calls instead of processing jobs
- Short polling increases load on SQS and application network

### Consequences
- Higher AWS bills for queue operations
- Worker CPU wasted on empty API calls
- Lower effective throughput per worker
- Higher latency (empty responses return faster but more are needed)
- Scaling workers increases costs linearly, not sub-linearly

### Alternative
- Always enable long polling with `WaitTimeSeconds=20`:
  ```php
  'sqs' => [
      'retry_after' => 50,
      'WaitTimeSeconds' => 20,
  ],
  ```
- Long polling waits up to 20 seconds for messages, returning when available or after timeout
- Reduces API calls by up to 90% for the same message throughput

### Refactoring Strategy
1. Add `'WaitTimeSeconds' => 20` to SQS queue config in `config/queue.php`
2. Deploy config change
3. Monitor SQS API call count — expect 90% reduction
4. Verify latency is acceptable (max 20s wait for new messages)
5. Consider lower values (5-10) if 20s latency is too high

### Detection Checklist
- [ ] `WaitTimeSeconds` configured in `config/queue.php`
- [ ] SQS API call count reduced by expected 80-90%
- [ ] No increase in job processing latency
- [ ] Empty receive rate is low (< 20% of total)
- [ ] Queue worker CPU usage decreased

### Related Rules
- use-long-polling

### Related Skills
- Configure Amazon SQS Visibility Timeout and Queue Types

### Related Decision Trees
- Standard vs FIFO SQS Queue Selection

---

## 3. No Redrive Policy for Poison Messages

### Category
Reliability

### Description
Running SQS queues without a configured redrive policy (dead-letter queue with `maxReceiveCount`). Messages that always fail processing are re-delivered infinitely — each retry consumes worker time, fills logs, and never resolves.

### Why It Happens
- Not setting up a DLQ when creating the SQS queue
- Assuming all messages will eventually process successfully
- Not considering corrupt or invalid messages
- Focused on normal operation, not failure modes
- No monitoring for message receive count

### Warning Signs
- Same message processed 10+ times (visible in CloudWatch or logs)
- Worker repeatedly fails on the same job
- Horizon or queue dashboard shows high retry counts for specific jobs
- Logs show identical errors for the same message over hours
- No DLQ exists in the SQS configuration

### Why Harmful
- Poison message consumes worker resources on EVERY retry forever
- Each retry adds to processing cost (compute + API calls)
- Error logs are flooded with the same error — real issues get buried
- Worker may be stuck on the poison message, delaying valid messages
- No mechanism to isolate and inspect the problematic message

### Consequences
- Workers always busy with failing messages
- Valid messages behind poison message are delayed
- Infinite AWS costs from the repeatedly processed poison message
- Ops team must manually find and delete the message
- No audit trail of the poison message (automatic DLQ preserves it)

### Alternative
- Always configure redrive policy:
  - Create a DLQ (same type: Standard or FIFO)
  - Set `maxReceiveCount = 3` (or 5 for retry-heavy workflows)
  - Configure redrive allow policy on the source queue
- Let the DLQ capture problematic messages for inspection
- Set up alerting on DLQ message count

### Refactoring Strategy
1. Create dead-letter queue in AWS SQS (same type as source queue)
2. Configure redrive policy on source queue: `maxReceiveCount = 3`, DLQ ARN
3. Alert on DLQ message count > 0
4. Set up DLQ reprocessing workflow (manual inspection, fix, replay)
5. Monitor DLQ growth — correlate with application errors

### Detection Checklist
- [ ] DLQ exists for every SQS queue
- [ ] `maxReceiveCount` set (3-5 depending on retry policy)
- [ ] Alert on DLQ message arrival
- [ ] DLQ reprocessing workflow documented
- [ ] No message processed more than `maxReceiveCount` times
- [ ] DLQ retention period set appropriately (14 days default)

### Related Rules
- set-redrive-policy-with-max-receive-count

### Related Skills
- Configure Amazon SQS Visibility Timeout and Queue Types

### Related Decision Trees
- Standard vs FIFO SQS Queue Selection

---

## 4. FIFO Queue Without `MessageGroupId`

### Category
Configuration

### Description
Using a FIFO SQS queue without providing `MessageGroupId` in the job payload. FIFO queues require `MessageGroupId` — without it, SQS rejects the message, and the job fails at dispatch time.

### Why It Happens
- Developer doesn't know FIFO queues require `MessageGroupId`
- Testing with Standard queues (no MessageGroupId needed), then switching to FIFO
- Not reading SQS FIFO documentation
- Assuming `MessageGroupId` is optional or defaults to something
- Copy-paste from Standard queue config to FIFO

### Warning Signs
- Jobs fail immediately with SQS "MissingRequiredParameter" error
- Queue worker logs show SQS API errors on send
- Failed jobs dashboard fills with dispatch-time failures
- Changing queue type to FIFO breaks existing job dispatches
- Error: "The request must contain the MessageGroupId parameter"

### Why Harmful
- Messages are rejected by SQS — jobs never reach the queue
- Critical job processing stops entirely when switching to FIFO
- No automatic fallback — failure happens at dispatch time
- Application may silently drop jobs (if dispatch exception is caught)
- Dead-letter queue receives the same message repeatedly

### Consequences
- All jobs targeting FIFO queues fail to dispatch
- Processing pipeline halts — no jobs processed
- Emergency workaround: switch back to Standard queue
- Developer time wasted debugging SQS API errors
- Data loss if dispatch exceptions are swallowed

### Alternative
- Always include `MessageGroupId` in job payloads for FIFO queues:
  ```php
  class ProcessOrder implements ShouldQueue
  {
      public function __construct(public int $orderId) {}
  
      public function middleware(): array
      {
          return [new RateLimited];
      }
  
      public function displayName(): string
      {
          return 'ProcessOrder:'.$this->orderId;
      }
  }
  ```
- Set `MessageGroupId` via custom job middleware or dispatch helper
- Use entity ID (user ID, order ID) as the message group ID

### Refactoring Strategy
1. Identify all jobs dispatched to FIFO queues
2. Add `MessageGroupId` based on entity ID or job type
3. If using custom queue, configure MessageGroupId in the SQS driver
4. Test dispatch — verify no SQS errors
5. Enable `ContentBasedDeduplication` for FIFO to avoid explicit dedup IDs

### Detection Checklist
- [ ] All FIFO-targeted jobs include `MessageGroupId`
- [ ] No SQS "MissingRequiredParameter" errors
- [ ] `ContentBasedDeduplication` enabled when appropriate
- [ ] MessageGroupId uses meaningful entity ID (not random)
- [ ] Test FIFO queue dispatch succeeds

### Related Rules
- use-message-group-id-for-fifo-ordering

### Related Skills
- Configure Amazon SQS Visibility Timeout and Queue Types

### Related Decision Trees
- Standard vs FIFO SQS Queue Selection

---

## 5. FIFO Queue for Throughput > 300 TPS

### Category
Architecture

### Description
Using a FIFO SQS queue for workloads that exceed 300 transactions per second (or 3000 with batching). SQS throttles FIFO queues above this limit, causing message rejections and processing delays.

### Why It Happens
- Developer needs ordering and chooses FIFO without evaluating throughput
- Traffic grows over time and exceeds FIFO limits
- Not knowing FIFO has a throughput cap (Standard has none)
- Load testing uses Standard, production switches to FIFO — surprise at scale
- Assuming SQS auto-scales like Standard queues

### Warning Signs
- SQS `ThrottlingException` errors in production
- Messages fail to send during peak traffic
- Queue processing backlog grows during high-throughput periods
- CloudWatch shows `ApproximateNumberOfMessagesDelayed` growing
- Throughput never exceeds 300 TPS despite demand

### Why Harmful
- Hard throughput cap prevents application scaling
- Throttling causes message send failures — jobs are lost
- Processing pipeline cannot keep up with demand
- Emergency workaround required during traffic peaks
- FIFO's ordering guarantee becomes meaningless if messages fail to send

### Consequences
- Lost jobs during traffic spikes
- Application features dependent on queue processing fail
- Customer-facing delays (orders not processed, notifications not sent)
- Emergency architecture change (switch from FIFO to Standard)
- Revenue impact from unprocessed transactions

### Alternative
- Use Standard SQS queue for high-throughput unordered processing
- Use FIFO with multiple message group IDs (parallel ordered groups)
- Implement ordering at the application level (not queue level)
- Consider Kafka for high-throughput ordered processing
- Batch messages to reach 3000 TPS (10 messages per batch)

### Refactoring Strategy
1. Measure peak throughput against 300 TPS limit
2. If consistently above 300 TPS: switch to Standard queue
3. Use multiple message group IDs to parallelize within FIFO limits
4. Or migrate to Kafka for high-throughput ordered processing
5. Update job processing to handle out-of-order delivery if switching to Standard
6. Add idempotency to handle Standard queue's at-least-once delivery

### Detection Checklist
- [ ] FIFO queue throughput < 300 TPS at peak
- [ ] No SQS `ThrottlingException` errors
- [ ] Batch processing used if approaching 3000 TPS
- [ ] Standard queue considered for high-throughput workloads
- [ ] Message group ID strategy allows parallelism within FIFO limits

### Related Rules
- match-queue-type-to-workload

### Related Skills
- Configure Amazon SQS Visibility Timeout and Queue Types

### Related Decision Trees
- Standard vs FIFO SQS Queue Selection
