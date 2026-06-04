---
Domain: Async & Distributed Systems
Subdomain: Message Distribution Systems
Knowledge Unit: K038 — Kafka Topics, Partitions, Consumer Groups
Knowledge ID: K038
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Assuming Global Ordering Across Partitions | Architecture | High |
| 2 | Committing Offsets Before Processing | Reliability | Critical |
| 3 | Over-Partitioning Without Enough Consumers | Performance | Medium |
| 4 | Not Monitoring Consumer Lag | Operations | High |
| 5 | Wrong `auto.offset.reset` Strategy | Configuration | Critical |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Global Ordering Assumption | High — unexpected out-of-order delivery across partitions | Document per-partition ordering; use single partition if global order required |
| Pre-Processing Commit | Critical — message loss on consumer crash | Strict commit-after-processing pattern; use auto-commit carefully |
| Consumer Lag Blindness | High — silent backlog growth discovered during incidents | Mandatory lag monitoring with alert thresholds |

---

## 1. Assuming Global Ordering Across Partitions

### Category
Architecture

### Description
Designing systems that expect Kafka messages to be delivered in order across all partitions of a topic. Kafka only guarantees ordering within a single partition — messages across different partitions can arrive in any order. This assumption leads to race conditions and ordering bugs.

### Why It Happens
- Developer is used to queue systems with global FIFO ordering
- Not understanding that Kafka's parallelism comes from partitioning
- Testing with a single partition (works fine) then scaling to multiple partitions
- Assuming messages are ordered by production time across the topic
- Not reading Kafka's ordering guarantees documentation

### Warning Signs
- Messages for the same entity (user, order) processed out of order
- "Impossible" state errors — "how did we get event B before event A?"
- Race conditions that only appear under load (more partitions)
- Different behavior between dev (1 partition) and prod (multiple partitions)
- Consumer logic depends on global message sequence

### Why Harmful
- Business logic breaks when messages arrive out of order
- State machine violations (cancel before ship, refund before charge)
- Data corruption from processing events in wrong sequence
- Bugs only appear in production (more partitions than dev)
- Impossible to fix at consumer level — must re-architect

### Consequences
- Business logic errors from out-of-order processing
- Data integrity violations in event-sourced systems
- Hard-to-reproduce production bugs
- Emergency requirement: reduce to single partition (limit throughput)
- Rewrite consumer logic to handle out-of-order delivery

### Alternative
- Accept per-partition ordering only
- Use message keys (entity ID) to ensure related messages go to the same partition
- If global ordering is required, use a single partition (but limit throughput)
- Design consumers to handle out-of-order delivery (idempotent, state-machine)

### Refactoring Strategy
1. Identify consumers that assume global ordering
2. Add message key (user ID, order ID) to ensure per-entity ordering
3. Or accept out-of-order delivery — make consumers idempotent
4. Add sequence numbers to detect and handle out-of-order delivery
5. Test with multiple partitions to verify ordering assumptions
6. Document ordering guarantees for each topic

### Detection Checklist
- [ ] Message keys used for entity-level ordering
- [ ] No consumer assumes global ordering across partitions
- [ ] Idempotent processing or out-of-order handling in place
- [ ] Tested with multiple partitions
- [ ] Ordering guarantees documented per topic
- [ ] Single-partition topics avoided due to throughput limit

### Related Rules
- use-meaningful-message-keys

### Related Skills
- Configure Kafka Topics, Partitions, and Consumer Groups

### Related Decision Trees
- Kafka Partition Count Strategy

---

## 2. Committing Offsets Before Processing

### Category
Reliability

### Description
Committing Kafka offsets before the message's processing side effects are complete. If the consumer crashes after committing but before completing processing, the message is permanently lost — offset moves past it and never retries.

### Why It Happens
- Default auto-commit behavior (enabled by default in many clients)
- Not understanding that offset commit marks a message as "processed"
- Assuming processing will always complete after commit
- Copy-paste from at-most-once delivery patterns
- Not configuring auto-commit interval or disabling it

### Warning Signs
- Messages lost after consumer crash/restart
- Processing gaps — items in the data store that don't match topic state
- Consumer restarts during processing cause unrecoverable data loss
- Auto-commit enabled with frequent intervals
- Offsets committed to Kafka for messages that aren't fully processed

### Why Harmful
- Crashes between commit and processing completion = permanent message loss
- No retry possible — Kafka offset has moved past the message
- Data store is permanently inconsistent with the event stream
- Silent data loss — no error, no alert, just missing data
- Recovery requires manual offset reset (if detected)

