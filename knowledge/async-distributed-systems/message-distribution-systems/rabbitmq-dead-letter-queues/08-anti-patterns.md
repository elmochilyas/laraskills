---
Domain: Async & Distributed Systems
Subdomain: Message Distribution Systems
Knowledge Unit: K037 — RabbitMQ Dead-Letter Queues and Per-Message Ack
Knowledge ID: K037
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | No DLX on Production Queues | Configuration | Critical |
| 2 | `basic.reject` with `requeue=true` for Poison Messages | Reliability | Critical |
| 3 | No Monitoring on DLQ Depth/Age | Operations | High |
| 4 | DLQ with Auto-Ack Consumer | Configuration | High |
| 5 | Not Setting `x-delivery-limit` | Reliability | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| No DLX = Silent Message Drop | Critical — rejected messages vanish without trace | Mandatory DLX configuration for all production queues |
| Infinite Requeue Loop | Critical — poison message consumed forever | Always use `requeue=false`; set `x-delivery-limit` |
| Unmonitored DLQ | High — failures invisible until disk exhaustion | Mandatory DLQ monitoring with alert thresholds |

---

## 1. No DLX on Production Queues

### Category
Configuration

### Description
Running production RabbitMQ queues without a configured Dead-Letter Exchange (DLX). When a consumer rejects a message (`basic.nack` with `requeue=false`) and no DLX is configured, the broker silently drops the message — no audit trail, no recovery, no notification.

### Why It Happens
- Developer doesn't know about DLX configuration
- Default RabbitMQ queue has no DLX
- Not including DLX in infrastructure-as-code queue definitions
- Assuming rejected messages are logged or saved somewhere
- Copying development queue definitions (which may skip DLX) to production

### Warning Signs
- Rejected messages disappear without trace
- No dead-letter queue exists in RabbitMQ management UI
- Queue definition lacks `x-dead-letter-exchange` argument
- Application logs show successful rejection, but no message in DLQ
- Failed message investigations: "the message was rejected but where did it go?"

### Why Harmful
- Rejected messages are permanently lost — no recovery possible
- No audit trail of which messages failed or why
- Poison messages that should be isolated are instead deleted silently
- Debugging failed processing is impossible — the evidence is gone
- Business data loss from messages that were rejected but contain valuable information

### Consequences
- Permanent data loss for all rejected messages
- No ability to reprocess failed messages after fixing the issue
- Hours of debugging: "the consumer rejected it, where's the message?"
- Lost business transactions from rejected messages
- Compliance violations if rejected messages should be retained

### Alternative
- Always configure DLX on production queues:
  ```php
  $channel->queue_declare('orders', false, true, false, false, false, [
      'x-dead-letter-exchange' => ['S', 'orders-dlx'],
  ]);
  ```
- Create and bind a dead-letter queue to the DLX
- Set up alerting on DLQ message arrival

### Refactoring Strategy
1. For each production queue, declare a DLX
2. Create dead-letter queue and bind to DLX
3. Update queue declaration to include `x-dead-letter-exchange`
4. Test rejection: send poison message, confirm it appears in DLQ
5. Set up alerting on DLQ

### Detection Checklist
- [ ] Every production queue has `x-dead-letter-exchange` configured
- [ ] DLQ exists and is bound to the DLX
- [ ] No rejected messages silently dropped (check broker logs)
- [ ] DLQ has a consumer or monitoring attached
- [ ] DLX routing key configured correctly
- [ ] Non-production queues documented as having no DLX

### Related Rules
- configure-dlx-for-failed-messages

### Related Skills
- Configure RabbitMQ Dead-Letter Queues

### Related Decision Trees
- RabbitMQ DLX vs Application-Level DLQ

---

## 2. `basic.reject` with `requeue=true` for Poison Messages

### Category
Reliability

### Description
Using `basic.reject` or `basic.nack` with `requeue=true` (default behavior) for messages that have permanent failures. The message is returned to the original queue immediately, where the same consumer picks it up and fails again — creating an infinite retry loop.

