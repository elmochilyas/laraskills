# ECC Anti-Patterns — Dead Letter Handling

## Domain: Backend Architecture & Design | Subdomain: Event-Driven Architecture

### Anti-Pattern Inventory

1. **No Dead Letter Queue** — Failed events silently dropped, corrupting read models
2. **Infinite Retry Loop** — Events retried forever without circuit breaker or max attempts
3. **DLQ Without Monitoring** — Dead letters accumulate without alerts
4. **Manual Only Recovery** — No automated retry; all DLQ events require human intervention
5. **DLQ as Black Hole** — Events moved to DLQ but never investigated or replayed
6. **No Projection Rebuild** — Cannot recover from dead letter accumulation by rebuilding projections

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: No Dead Letter Queue

**Category:** Reliability

**Description:** Failed events silently dropped with no DLQ mechanism.

**Why It Happens:** Event processing assumed to always succeed; no failure handling designed.

**Warning Signs:** No error handling in event listeners; exceptions logged but events lost.

**Why Is It Harmful:** Read model silently diverges from event history. Data corruption undetected until user reports it.

**Preferred Alternative:** Implement dead letter queue for all event processing failures.

**Refactoring Strategy:** Add retry logic with DLQ after max retries. Store failed events with context.

**Related Rules:** Never silently drop failed events (05-rules.md)

---

### Anti-Pattern 2: Infinite Retry Loop

**Category:** Reliability

**Description:** Events retried indefinitely without circuit breaker or max attempts.

**Why It Happens:** "Retry forever" configured thinking it ensures eventual delivery.

**Warning Signs:** Event processing retrying for days; system resources consumed by retries.

**Why Is It Harmful:** Resource exhaustion. Downstream system hammered with retries. No path to resolution.

**Preferred Alternative:** Configure max retries with exponential backoff. Move to DLQ after threshold.

**Refactoring Strategy:** Add retry count limit. Configure circuit breaker for persistent failures.

**Related Rules:** Limit retries, move to DLQ (05-rules.md)

---

### Anti-Pattern 3: DLQ Without Monitoring

**Category:** Operations

**Description:** Dead letter queue implemented but no alerts when events accumulate.

**Why It Happens:** DLQ added as feature; monitoring considered separate concern.

**Warning Signs:** DLQ grows silently; team discovers stale data weeks later.

**Why Is It Harmful:** Read models corrupt for extended period. Business impact from stale data.

**Preferred Alternative:** Alert on DLQ depth, age of oldest event, and growth rate.

**Refactoring Strategy:** Add DLQ monitoring. Set up alerts for threshold breaches.

**Related Rules:** Monitor dead letter queues (05-rules.md)

---

### Anti-Pattern 4: Manual Only Recovery

**Category:** Operations

**Description:** All DLQ events require manual investigation and replay.

**Why It Happens:** "Human must review" policy applied to all failures uniformly.

**Warning Signs:** DLQ backlog grows because team can't keep up with manual review.

**Why Is It Harmful:** Slow recovery. Backlogged DLQ leads to prolonged data inconsistency.

**Preferred Alternative:** Automate retry for transient failures. Reserve manual review for persistent schema/validation errors.

**Refactoring Strategy:** Categorize failures: transient (auto-retry) vs persistent (manual review).

**Related Rules:** Automate retry for transient failures (05-rules.md)

---

### Anti-Pattern 5: DLQ as Black Hole

**Category:** Operations

**Description:** Events moved to DLQ but never investigated or replayed.

**Why It Happens:** Team too busy; DLQ cleanup deprioritized.

**Warning Signs:** DLQ with thousands of events that nobody reviews; "we'll get to it" mentality.

**Why Is It Harmful:** Lost business events. Read model permanently diverged. Business decisions based on incomplete data.

**Preferred Alternative:** Regular DLQ review as part of operational routine.

**Refactoring Strategy:** Schedule weekly DLQ review. Implement DLQ replay tooling. Set DLQ age limit (auto-discard or escalate).

**Related Rules:** Review and process DLQ regularly (05-rules.md)

---

### Anti-Pattern 6: No Projection Rebuild

**Category:** Recovery

**Description:** Cannot rebuild projections from event stream when read model is corrupted.

**Why It Happens:** Events stored but no rebuild mechanism implemented.

**Warning Signs:** DLQ overflowed; read model is wrong; only fix is manual database updates.

**Why Is It Harmful:** Cannot recover from large-scale read model corruption. Manual fixes are error-prone.

**Preferred Alternative:** Implement projection rebuild capability — replay all events from start.

**Refactoring Strategy:** Add rebuild command that re-runs all projections from event store. Test regularly.

**Related Rules:** Support projection rebuild from event history (05-rules.md)
