# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Event-Driven Architecture
**Knowledge Unit:** Event versioning and schema evolution
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Additive change vs new event version for a schema change
* Decision 2: Upcasting vs in-consumer version handling
* Decision 3: Integration event versioning strategy
* Decision 4: Testing strategy for schema evolution

---

# Architecture-Level Decision Trees

---

## Decision: Additive Change vs New Event Version

---

## Decision Context

Choose whether to make an additive change to an event schema or to create a new version of the event.

---

## Decision Criteria

* performance considerations: additive changes have zero overhead; versioned events add code complexity
* architectural considerations: additive changes preserve backward compatibility; new versions provide clean contracts
* security considerations: new versions allow security review of the full schema; additive changes inherit existing security
* maintainability considerations: additive changes are simpler; multiple versions increase maintenance surface area

---

## Decision Tree

Is the change adding a new field to the event?
↓
YES → Is the new field optional (nullable, has a default value)?
    YES → Additive change (no new version needed)
        ↓
        Do existing consumers ignore unknown fields?
        YES → Additive change is safe (consumers won't break from unrecognized fields)
        NO → Make consumers tolerant of unknown fields first; then additive change
    NO → Is the field semantically required but can default to null?
        YES → Add field as nullable; migrate consumers to handle the null case
        NO → New event version (required field without default is a breaking change)
NO → Is the change modifying an existing field (rename, type change, removal)?
    YES → Is the field still present but renamed (both names valid)?
        YES → Add new field with new name; deprecate old field (additive change via dual fields)
        NO → New event version required (breaking change to existing field)
    ↓
    Is the change purely cosmetic (formatting, naming conventions)?
    YES → Additive change (no semantic impact; consumers shouldn't depend on formatting)
    ↓
    Consider migration complexity:
    NEW VERSION → Need upcaster + new event class + consumer migration window
    ADDITIVE → Zero consumer changes if consumers ignore unknown fields

---

## Rationale

Additive changes (new optional fields) are always preferred because they don't break existing consumers. New event versions should be created only for breaking changes (removing fields, changing types, renaming fields). Most schema changes can be implemented as additive by adding new fields and deprecating old ones.

---

## Recommended Default

**Default:** Always try additive changes first (new optional fields with defaults). Create a new event version only for genuinely breaking changes.

**Reason:** Additive changes have zero consumer impact and zero migration cost. Versioning requires upcasters, dual handler support, and consumer migration windows.

---

## Risks Of Wrong Choice

Versioning for additive changes: unnecessary complexity, multiple event classes, upcaster maintenance. Additive for breaking changes: consumers break silently, null pointer exceptions, data corruption.

---

## Related Rules

- Rule 1: Event schemas are immutable once stored—never modify published events
- Rule 4: Add fields as optional with defaults to maintain backward compatibility

---

## Related Skills

- Implement Event Versioning and Schema Evolution
- Distinguish Between Domain and Integration Events

---

## Decision: Upcasting vs In-Consumer Version Handling

---

## Decision Context

Choose whether to transform old event versions to the current schema on read (upcasting) or handle multiple versions in each consumer.

---

## Decision Criteria

* performance considerations: upcasting adds read-time transformation; in-consumer handling adds per-consumer version logic
* architectural considerations: upcasting centralizes version translation; in-consumer scatters version handling across consumers
* security considerations: upcasters run in a centralized layer — consistent security treatment; in-consumer may miss security checks
* maintainability considerations: upcasting has single maintenance point; in-consumer requires changes in every consumer

---

## Decision Tree

Are there multiple consumers reading the same event stream?
↓
YES → Will new consumers be added over time?
    YES → Upcasting (centralized transformation; new consumers never know about old formats)
    NO → Upcasting still beneficial (single transformation point vs N consumers * 2 versions)
NO → Is there a single consumer of the event stream?
    YES → Can the consumer be easily updated when event format changes?
        YES → In-consumer version handling acceptable
        ↓
        Is the version handling logic simple (one field renamed)?
        YES → In-consumer (simple conditional, no upcaster infrastructure needed)
        NO → Upcasting (complex transformation belongs in a dedicated layer)
    NO → Upcasting (scattered version handling across consumers is a maintenance burden)
    ↓
    Can the upcaster be tested independently?
    YES → Upcasting with test suite (transformation logic is isolated and testable)
    NO → Upcasting with integration tests (test the upcaster against sample old-format events)
    ↓
    Performance consideration: upcasting on every read vs caching
    READS WITH UPCASE → Every aggregate load applies upcasters
    READ-THROUGH CACHE → Cache upcasted aggregates; invalidate on schema change

---

## Rationale

Upcasting centralizes event format transformation in one place — all consumers always see the current schema. In-consumer version handling scatters transformation logic across every consumer, making schema evolution expensive. For any system with more than one consumer, upcasting is the better choice.

---

## Recommended Default

**Default:** Upcasting for all event schema transformations. Register upcasters at the event store level so all consumers see the current format.

**Reason:** Upcasting provides a single place to define and test transformations. Consumers are simpler because they only handle one event format.

---

## Risks Of Wrong Choice

In-consumer version handling: each consumer duplicates transformation logic, missed consumers break on old events, schema migration requires touching N files. Upcasting for destructive changes: upcasters can't recreate data that was removed from the schema.

---

## Related Rules

- Rule 2: Use upcasters to handle old event versions during read/replay
- Rule 1: Event schemas are immutable once stored—never modify published events

---

## Related Skills

- Implement Event Versioning and Schema Evolution
- Design Event Sourcing Components

---

## Decision: Integration Event Versioning Strategy

---

## Decision Context

Choose how to version integration events for cross-context consumption.

---

## Decision Criteria

* performance considerations: versioned events add message overhead (version field); multiple active versions increase processing
* architectural considerations: versioned event names enable independent consumer migration; unversioned events force coordinated deploys
* security considerations: versioned events let security teams review changes per version; old versions may have known vulnerabilities
* maintainability considerations: versioned events require backward compatibility maintenance; unversioned is simpler but riskier

---

## Decision Tree

Is the integration event consumed by external systems (different teams, different deployments)?
↓
YES → Is the consumer migration window predictable and agreed?
    YES → Versioned event names (e.g., OrderPlacedV1, OrderPlacedV2)
        ↓
        Include version in the event name or routing key?
        EVENT NAME: OrderPlacedV2 (explicit, easy to identify)
        ROUTING KEY: order.placed.v2 (flexible, but routing key may be lost on requeue)
        → Recommended: version in event class name + routing key
    NO → Additive changes only (no version bump; unknown versioning would break consumers)
NO → Is the event consumed by internal services with coordinated deployment?
    YES → Can all consumers be updated atomically?
        YES → Version not required in event name (additive changes still preferred)
        NO → Versioned event names still recommended (different deployment cadences)
    ↓
    Deprecation window for old versions:
    INTERNAL → 2-4 weeks (faster migration since teams coordinate more easily)
    EXTERNAL → 3-6 months (external consumers need more time to update)
    ↓
    During migration window:
    - Publish both old and new versions
    - Log consumer version usage (track migration progress)
    - After window expires: stop publishing old version; keep upcaster for event store

---

## Rationale

Versioned integration event names (OrderPlacedV1, OrderPlacedV2) give consumers explicit contracts that they can migrate away from independently. The version should be part of the event name or routing key, not just a field in the payload. A deprecation window allows gradual migration.

---

## Recommended Default

**Default:** Version integration events in the event name (OrderPlacedV1). Refine to OrderPlacedV2 for breaking changes. Publish both versions during migration. 3-month deprecation window for external consumers.

**Reason:** Version in the name makes the event contract explicit and self-documenting. Consumers can safely depend on a known version without fear of unexpected changes.

---

## Risks Of Wrong Choice

No versioning: any schema change breaks all consumers, coordinated deployments required. Version in payload only: event name doesn't indicate version, easy to misroute, consumers may miss the version field.

---

## Related Rules

- Rule 3: Integration events must be backward-compatible and versioned in the event name
- Rule 4: Add fields as optional with defaults to maintain backward compatibility

---

## Related Skills

- Implement Event Versioning and Schema Evolution
- Distinguish Between Domain and Integration Events

---

## Decision: Testing Strategy for Schema Evolution

---

## Decision Context

Choose the approach for verifying that event schema changes don't break consumers.

---

## Decision Criteria

* performance considerations: contract tests add CI pipeline time; integration tests may require consumer deployment
* architectural considerations: contract tests verify producer-consumer compatibility without deploying both
* security considerations: contract tests should cover security-relevant field changes (PII, auth)
* maintainability considerations: automated contract tests catch breakage before deployment; manual testing is unreliable

---

## Decision Tree

Are there external consumers (different teams, different deployments)?
↓
YES → Consumer-driven contract tests (Pact)
    ↓
    Are contracts already established for existing event versions?
    YES → Update contracts with new version; verify all consumers pass
    NO → Create contracts for current version first; then evolve
NO → Are there internal consumers (same org, different services)?
    YES → Can you run integration tests with all consumer services?
        YES → Integration test with consumer test doubles (verify compatibility in CI)
        NO → Internal contract tests (simpler than Pact; use shared schema definitions)
    ↓
    Test scenarios for schema evolution:
    1. Old consumer + new event version → consumer should ignore unknown fields
    2. New consumer + old event version → upcaster should transform correctly
    3. Replay old events → upcaster should produce current format
    ↓
    Automate in CI:
    - On every event schema change: run contract tests against all active consumers
    - On every consumer change: run contract tests against all active event versions

---

## Rationale

Consumer-driven contract tests (Pact) catch breaking schema changes before deployment by verifying that each consumer can handle the new event format. Without automated testing, schema changes are verified only at runtime, when consumers break in production.

---

## Recommended Default

**Default:** Contract tests for all integration events with external consumers. Integration tests with consumer stubs for internal consumers. Run in CI on every schema change.

**Reason:** Contract tests are the only reliable way to detect breaking schema changes before deployment. The test infrastructure is minimal (Pact library) compared to the cost of production breakage.

---

## Risks Of Wrong Choice

No contract tests: production breakage on schema change, emergency rollbacks, trust erosion. Over-testing with full integration: slow CI pipeline, flaky tests from consumer dependencies.

---

## Related Rules

- Rule 5: Test event schema evolution with consumer contract tests
- Rule 1: Event schemas are immutable once stored—never modify published events

---

## Related Skills

- Implement Event Versioning and Schema Evolution
- Implement Event Bus Patterns
