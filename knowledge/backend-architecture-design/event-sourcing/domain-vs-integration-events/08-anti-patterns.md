# ECC Anti-Patterns — Domain vs Integration Events

## Domain: Backend Architecture & Design | Subdomain: Event-Driven Architecture

### Anti-Pattern Inventory

1. **Mixing Event Types** — Domain events published as integration events across contexts
2. **Integration Events Too Detailed** — Exposing internal domain details through integration events
3. **Domain Events Across Buses** — Domain events dispatched through external message broker
4. **Integration Events Domains** — Integration event schema mirroring domain model
5. **No Versioning on Integration Events** — Schema changes break downstream consumers
6. **Event Proliferation** — Too many event types, hard to understand system behavior

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Mixing Event Types

**Category:** Architecture

**Description:** Publishing internal domain events as integration events to other contexts.

**Why It Happens:** Convenience — same event dispatched for both internal and external consumption.

**Warning Signs:** Single event class listened to by both same-context and cross-context handlers.

**Why Is It Harmful:** Internal event structure exposed to external consumers. Cannot change domain event schema without breaking external integrations.

**Preferred Alternative:** Separate domain events (internal) from integration events (external).

**Refactoring Strategy:** Create integration events as separate classes. Translate domain events to integration events at context boundary.

**Related Rules:** Separate domain events from integration events (05-rules.md)

---

### Anti-Pattern 2: Integration Events Too Detailed

**Category:** Architecture

**Description:** Integration events exposing internal domain details not needed by consumers.

**Why It Happens:** "Send everything, let consumer decide" approach.

**Warning Signs:** Integration events with 20+ fields, most unused by any consumer.

**Why Is It Harmful:** Consumers coupled to internal details. Cannot change internal structure without breaking downstream. Schema evolution hard.

**Preferred Alternative:** Design integration events for consumer needs. Include minimum necessary data.

**Refactoring Strategy:** Remove unused fields from integration events. Add fields only when consumer explicitly needs them.

**Related Rules:** Design integration events for consumers, not database (05-rules.md)

---

### Anti-Pattern 3: Domain Events Across Buses

**Category:** Architecture

**Description:** Domain events dispatched through external message broker (RabbitMQ, Kafka) instead of in-process bus.

**Why It Happens:** "Event-driven architecture = message broker" assumption.

**Warning Signs:** Domain events serialized, sent through broker, consumed by same-context handlers.

**Why Is It Harmful:** Adds network latency and serialization overhead for events that never leave the context. Loses transactional guarantee.

**Preferred Alternative:** Domain events use in-process bus. Integration events use message broker.

**Refactoring Strategy:** Move domain events to in-process dispatch. Keep only cross-context events on broker.

**Related Rules:** Domain events are in-process, integration events are cross-process (05-rules.md)

---

### Anti-Pattern 4: Integration Events Domain Coupling

**Category:** Architecture

**Description:** Integration event schema mirrors internal domain model structure.

**Why It Happens:** Automatic serialization of domain objects to integration events.

**Warning Signs:** Integration event fields match database columns exactly.

**Why Is It Harmful:** Schema coupling — database changes require integration event version changes.

**Preferred Alternative:** Integration events have consumer-optimized schema, independent of domain model.

**Refactoring Strategy:** Design integration events independent of domain model. Translate at boundary.

**Related Rules:** Keep integration event schema independent (05-rules.md)

---

### Anti-Pattern 5: No Versioning on Integration Events

**Category:** Evolution

**Description:** Integration events not versioned. Schema changes break consumers.

**Why It Happens:** Single-team projects; "we'll know all consumers" assumption.

**Warning Signs:** Integration event field renamed without consumer notification; consumers crash.

**Why Is It Harmful:** Breaking changes cause production incidents. Consumers cannot evolve independently.

**Preferred Alternative:** Version integration events. Support multiple versions during migration.

**Refactoring Strategy:** Add version field to integration events. Implement expand-contract migration pattern.

**Related Rules:** Version all integration events (05-rules.md)

---

### Anti-Pattern 6: Event Proliferation

**Category:** Maintainability

**Description:** Too many unique event types making system behavior hard to understand.

**Why It Happens:** Every state change gets its own event type.

**Warning Signs:** 100+ event types; developers can't find relevant events.

**Why Is It Harmful:** Navigation nightmare. Hard to understand system behavior from events alone.

**Preferred Alternative:** Group related state changes into fewer, semantically meaningful events.

**Refactoring Strategy:** Merge similar events. Use event payload to distinguish sub-types.

**Related Rules:** Keep event types manageable (05-rules.md)
