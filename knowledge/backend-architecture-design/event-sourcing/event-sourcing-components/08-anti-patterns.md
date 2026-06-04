# ECC Anti-Patterns — Event Sourcing Components

## Domain: Backend Architecture & Design | Subdomain: Event-Driven Architecture

### Anti-Pattern Inventory

1. **Event Store as Audit Log Only** — Full event sourcing but events only used for audit, not state
2. **Aggregate Too Large** — Single aggregate handling too many business operations
3. **Snapshot Neglect** — No snapshots, aggregate rebuild takes too long
4. **Projection Divergence** — Projections out of sync with event store
5. **No Upcasters** — Old event formats break on read
6. **Event Store Coupling** — Business logic directly depending on event store implementation

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Event Store as Audit Log Only

**Category:** Architecture

**Description:** Using event sourcing but never rebuilding state from events — events only for audit.

**Why It Happens:** Team adopts event sourcing for "audit trail" without understanding its core value.

**Warning Signs:** Current state stored separately; events never used to rebuild aggregates.

**Why Is It Harmful:** Full complexity of event sourcing (append-only, projections, upcasting) without the benefit of state reconstruction.

**Preferred Alternative:** Either commit to event sourcing (state from events) or use simpler audit logging.

**Refactoring Strategy:** Remove event sourcing if state is never rebuilt from events. Replace with simple audit table.

**Related Rules:** State must be derivable from events (05-rules.md)

---

### Anti-Pattern 2: Aggregate Too Large

**Category:** Architecture

**Description:** Single aggregate handling all operations for large domain concept.

**Why It Happens:** "Order aggregate" grows to handle all order-related operations.

**Warning Signs:** Aggregate with 20+ events; replay takes too long.

**Why Is It Harmful:** Single aggregate becomes bottleneck. Command concurrency limited. Rebuild time grows.

**Preferred Alternative:** Split large aggregate into smaller, focused aggregates.

**Refactoring Strategy:** Identify sub-concepts within large aggregate. Extract as separate aggregates.

**Related Rules:** Keep aggregates focused and small (05-rules.md)

---

### Anti-Pattern 3: Snapshot Neglect

**Category:** Performance

**Description:** No snapshots configured. Aggregate replay from beginning of time.

**Why It Happens:** Works in development with few events; fails in production with millions.

**Warning Signs:** Aggregate rebuild takes seconds/minutes; command latency increases over time.

**Why Is It Harmful:** Eventual performance collapse. As event count grows, operations become slower.

**Preferred Alternative:** Implement snapshots at regular intervals (every N events).

**Refactoring Strategy:** Add snapshot mechanism. Configure snapshot frequency based on aggregate event count.

**Related Rules:** Snapshot aggregates regularly (05-rules.md)

---

### Anti-Pattern 4: Projection Divergence

**Category:** Reliability

**Description:** Projections containing data that differs from event store truth.

**Why It Happens:** Projection logic has bugs; projections modified directly; events replayed without projection reset.

**Warning Signs:** Read model shows data that doesn't match event replay; manual DB edits.

**Why Is It Harmful:** Read model not trustworthy. Benefits of event sourcing lost.

**Preferred Alternative:** Projections are derived solely from events. Never modify projections directly.

**Refactoring Strategy:** Fix projection logic. Rebuild projections from events. Add divergence detection.

**Related Rules:** Projections derived only from events (05-rules.md)

---

### Anti-Pattern 5: No Upcasters

**Category:** Evolution

**Description:** Event schema changed without upcasters. Old events fail to deserialize.

**Why It Happens:** Schema changed during development; production events already stored.

**Warning Signs:** Event replay fails on old events; "class not found" for old event classes.

**Why Is It Harmful:** Cannot rebuild state from history. Event sourcing contract broken.

**Preferred Alternative:** Implement upcasters for all event schema changes.

**Refactoring Strategy:** Write upcasters for each schema version. Never delete old event classes.

**Related Rules:** Upcast all old events on schema change (05-rules.md)

---

### Anti-Pattern 6: Event Store Coupling

**Category:** Architecture

**Description:** Business logic directly depending on event store implementation.

**Why It Happens:** Event store chosen early; code written to its specific API.

**Warning Signs:** Repository implementations directly call EventStoreDB/Kurrent client.

**Why Is It Harmful:** Cannot swap event store. Vendor lock-in. Testing requires full event store setup.

**Preferred Alternative:** Abstract event store behind repository interface.

**Refactoring Strategy:** Define event store interface in domain. Implement with chosen technology in infrastructure.

**Related Rules:** Abstract event store behind interface (05-rules.md)
