# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Event-Driven Architecture
**Knowledge Unit:** Domain events vs integration events distinction
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Domain event vs integration event classification
* Decision 2: Separate event classes vs shared class for domain and integration
* Decision 3: Translation strategy from domain to integration events
* Decision 4: Integration event schema evolution and versioning approach

---

# Architecture-Level Decision Trees

---

## Decision: Domain Event vs Integration Event Classification

---

## Decision Context

Determine whether an event should be classified as a domain event (internal to a bounded context) or an integration event (for cross-context communication).

---

## Decision Criteria

* performance considerations: integration events add serialization and network overhead; domain events are in-process
* architectural considerations: domain events model internal state changes; integration events are external contracts
* security considerations: integration events cross context boundaries — sensitive data may be exposed
* maintainability considerations: misclassified events create coupling between contexts or over-engineering

---

## Decision Tree

Is the event consumed only within its own bounded context?
↓
YES → Is the event produced by an aggregate as a result of a command?
    YES → Domain event (record state change for internal projections, side effects)
    NO → Could the event be expressed as a direct method call instead of an event?
        YES → Consider simplifying (event may not be needed at all)
        NO → Domain event (internal notification within the context)
NO → Is the event consumed by a different bounded context or service?
    YES → Integration event (cross-context communication)
        ↓
        Is the integration event's schema the same as the domain event's?
        YES → Still separate — create integration event class (decouple schemas)
        NO → Integration event with its own schema (translated from domain)
    NO → Is the event stored in the event store as part of event sourcing?
        YES → Domain event (event store is part of the producing context)
    ↓
    Does the event carry enough context for an external consumer?
    YES → Is the event too detailed (exposes internal aggregate structure)?
        YES → Create integration event with coarser granularity
        NO → Integration event is appropriate as-is
    NO → Enrich or combine multiple domain events into a single integration event

---

## Rationale

Domain events belong to their producing context and can evolve freely. Integration events are contracts with external consumers and must be stable. The key distinction is the consumer boundary: if an event is consumed outside its producing context, it's an integration event and needs its own versioned schema.

---

## Recommended Default

**Default:** Every event that crosses a bounded context boundary gets a dedicated integration event class, even if it mirrors the domain event structure initially.

**Reason:** Starting with separate classes avoids the painful migration from shared to separate schemas later. Translation logic can be added incrementally.

---

## Risks Of Wrong Choice

Domain event used as integration event: external consumers coupled to internal schema changes, versioning conflicts. Integration event for internal use: unnecessary serialization overhead, message broker dependency for local logic.

---

## Related Rules

- Rule 1: Domain events are recorded as part of the aggregate's state; integration events are published for external consumption
- Rule 2: Integration events must be versioned independently from domain events

---

## Related Skills

- Distinguish Between Domain and Integration Events
- Define Context Mapping Relationships

---

## Decision: Separate Event Classes vs Shared Class

---

## Decision Context

Choose whether to use the same event class for both domain and integration purposes or to maintain separate classes.

---

## Decision Criteria

* performance considerations: separate classes add translation overhead; shared class has zero mapping cost
* architectural considerations: separate classes decouple schemas; shared class creates coupling
* security considerations: shared class may expose internal fields that should not cross context boundaries
* maintainability considerations: separate classes add maintenance burden but prevent consumer breakage from domain changes

---

## Decision Tree

Is the system a monolith with a single deployment unit (not microservices)?
↓
YES → Are the consumers in the same codebase and deployable together?
    YES → Can all consumers be updated atomically when the event schema changes?
        YES → Shared class acceptable (coordinated deployment is possible)
        NO → Separate classes (consumers may be on different release cycles)
    NO → Separate classes (different deployment cadences mean incompatible windows)
NO → Are the consumers in different bounded contexts managed by different teams?
    YES → Separate classes mandatory (different teams, different release cycles)
    NO → Are the consumers internal to the same context but async (queued)?
        YES → Shared class for now, but split if the schema diverges
        NO → Shared class acceptable (same team, same deployment)
    ↓
    Does the integration event need fields that the domain event doesn't have?
    YES → Separate classes (integration event has routing info, metadata, version)
    NO → Could this change in the future?
        YES → Separate classes (future-proof; cheaper to start separate than to split later)
        NO → Shared class (simple systems where extra classes are overhead)

---

## Rationale

Shared event classes create coupling between internal domain logic and external contracts. Separate classes allow the domain event to evolve freely while the integration event remains stable. The cost of maintaining a separate integration class is small compared to the cost of decoupling later.

---

## Recommended Default

**Default:** Separate classes for domain and integration events, even when the schemas are identical initially.

**Reason:** The cost of maintaining a separate class is negligible. The cost of splitting a shared class after consumers depend on it involves versioning, migration, and coordination.

---

## Risks Of Wrong Choice

Shared class: domain schema changes break integration consumers, versioning conflicts. Separate classes without automation: manual translation is error-prone and easily forgotten.

---

## Related Rules

- Rule 1: Domain events are recorded as part of the aggregate's state; integration events are published for external consumption
- Rule 2: Integration events must be versioned independently from domain events

---

## Related Skills

- Distinguish Between Domain and Integration Events
- Implement Event Versioning and Schema Evolution

---

## Decision: Translation Strategy From Domain to Integration Events