### Consequences
- Unrecoverable data loss from processing failures
- Inconsistent state between event stream and data store
- Manual intervention required to identify and replay missed messages
- No audit trail — lost messages are invisible
- Business logic depends on complete event stream — fails silently

### Alternative
- Always process then commit:
  ```php
  $message = $consumer->receive();
  $this->processMessage($message); // Side effects complete
  $consumer->commit($message);     // Then commit offset
  ```
- Disable auto-commit: `'auto.commit.enable' => false`
- Use manual commit after successful processing
- Implement idempotent processing for at-least-once semantics

### Refactoring Strategy
1. Disable auto-commit in consumer configuration
2. Change commit order: process side effects first, then commit offset
3. Add error handling: if processing fails, do NOT commit (message retried)
4. Test consumer crash during processing — verify message is re-consumed
5. Monitor for at-least-once delivery (some duplicates are better than loss)

### Detection Checklist
- [ ] Auto-commit disabled (manual commit)
- [ ] Offset committed AFTER processing completes
- [ ] No side effects after offset commit
- [ ] Consumer crash during processing → message re-consumed
- [ ] At-least-once delivery confirmed (no message loss on crash)
- [ ] Idempotency in place for at-least-once duplicates

### Related Rules
- commit-offsets-after-processing

### Related Skills
- Configure Kafka Topics, Partitions, and Consumer Groups

### Related Decision Trees
- Kafka Partition Count Strategy

---

## 3. Over-Partitioning Without Enough Consumers

### Category
Performance

### Description
Creating a Kafka topic with many partitions (50+) but running only a few consumers in the consumer group. Most partitions are idle with no consumer assigned, wasting partition overhead and providing no throughput benefit.

### Why It Happens
- "More partitions = better parallelism" without planning consumer count
- Partition count set for future scaling but consumers never added
- Copying partition counts from high-throughput systems without matching consumers
- Assuming Kafka handles idle partitions without cost (each partition is a file/filesystem overhead)
- Over-allocating to avoid partition count increases (which require topic recreation)

### Warning Signs
- Many partitions show 0 lag (no consumer assigned)
- Consumer group rebalancing involves many partitions
- Filesystem has many small partition files
- Broker reports high partition count but low throughput
- Consumer group metrics show few active partition assignments

### Why Harmful
- Each partition adds filesystem metadata overhead
- Rebalancing takes longer with more partitions (even idle ones)
- Wasted broker memory for partition metadata
- No throughput benefit from unassigned partitions
- Management overhead (monitoring, alerting for unused partitions)

### Consequences
- Higher broker resource usage for no throughput gain
- Longer consumer rebalancing times (more partitions to reassign)
- Increased ZooKeeper/controller metadata overhead
- Harder to manage topic configuration changes
- Wasted infrastructure costs

### Alternative
- Set partition count = max expected consumer count × 2
- Scale partitions proportionally with consumer group size
- Start with 3-6 partitions, increase as consumer count grows
- Monitor partition assignment — if many partitions are idle, reduce consumers

### Refactoring Strategy
1. Measure current consumer count vs partition count
2. If consumers << partitions: add consumers or create new topic with fewer partitions
3. Plan partition count for future: `future_max_consumers × 2`
4. Remember: partition count can only be increased, not decreased
5. Document partition-to-consumer ratio for the team

### Detection Checklist
- [ ] Partition count ≤ max expected consumers × 2
- [ ] Most partitions are assigned to consumers (few idle)
- [ ] No partition with 0 lag that is assigned (if assigned but 0 lag, consumer is keeping up)
- [ ] Rebalancing time is acceptable (under 30s for the partition count)
- [ ] Partition count documented with rationale
- [ ] Consumer scaling plan aligned with partition count

### Related Rules
- set-partition-count-for-max-parallelism

### Related Skills
- Configure Kafka Topics, Partitions, and Consumer Groups

### Related Decision Trees
- Kafka Partition Count Strategy

---

## 4. Not Monitoring Consumer Lag

### Category
Operations

### Description
Running Kafka consumers without monitoring consumer lag — the gap between the latest message offset and the consumer's current offset. Lag grows when consumers can't keep up with production, silently causing processing delays.

### Why It Happens
- No monitoring infrastructure for Kafka metrics
- Assuming consumers always keep up with production
- Not knowing consumer lag is the primary Kafka health metric
- Only monitoring broker-level metrics (not consumer-level)
- Reactive approach — only notice lag when users complain about delays

### Warning Signs
- Processing delays discovered through user complaints
- Consumer group status shows growing lag on inspection
- No alerting for consumer lag thresholds
- Kafka metrics dashboard doesn't include consumer lag
- Lag is only noticed during incident investigations

