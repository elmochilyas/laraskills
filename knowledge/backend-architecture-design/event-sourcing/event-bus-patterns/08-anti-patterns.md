# ECC Anti-Patterns — Event Bus Patterns

## Domain: Backend Architecture & Design | Subdomain: Event-Driven Architecture

### Anti-Pattern Inventory

1. **Wrong Bus Choice** — Using message broker for in-process-only domain events
2. **No Transactional Guarantee** — Event dispatched after DB commit failure
3. **In-Process for Long Operations** — Blocking listeners that should be queued
4. **Message Broker for Everything** — All events through broker, even same-context ones
5. **No Dead Letter on Broker** — Broker events silently lost on failure
6. **Event Ordering Assumptions** — Assuming broker delivers events in order across partitions

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Wrong Bus Choice

**Category:** Architecture

**Description:** Using message broker (RabbitMQ, Kafka) for events that only have in-process listeners.

**Why It Happens:** "Event bus = message broker" mental model.

**Warning Signs:** Domain events with same-context only listeners sent through broker.

**Why Is It Harmful:** Adds network latency, serialization overhead, and infrastructure complexity for events that never leave the process.

**Preferred Alternative:** In-process bus for domain events. Broker only for cross-context integration events.

**Refactoring Strategy:** Move same-context events to in-process bus. Keep broker for integration events.

**Related Rules:** Use in-process for domain events, broker for integration (05-rules.md)

---

### Anti-Pattern 2: No Transactional Guarantee

**Category:** Reliability

**Description:** Events dispatched after database transaction but before commit.

**Why It Happens:** Events dispatched in same code path as DB writes.

**Warning Signs:** Listeners fire but DB commit fails; events processed for data that doesn't exist.

**Why Is It Harmful:** Listeners operate on phantom data. Side effects (emails, notifications) triggered for failed operations.

**Preferred Alternative:** Use after-commit hooks or outbox pattern.

**Refactoring Strategy:** Register events to dispatch only after transaction commits. Or use outbox pattern.

**Related Rules:** Dispatch events after successful commit (05-rules.md)

---

### Anti-Pattern 3: In-Process for Long Operations

**Category:** Performance

**Description:** Blocking event listeners performing slow operations (API calls, file processing) in-process.

**Why It Happens:** Convenience — listeners registered without considering execution time.

**Warning Signs:** Event dispatch takes seconds; HTTP requests blocked by slow listeners.

**Why Is It Harmful:** Increases response time. Blocks user-facing code for background operations.

**Preferred Alternative:** Queue long-running listener operations.

**Refactoring Strategy:** Make listener `ShouldQueue` or dispatch separate job from listener.

**Related Rules:** Queue slow listeners (05-rules.md)

---

### Anti-Pattern 4: Message Broker for Everything

**Category:** Architecture

**Description:** All events, including simple same-process notifications, routed through message broker.

**Why It Happens:** "Everything should be async" mindset; broker seen as universal event bus.

**Warning Signs:** Same-context events with single listener going through Kafka.

**Why Is It Harmful:** Unnecessary infrastructure cost. Eventual consistency where immediate consistency was fine.

**Preferred Alternative:** Route through in-process bus by default. Use broker only when async or cross-context delivery is required.

**Refactoring Strategy:** Identify events that can be in-process. Move them off broker.

**Related Rules:** Use broker only when needed (05-rules.md)

---

### Anti-Pattern 5: No Dead Letter on Broker

**Category:** Reliability

**Description:** Message broker consumers fail silently without DLQ.

**Why It Happens:** Default consumer configuration doesn't include DLQ.

**Warning Signs:** Events consumed from queue; processing fails; message acknowledged anyway.

**Why Is It Harmful:** Events lost permanently. No retry opportunity.

**Preferred Alternative:** Configure DLQ on all event consumption. Implement retry with max attempts.

**Refactoring Strategy:** Add DLQ configuration. Implement retry logic with dead letter routing.

**Related Rules:** Always configure DLQ for broker consumers (05-rules.md)

---

### Anti-Pattern 6: Event Ordering Assumptions

**Category:** Reliability

**Description:** Assuming events arrive in the same order they were produced.

**Why It Happens:** Developer tests with single partition/queue; deploys to multi-partition.

**Warning Signs:** Race conditions in event processing; state-based events processed out of order.

**Why Is It Harmful:** Incorrect state from out-of-order processing. Hard to debug.

**Preferred Alternative:** Design events to be order-independent or use sequence numbers.

**Refactoring Strategy:** Add sequence numbers to events. Make processors idempotent and order-independent.

**Related Rules:** Don't assume event ordering (05-rules.md)
