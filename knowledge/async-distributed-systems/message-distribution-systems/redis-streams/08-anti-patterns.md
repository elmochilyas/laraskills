# ECC Anti-Patterns — Redis Streams

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | async-distributed-systems |
| **Subdomain** | 06-message-distribution-systems |
| **Knowledge Unit** | Redis Streams |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Read Timeout — Worker Hangs Indefinitely
2. Ignoring Consumer Group Lag — Silent Message Accumulation
3. No Pending Message Claiming — Lost Messages on Consumer Failure
4. Missing Acknowledgment — Duplicate Processing on Idle Timeout
5. No Dead-Letter Handling — Permanently Unprocessable Messages
6. Using Single Consumer Without Consumer Group — No Load Balancing

---

## Repository-Wide Anti-Patterns

- Treating Redis Streams Like a Simple Queue
- No Stream Trimming — Unbounded Memory Growth

---

## Anti-Pattern 1: No Read Timeout — Worker Hangs Indefinitely

### Category
Reliability | Operations

### Description
Using blocking reads on Redis streams without a timeout, causing workers to hang indefinitely if a network hiccup or Redis failure occurs.

### Why It Happens
Default blocking read behavior has no timeout. Teams assume network is always reliable.

### Warning Signs
- Workers appear alive (process running) but stop processing jobs
- Worker logs show no activity for extended periods
- No `read_timeout` configured in stream connection settings
- Restarting workers temporarily fixes the issue

### Why It Is Harmful
Workers appear healthy in monitoring but are effectively dead. Processing halts silently. Queue backlog grows undetected until manual intervention.

### Real-World Consequences
A network hiccup causes the blocking read to hang — the worker process is alive but not processing. Monitoring shows "all workers up," but zero jobs are processed. By the time anyone notices, the queue has 50,000 backlogged messages.

### Preferred Alternative
Always set a `read_timeout` (e.g., 2 seconds) on blocking reads. The worker reconnects on timeout, recovering from transient failures.

### Refactoring Strategy
1. Set `read_timeout` in stream connection configuration
2. Implement reconnection logic on timeout or failure
3. Add logging for read timeouts to distinguish from idle periods
4. Test by simulating a Redis disconnect while worker is running
5. Verify worker resumes processing after reconnection

### Detection Checklist
- [ ] No `read_timeout` configured in stream connection settings
- [ ] Workers appear alive but stop processing for extended periods
- [ ] Restarting workers restores processing temporarily
- [ ] No reconnection logic in stream consumer

### Related Rules
Always configure read_timeout when consuming Redis streams with blocking reads (05-rules.md)

### Related Skills
Configure and Manage Redis Streams (06-skills.md)

### Related Decision Trees
Stream vs Queue Decision (07-decision-trees.md)

---

## Anti-Pattern 2: Ignoring Consumer Group Lag — Silent Message Accumulation

### Category
Observability | Reliability

### Description
Not monitoring consumer group PEL (Pending Entry List) length and lag, allowing messages to accumulate invisibly when consumers fail.

### Why It Happens
Redis Streams don't have built-in dashboard like Horizon. Teams don't proactively monitor stream health.

### Warning Signs
- Consumer group PEL growing over time
- No monitoring or alerting on stream consumer lag
- Messages pending for hours discovered during incident
- No way to know if all messages have been processed

### Why It Is Harmful
Processing gaps invisible until backlog is massive. Consumer failures go undetected. Service level objectives for processing latency silently violated.

### Real-World Consequences
A consumer crashes mid-processing — its pending messages stay in the PEL forever. Other consumers don't pick them up (they're assigned to the dead consumer). The messages are effectively lost, but no alert fires. Customer orders remain unfulfilled.

### Preferred Alternative
Monitor consumer group PEL length and lag metrics. Alert when PEL exceeds threshold (e.g., >100 pending for >5 minutes).

### Refactoring Strategy
1. Implement PEL and lag monitoring using `XPENDING` and `XINFO GROUPS`
2. Set up alerting when PEL exceeds threshold
3. Create a dashboard showing consumer group health
4. Add automated PEL inspection to health check endpoint
5. Document expected PEL baseline for normal operation