### Why Harmful
- Consumer lag is the primary indicator of processing capacity shortfall
- Growing lag means messages are processed later and later
- At some point, lag may exceed retention period — messages are lost
- No visibility into whether consumers are keeping up
- Capacity planning is impossible without lag metrics

### Consequences
- Increasing processing delays — users see stale data
- Message loss if lag exceeds retention period
- Emergency scaling of consumers without data
- Incident every time production rate exceeds consumption rate
- Inability to plan infrastructure for demand growth

### Alternative
- Monitor consumer lag for every consumer group:
  ```bash
  # Using kafka-consumer-groups tool
  kafka-consumer-groups --bootstrap-server localhost:9092 \
    --group my-group --describe
  ```
- Set up automated monitoring (Burrow, Kafka Lag Exporter, Prometheus)
- Alert when lag exceeds threshold (e.g., 1000 messages or 5 minutes of production)
- Track lag trends for capacity planning

### Refactoring Strategy
1. Set up consumer lag monitoring (Prometheus exporter or managed service)
2. Establish baseline lag for normal operation
3. Set alert thresholds: warning at lag > 1000, critical at lag > 10000
4. Add lag dashboard to team monitoring
5. Create runbook for growing lag (add consumers, optimize processing)
6. Review lag trends weekly for capacity planning

### Detection Checklist
- [ ] Consumer lag monitored for every consumer group
- [ ] Alert threshold configured for abnormal lag
- [ ] Baseline lag established for normal operation
- [ ] Lag dashboard visible to team
- [ ] Runbook for lag spikes documented
- [ ] Weekly lag review for capacity planning
- [ ] No lag growth trend over time

### Related Rules
- monitor-consumer-lag

### Related Skills
- Configure Kafka Topics, Partitions, and Consumer Groups

### Related Decision Trees
- Kafka Partition Count Strategy

---

## 5. Wrong `auto.offset.reset` Strategy

### Category
Configuration

### Description
Setting `auto.offset.reset` to the wrong value for the use case. Using `latest` when a consumer needs to replay historical data causes data loss (skips all past messages). Using `earliest` when a consumer should only see new messages causes reprocessing of all historical data.

### Why It Happens
- Not knowing the config exists (default is `latest`)
- Copying config from another project without understanding the context
- Not considering the consumer's purpose (new vs replay)
- Assuming "reset" always means "start from beginning"
- Not testing offset reset behavior before deployment

### Warning Signs
- New consumer group starts processing from latest — misses historical messages
- Consumer restart causes reprocessing of all past messages
- Consumer sees no messages after deployment (started from latest, topic is old)
- Consumer takes hours to catch up (started from earliest, huge backlog)
- Surprise: "where did all my historical data go?"

### Why Harmful
- `latest`: new consumers miss all historical data permanently
- `earliest`: new consumers reprocess entire topic, causing duplicate side effects
- The wrong choice causes either data loss or processing overload
- Offset reset config is evaluated only when no committed offset exists (new group or expired offsets)
- Recovery requires manual offset manipulation or topic reconstruction

### Consequences
- Data loss from `latest` skip (historical messages never processed)
- Processing pipeline overload from `earliest` replay
- Duplicate side effects from reprocessing (emails, API calls)
- Emergency manual offset reset required
- Hours of reprocessing time for large topics

### Alternative
- Set `auto.offset.reset` intentionally for each consumer group:
  - `earliest`: replay consumers, new consumers that must process historical data
  - `latest`: consumers that should only see messages from now on
- Test offset reset in staging before production
- Document the choice for each consumer group

### Refactoring Strategy
1. Identify each consumer group's purpose (replay vs streaming)
2. Set `auto.offset.reset` accordingly in consumer config
3. For replay consumers: set `earliest` and be ready for reprocessing load
4. For streaming consumers: set `latest`
5. Test consumer group start with correct offset behavior
6. Add consumer group documentation with offset strategy

### Detection Checklist
- [ ] `auto.offset.reset` explicitly set (not default)
- [ ] Value matches consumer group purpose
- [ ] Replay consumers set to `earliest`
- [ ] Streaming consumers set to `latest`
- [ ] Offset behavior tested in staging
- [ ] Consumer group documentation includes offset strategy
- [ ] Monitoring confirms expected offset behavior on new consumer start

### Related Rules
- set-auto-offset-reset-intentionally

### Related Skills
- Configure Kafka Topics, Partitions, and Consumer Groups

### Related Decision Trees
- Kafka Partition Count Strategy
