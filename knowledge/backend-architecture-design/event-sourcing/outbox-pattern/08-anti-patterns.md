# ECC Anti-Patterns — Outbox Pattern

## Domain: Backend Architecture & Design | Subdomain: Event-Driven Architecture

### Anti-Pattern Inventory

1. **No Outbox** — Dual-write problem: DB update + event publish not atomic
2. **Outbox Without Idempotency** — At-least-once delivery without consumer idempotency
3. **Polling Too Slow** — Outbox poller interval too long, events delayed
4. **No Outbox Cleanup** — Outbox table grows unbounded
5. **Transactional Outbox Without Transaction** — Outbox write not in same DB transaction
6. **Outbox as Only Event Mechanism** — Using outbox for all events, even in-process ones

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: No Outbox

**Category:** Reliability

**Description:** Publishing events without outbox — DB write and event publish not in same transaction.

**Why It Happens:** Event dispatched immediately after DB write; failure path not considered.

**Warning Signs:** Events published but DB write fails; DB write succeeds but event delivery fails.

**Why Is It Harmful:** Data inconsistency. Phantom events or lost events. Undetected until data reconciliation.

**Preferred Alternative:** Implement outbox pattern: write event to DB in same transaction as business data.

**Refactoring Strategy:** Add outbox table. Move event writing into business transaction. Add publisher process.

**Related Rules:** Use outbox for reliable event publishing (05-rules.md)

---

### Anti-Pattern 2: Outbox Without Idempotency

**Category:** Reliability

**Description:** At-least-once delivery from outbox without idempotent consumers.

**Why It Happens:** Outbox implemented but consumer idempotency considered separate.

**Warning Signs:** Duplicate events processed; side effects (email, charge) executed multiple times.

**Why Is It Harmful:** Duplicate charges, duplicate notifications. Hard to debug because duplicates are intermittent.

**Preferred Alternative:** Make event consumers idempotent using unique event IDs.

**Refactoring Strategy:** Add event ID to all events. Implement deduplication in consumers.

**Related Rules:** Idempotent consumers for outbox events (05-rules.md)

---

### Anti-Pattern 3: Polling Too Slow

**Category:** Performance

**Description:** Outbox poller runs infrequently (every minute) causing event delivery delay.

**Why It Happens:** Default poll interval used without considering latency requirements.

**Warning Signs:** Events delivered minutes late; integration events delayed.

**Why Is It Harmful:** Slow event delivery. SLAs missed. Users see stale data.

**Preferred Alternative:** Increase poll frequency or use DB notifications (LISTEN/NOTIFY).

**Refactoring Strategy:** Reduce poll interval. Consider PostgreSQL LISTEN/NOTIFY for near-real-time delivery.

**Related Rules:** Match poll frequency to latency requirements (05-rules.md)

---

### Anti-Pattern 4: No Outbox Cleanup

**Category:** Operations

**Description:** Outbox table grows without bound as processed events accumulate.

**Why It Happens:** No cleanup mechanism implemented.

**Warning Signs:** Outbox table millions of rows; queries slowing down; storage filling.

**Why Is It Harmful:** Performance degradation. Storage costs. Long query times.

**Preferred Alternative:** Archive or delete processed outbox events after successful delivery.

**Refactoring Strategy:** Add cleanup job that deletes processed events older than retention period.

**Related Rules:** Clean up processed outbox events (05-rules.md)

---

### Anti-Pattern 5: Transactional Outbox Without Transaction

**Category:** Reliability

**Description:** Outbox record written outside the business data transaction.

**Why It Happens:** Developer adds outbox write after the DB transaction.

**Warning Signs:** Business DB write succeeds, outbox write fails — event lost.

**Why Is It Harmful:** Defeats the purpose of outbox pattern. Events still lost on partial failure.

**Preferred Alternative:** Outbox write in same DB transaction as business data.

**Refactoring Strategy:** Move outbox insert into the business transaction scope.

**Related Rules:** Outbox write must be in same transaction (05-rules.md)

---

### Anti-Pattern 6: Outbox as Only Event Mechanism

**Category:** Architecture

**Description:** Using outbox for all events, including simple in-process domain events.

**Why It Happens:** "One mechanism for all events" simplicity.

**Warning Signs:** Simple domain events going through DB outbox and poller when in-process suffices.

**Why Is It Harmful:** Adds latency and infrastructure for events that don't need it. DB load from polling.

**Preferred Alternative:** Use outbox only for integration events. Use in-process event bus for domain events.

**Refactoring Strategy:** Move same-context events to in-process bus. Reserve outbox for cross-context events.

**Related Rules:** Use outbox only for cross-context events (05-rules.md)