### Detection Checklist
- [ ] No monitoring of consumer group PEL or lag
- [ ] No alerting on stream consumer health
- [ ] Cannot determine current processing backlog
- [ ] Consumer failures discovered only by user reports

### Related Rules
Always monitor consumer group PEL length and lag (05-rules.md)

### Related Skills
Configure and Manage Redis Streams (06-skills.md)

### Related Decision Trees
Stream vs Queue Decision (07-decision-trees.md)

---

## Anti-Pattern 3: No Pending Message Claiming — Lost Messages on Consumer Failure

### Category
Reliability | Data Integrity

### Description
Not implementing pending message claiming (XCLAIM), causing messages assigned to a dead consumer to remain unprocessed indefinitely.

### Why It Happens
Teams assume consumers never fail mid-processing or that idle timeout will eventually redistribute messages.

### Warning Signs
- PEL contains messages assigned to consumers that no longer exist
- Messages remain pending for longer than any job execution time
- No `XCLAIM` logic in consumer implementation
- Manual intervention required to recover stuck messages

### Why It Is Harmful
Messages assigned to dead consumers are never reprocessed. Data loss for those specific events. Incomplete processing chain.

### Real-World Consequences
A consumer crashes mid-process — its 500 pending messages stay in other consumers' limbo. The `XREADGROUP` timeout passes, but messages are assigned to the dead consumer, not redistributed. All 500 messages are effectively lost with no automatic recovery.

### Preferred Alternative
Implement periodic claiming of messages pending beyond a threshold (e.g., >1 hour). Use `XAUTOCLAIM` (Redis 6.2+) or manual `XCLAIM` for older versions.

### Refactoring Strategy
1. Implement a claiming process (cron job, background worker, or inline check)
2. Claim messages pending longer than max expected processing time
3. Set a higher idle timeout on the claiming process to avoid thundering herd
4. Log claiming events for audit trail
5. Test by simulating a consumer crash mid-processing

### Detection Checklist
- [ ] No `XCLAIM` or `XAUTOCLAIM` logic in stream consumer
- [ ] PEL contains messages assigned to defunct consumers
- [ ] Messages remain pending beyond job execution time
- [ ] Manual claiming required to recover stuck messages

### Related Rules
Always implement pending message claiming for failed consumers (05-rules.md)

### Related Skills
Configure and Manage Redis Streams (06-skills.md)

### Related Decision Trees
Stream vs Queue Decision (07-decision-trees.md)

---

## Anti-Pattern 4: Missing Acknowledgment — Duplicate Processing on Idle Timeout

### Category
Data Integrity | Reliability

### Description
Not calling `XACK` after successful message processing, causing messages to remain pending and be reprocessed after idle timeout.

### Why It Happens
Teams forget to acknowledge after processing. Acknowledgment is not part of the default stream consumer pattern.

### Warning Signs
- Messages processed successfully but reprocessed periodically
- Consumer group idle timeout triggers redelivery of already-processed messages
- Job idempotency key shows repeated processing
- PEL contains messages that were successfully processed

### Why It Is Harmful
Duplicate processing — orders fulfilled twice, notifications sent multiple times, data mutations applied repeatedly. Consumer group idle timeout floods workers with previously processed messages.

### Real-World Consequences
Every hour (or after idle timeout), all 10,000 processed-but-unacknowledged messages flood back into the queue — workers reprocess them, causing order duplication and double charges. Idempotency checks prevent the worst outcomes but processing capacity is wasted.

### Preferred Alternative
Always call `XACK` immediately after successful message processing, before any subsequent operations.

### Refactoring Strategy
1. Audit all stream processing code for missing `XACK` calls
2. Add `XACK` call immediately after processing completes
3. Implement try/finally pattern to ensure `XACK` is called even on processing errors
4. Add logging that distinguishes acknowledged vs unacknowledged messages
5. Test by verifying PEL decreases on successful processing