---

## Decision Context

Choose how to transform domain events into integration events for external publication.

---

## Decision Criteria

* performance considerations: translation adds per-event processing overhead; batch translation reduces cost
* architectural considerations: translation layer decouples domain from infrastructure; direct publishing couples them
* security considerations: translation can strip sensitive fields before cross-context publication
* maintainability considerations: dedicated translators are easier to test and evolve than scattered mapping logic

---

## Decision Tree

Does the integration event need the same data as the domain event?
↓
YES → Can the domain event class be referenced from the integration layer (infrastructure)?
    YES → Simple mapping: extract relevant fields in a projector/publisher class
    NO → Full translation: build integration event from domain event data
NO → Does the integration event need transformed or aggregated data?
    YES → Does the integration combine multiple domain events?
        YES → Aggregation translator (collects domain events, emits single integration event when criteria met)
        NO → Field-level transformation (rename fields, convert types, compute derived values)
    NO → Identity mapping (same data, different class)
    ↓
    Where should the translation live?
    In the projector (listens to domain events, publishes integration events)
    In a dedicated translator service (called by the application layer)
    ↓
    Is there an anti-corruption layer at the context boundary?
    YES → Integrate translation with ACL (ACL handles both directions)
    NO → Separate publisher/translator (cleaner separation of concerns)
    ↓
    Are multiple contexts consuming the same integration event?
    YES → Standardize integration schema via Published Language
    NO → Context-specific integration event per consumer

---

## Rationale

Translation should happen in the infrastructure layer, not in the domain. A dedicated projector/publisher listens to domain events and emits integration events. This keeps the domain clean of integration concerns and allows the integration schema to evolve independently.

---

## Recommended Default

**Default:** A dedicated integration publisher class that listens to domain events and translates them into integration event objects.

**Reason:** This approach is simple, testable, and keeps translation logic in one place. It follows the domain → application → infrastructure dependency rule.

---

## Risks Of Wrong Choice

Translation in domain layer: domain depends on integration concerns, violates dependency rule. Direct domain event publishing: integration consumers see internal schema, versioning conflicts. No translation at all: raw domain events exposed across contexts.

---

## Related Rules

- Rule 3: Translate domain events to integration events in a projector or publisher
- Rule 4: Integration events must be backward-compatible; use extended fields for additions

---

## Related Skills

- Distinguish Between Domain and Integration Events
- Implement an Anti-Corruption Layer
- Implement Event Bus Patterns

---

## Decision: Integration Event Schema Evolution and Versioning Approach

---

## Decision Context

Choose how to version and evolve integration event schemas over time without breaking consumers.

---

## Decision Criteria

* performance considerations: supporting multiple event versions adds code complexity; single-version is simpler
* architectural considerations: backward-compatible changes avoid coordinated deployments; breaking changes require versioning
* security considerations: old event versions may have weaker field validation — security audits must cover all versions
* maintainability considerations: additive changes minimize maintenance; breaking changes increase surface area

---

## Decision Tree

Is the change purely additive (adding a new optional field)?
↓
YES → Is the new field nullable or has a sensible default?
    YES → Additive change only (no version bump needed; existing consumers ignore unknown fields)
    NO → Make the field nullable or provide a default (never make new fields required)
NO → Is the change breaking (removing fields, changing types, renaming)?
    YES → Create new integration event version (e.g., OrderPlacedV2 extends OrderPlacedV1)
        ↓
        Are there active consumers on the old version?
        YES → Both versions coexist for a migration window
            ↓
            Can consumers migrate independently (no coordinated deployment)?
            YES → Set deprecation window (e.g., 3 months) and notify consumers
            NO → Schedule migration with all consumer teams; use feature flags
        NO → Remove old version, deploy new version (no migration needed)
    NO → Is the change deprecating a field?
        YES → Keep field in schema with @deprecated annotation; remove after all consumers migrated
    ↓
    Is the integration event stored in an event store (event sourcing)?
    YES → Add upcaster for old versions on read (consumers always see latest schema)
    NO → Is the event published to a broker with multiple consumers?
        YES → Publish both versions during migration window; consumers choose
        NO → Publish new version only (single consumer, update atomically)

---

## Rationale

Additive changes (new optional fields) do not require version bumps if consumers ignore unknown fields (which they should). Breaking changes require new event versions and a migration window. The migration window should be long enough for all consumers to update independently.

---

## Recommended Default

**Default:** Additive changes only (no version bump). For breaking changes, create a new event version and set a 3-month deprecation window for the old version.

**Reason:** Additive changes are the safest evolution strategy — zero consumer impact. Breaking changes are rare but require explicit versioning and migration planning.

---

## Risks Of Wrong Choice

No versioning: consumers break on any schema change. Breaking changes without migration window: forced coordinated deployments, production incidents. Deprecation window too short: consumers can't migrate in time.

---

## Related Rules

- Rule 2: Use upcasters to handle old event versions during read/replay
- Rule 3: Integration events must be backward-compatible and versioned in the event name
- Rule 4: Add fields as optional with defaults to maintain backward compatibility
- Rule 5: Test event schema evolution with consumer contract tests

---

## Related Skills

- Implement Event Versioning and Schema Evolution
- Distinguish Between Domain and Integration Events
- Implement Event Bus Patterns