### Why It Happens
- Not specifying `requeue=false` explicitly
- Assuming requeue has backoff or delay (it doesn't — immediate requeue)
- Not understanding the difference between requeue and dead-letter routing
- Copy-paste from generic error handling patterns
- Not testing with actual poison messages

### Warning Signs
- Same message processed thousands of times (same message ID in logs)
- Consumer CPU at 100% processing one message repeatedly
- Logs show identical error for the same message at millisecond intervals
- Other messages in the queue are never processed (stuck behind poison message)
- RabbitMQ management shows rapid delivery count increase for one message

### Why Harmful
- Single poison message blocks all other messages in the queue
- Consumer resources wasted on infinite retries
- No progress on valid messages behind the poison message
- Logs flooded with same error — real issues invisible
- Head-of-line blocking for the entire queue

### Consequences
- Queue processing stalls completely
- Valid messages behind poison message delayed indefinitely
- Consumer CPU usage at 100% — may crash from resource exhaustion
- Infinite cloud/compute costs from the spinning consumer
- Emergency manual intervention to remove the poison message

### Alternative
- Always use `requeue=false` for non-retryable failures:
  ```php
  $channel->basic_nack($deliveryTag, false, false); // requeue=false
  ```
- Let the message route to DLX for inspection
- For retryable failures: use `requeue=true` only with delivery limit
- Implement delayed retry via TTL + DLX routing

### Refactoring Strategy
1. Identify all `basic.reject` and `basic.nack` calls in consumer code
2. Change to `requeue=false` for non-retryable failures
3. Ensure DLX is configured on the queue (otherwise message is dropped)
4. For retryable failures: set `x-delivery-limit` to cap retries
5. Test with poison message — confirm it goes to DLQ, not infinite loop

### Detection Checklist
- [ ] Non-retryable failures use `requeue=false`
- [ ] No message has >10 delivery attempts for a single failure
- [ ] Queue processing continues after poison message (not stuck)
- [ ] DLX configured for all queues with `requeue=false`
- [ ] Delivery limit set to prevent infinite retry loops

### Related Rules
- configure-dlx-for-failed-messages

### Related Skills
- Configure RabbitMQ Dead-Letter Queues

### Related Decision Trees
- RabbitMQ DLX vs Application-Level DLQ

---

## 3. No Monitoring on DLQ Depth/Age

### Category
Operations

### Description
Having a dead-letter queue configured but no monitoring or alerting on its depth, oldest message age, or growth rate. Failures accumulate in the DLQ silently — by the time someone notices, the queue may be overflowing with thousands of failed messages.

### Why It Happens
- Setting up DLX/DLQ is considered "done" without monitoring
- No monitoring infrastructure for RabbitMQ metrics
- Assuming someone will notice DLQ messages during normal operations
- Not knowing DLQ monitoring is essential to the dead-letter pattern
- Only monitoring main queues, not infrastructure queues

### Warning Signs
- DLQ has thousands of messages but no one is aware
- Alert fires because RabbitMQ disk usage is high (DLQ filled disk)
- Investigation reveals DLQ has been growing for days unnoticed
- No metrics or dashboard for DLQ depth
- DLQ messages are very old (days or weeks) — failures happened long ago

### Why Harmful
- DLQ without monitoring is a silent failure sink
- Failures can accumulate to thousands before anyone notices
- Disk space fills up, causing RabbitMQ to block all publishers
- Old failures are hard to investigate (context lost, logs rotated)
- Time-to-detection for processing failures is days or weeks

### Consequences
- Delayed detection of production issues
- RabbitMQ broker blocking due to disk full (all publishing stops)
- Lost investigation context for old failed messages
- Emergency cleanup of thousands of DLQ messages
- Compliance violations if DLQ messages are PII and unbounded

### Alternative
- Monitor DLQ depth with alert threshold:
  ```bash
  # RabbitMQ management API
  curl -s http://localhost:15672/api/queues | jq '.[] | select(.name | endswith("dlq")) | {name, messages, messages_ready}'
  ```
- Set alert: DLQ depth > 10 or oldest message > 1 hour
- Monitor DLQ growth rate for trend analysis
- Add DLQ metrics to team dashboard

### Refactoring Strategy
1. Set up DLQ monitoring (Prometheus, Datadog, or RabbitMQ management API)
2. Configure alerts: warning at DLQ depth > 10, critical at > 100
3. Add oldest message age alert: > 1 hour
4. Create DLQ investigation runbook
5. Review DLQ trends weekly

### Detection Checklist
- [ ] DLQ depth monitored with alert threshold
- [ ] Oldest message age monitored (> 1 hour alerts)
- [ ] DLQ dashboard visible to team
- [ ] Runbook for DLQ investigation exists
- [ ] DLQ growth reviewed weekly
- [ ] No silent DLQ accumulation incidents in past month

### Related Rules
- route-dead-lettered-to-named-queue

### Related Skills
- Configure RabbitMQ Dead-Letter Queues

### Related Decision Trees
- RabbitMQ DLX vs Application-Level DLQ

---

## 4. DLQ with Auto-Ack Consumer

### Category
Configuration

### Description
Consuming from a dead-letter queue using auto-acknowledgment mode. Messages are removed from the DLQ immediately upon delivery — if the DLQ consumer crashes before fully processing the message, it's permanently lost, defeating the purpose of the DLQ.

### Why It Happens
- Setting up DLQ consumer with default auto-ack behavior
- Not distinguishing between DLQ consumption and main queue consumption
- Assuming DLQ messages don't need reliable processing
- Copying consumer setup from main queues without adjusting ack mode
- Not knowing that auto-ack removes messages before processing

### Warning Signs
- DLQ consumer crashes and messages disappear from DLQ
- Failed messages vanish after DLQ consumer reads them (even if processing fails)
- DLQ depth is low but failures are not being addressed
- Missing messages after DLQ consumer restart
- `basic.consume` without `no_ack = false`

### Why Harmful
- The DLQ's purpose is to preserve failed messages for inspection/reprocessing
- Auto-ack removes messages before the consumer processes them
- A crash or exception after delivery loses the message permanently
- No way to reprocess failed messages after DLQ consumer improvement
- The dead-letter pattern becomes a dead-letter-delete pattern

### Consequences
- Failed messages that arrive at DLQ are immediately deleted on consumption
- No reprocessing possible — messages gone forever
- False sense of security: "we have a DLQ, our messages are safe"
- Lost business data from failed transactions
- Compliance issues if retention of failed messages is required

### Alternative
- Use per-message ack on DLQ consumer:
  ```php
  $channel->basic_consume('orders.failed', '', false, false, false, false, $callback);
  // $callback must call basic_ack() only after successful processing
  ```
- Only acknowledge the DLQ message after it's been logged, stored, or reprocessed
- Keep unacknowledged messages in DLQ for inspection

### Refactoring Strategy
1. Change DLQ consumer to use manual ack (`no_ack = false`)
2. Add explicit `basic_ack()` call after successful processing
3. Add explicit `basic_nack()` with `requeue=false` on processing failure
4. Test consumer crash — verify DLQ message remains after restart
5. Add alerting on DLQ consumer processing failures

### Detection Checklist
- [ ] DLQ consumer uses manual ack (not auto-ack)
- [ ] `basic_ack()` called only after successful processing
- [ ] Consumer crash doesn't lose DLQ messages
- [ ] Unprocessed DLQ messages remain in queue on restart
- [ ] `basic_nack()` used for DLQ processing failures

### Related Rules
- route-dead-lettered-to-named-queue

### Related Skills
- Configure RabbitMQ Dead-Letter Queues

### Related Decision Trees
- RabbitMQ DLX vs Application-Level DLQ

---

## 5. Not Setting `x-delivery-limit`

### Category
Reliability

### Description
Not configuring `x-delivery-limit` on RabbitMQ queues (3.8+). Without it, a message that's repeatedly rejected/nack'ed with `requeue=true` cycles through the broker infinitely, or a message that keeps failing is re-delivered forever by default consumer behavior.

### Why It Happens
- Not knowing RabbitMQ 3.8+ supports `x-delivery-limit`
- Default behavior has no delivery limit (infinite)
- Relying only on application-level retry counting
- Queue definitions copied from older RabbitMQ versions
- Assuming retries are bounded at the application level

### Warning Signs
- Messages have very high delivery counts (100+)
- Same message keeps cycling despite repeated failures
- No drop-off in retry attempts for a permanently failing message
- Queue management UI shows delivery count continuously increasing
- No `x-delivery-limit` in queue arguments

### Why Harmful
- Infinite delivery attempts consume broker resources and worker time
- No mechanism to stop retrying a permanently failing message
- Application-level retry count doesn't prevent broker-level re-delivery
- Worker CPU wasted on retries that will never succeed
- Queue throughput consumed by retries, delaying valid messages

### Consequences
- Worker resources wasted on infinite retries
- Valid messages delayed behind infinite-retry poison message
- Higher infrastructure costs from wasted compute
- Logs flooded with same error for the same message
- Manual intervention required to stop the cycle

### Alternative
- Set `x-delivery-limit` on queue declaration:
  ```php
  $channel->queue_declare('orders', false, true, false, false, false, [
      'x-delivery-limit' => ['I', 3],
      'x-dead-letter-exchange' => ['S', 'orders-dlx'],
  ]);
  ```
- Messages exceeding the limit are dead-lettered or dropped
- Match the limit to your application's retry policy

### Refactoring Strategy
1. Identify queues without `x-delivery-limit`
2. Set appropriate limit (3-5 for most use cases)
3. Ensure DLX is configured (messages beyond limit route to DLQ)
4. Test: send poison message, verify delivery count stops at limit
5. Monitor DLQ for messages exceeding delivery limit

### Detection Checklist
- [ ] `x-delivery-limit` set on all production queues
- [ ] Limit matches application retry policy
- [ ] DLX configured for messages exceeding limit
- [ ] No message has delivery count > limit
- [ ] DLQ receives messages that exceeded delivery limit
- [ ] Limit reviewed periodically for workload changes

### Related Rules
- configure-dlx-for-failed-messages

### Related Skills
- Configure RabbitMQ Dead-Letter Queues

### Related Decision Trees
- RabbitMQ DLX vs Application-Level DLQ