### Detection Checklist
- [ ] No `XACK` call after message processing
- [ ] Already-processed messages reprocessed on idle timeout
- [ ] PEL grows despite successful processing
- [ ] Duplicate processing observed at regular intervals

### Related Rules
Always call XACK after successful message processing (05-rules.md)

### Related Skills
Configure and Manage Redis Streams (06-skills.md)

### Related Decision Trees
Stream vs Queue Decision (07-decision-trees.md)

---

## Anti-Pattern 5: No Dead-Letter Handling — Permanently Unprocessable Messages

### Category
Reliability | Operations

### Description
Not implementing dead-letter logic for stream messages that repeatedly fail processing, causing infinite retry cycles or message loss.

### Why It Happens
Teams rely solely on the retry mechanism without a circuit breaker for permanently failing messages.

### Warning Signs
- Same messages appear in PEL for days
- Workers spend significant time on messages that always fail
- No separate stream or mechanism for failed messages
- No manual reprocessing capability

### Why It Is Harmful
Workers waste cycles on unprocessable messages. Valid messages behind the bad message are delayed. Monitoring noise from repeated failures.

### Real-World Consequences
A message with malformed JSON payload is claimed and retried every hour for a week. Each retry consumes worker time and generates error logs. Valid messages behind it are delayed. No dead-letter stream exists to quarantine the bad message.

### Preferred Alternative
Create a dead-letter stream for messages exceeding max retry count. Route them for manual inspection and reprocessing after the root cause is fixed.

### Refactoring Strategy
1. Create a dedicated dead-letter stream
2. Add retry count tracking to message processing (message metadata)
3. After N failures, move message to dead-letter stream instead of claiming
4. Set up alerting on dead-letter stream entry count
5. Create a reprocessing command or UI
6. Add monitoring dashboard for dead-letter stream

### Detection Checklist
- [ ] No dead-letter stream for persistently failing messages
- [ ] Same messages retried indefinitely consuming worker time
- [ ] No mechanism to quarantine unprocessable messages
- [ ] Failed message backlog mixed with healthy messages

### Related Rules
Always implement pending message claiming for failed consumers (05-rules.md)

### Related Skills
Configure and Manage Redis Streams (06-skills.md)

### Related Decision Trees
Stream vs Queue Decision (07-decision-trees.md)

---

## Anti-Pattern 6: Using Single Consumer Without Consumer Group — No Load Balancing

### Category
Scalability | Performance

### Description
Using a single consumer reading directly from a stream without a consumer group, preventing horizontal scaling and load-balanced processing.

### Why It Happens
Teams start with a simple consumer for development and never migrate to consumer groups for production.

### Warning Signs
- Stream consumed without a consumer group
- Only one consumer processes all stream messages
- Adding more consumer processes doesn't increase throughput
- No `XREADGROUP` in consumer code — using `XREAD` instead

### Why It Is Harmful
Cannot scale processing horizontally. Single consumer is a bottleneck and single point of failure. No consumer group features (acknowledgment, pending list, claiming).

### Real-World Consequences
A stream processing 1000 events/second is consumed by a single process — it's CPU-bound at 800 events/second. Adding two more consumer processes doesn't help because they all read the same messages. Backlog grows indefinitely.

### Preferred Alternative
Always use consumer groups for production stream consumption. Each consumer in the group reads different messages, enabling horizontal scaling.

### Refactoring Strategy
1. Create a consumer group for the stream
2. Update consumer code to use `XREADGROUP` instead of `XREAD`
3. Configure consumer name per process instance
4. Implement acknowledgment and claiming as part of the consumer group pattern
5. Scale consumers up to match throughput requirements

### Detection Checklist
- [ ] Stream consumed without a consumer group
- [ ] Single consumer processes all stream messages
- [ ] No `XREADGROUP` in consumer implementation
- [ ] Adding consumer processes doesn't increase throughput

### Related Rules
Always configure read_timeout when consuming Redis streams with blocking reads (05-rules.md)

### Related Skills
Configure and Manage Redis Streams (06-skills.md)

### Related Decision Trees
Stream vs Queue Decision (07-decision-trees.md)
