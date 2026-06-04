# ECC Anti-Patterns — Event Versioning & Schema Evolution

## Domain: Backend Architecture & Design | Subdomain: Event-Driven Architecture

### Anti-Pattern Inventory

1. **Breaking Changes** — Removing or renaming fields without versioning
2. **No Backward Compatibility** — New event format breaks existing consumers
3. **Upcaster Neglect** — Schema changed without upcasters for old events
4. **Schema Registry Avoidance** — No central schema registry for multi-consumer systems
5. **Event Class Deletion** — Old event classes deleted, breaking replay
6. **Over-Versioning** — New version for every minor change, version explosion

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Breaking Changes

**Category:** Evolution

**Description:** Removing or renaming event fields without versioning.

**Why It Happens:** Developer unaware of existing consumers or stored events.

**Warning Signs:** Consumers crash on new event format; replay fails on old events.

**Why Is It Harmful:** Production incidents. Event replay broken. Lost trust in event system.

**Preferred Alternative:** Additive changes only (new optional fields). Version events for breaking changes.

**Refactoring Strategy:** Revert breaking change. Re-introduce with versioned event class.

**Related Rules:** Never make breaking changes to events (05-rules.md)

---

### Anti-Pattern 2: No Backward Compatibility

**Category:** Evolution

**Description:** New event version not backward compatible with consumers.

**Why It Happens:** All consumers assumed to be updated simultaneously.

**Warning Signs:** Consumers must deploy at same time as producer; rollback impossible.

**Why Is It Harmful:** Coordinated deployments. High-risk event schema changes.

**Preferred Alternative:** Design for backward compatibility. Support multiple versions during migration.

**Refactoring Strategy:** Add compatibility layer. Use expand-contract migration pattern.

**Related Rules:** Maintain backward compatibility (05-rules.md)

---

### Anti-Pattern 3: Upcaster Neglect

**Category:** Evolution

**Description:** Schema changed without implementing upcasters for old event formats.

**Why It Happens:** Developer tests with current events only.

**Warning Signs:** Rebuilding from event store fails; old events can't be deserialized.

**Why Is It Harmful:** Event store loses its value — cannot replay history. Event sourcing contract broken.

**Preferred Alternative:** Write upcaster before deploying schema change.

**Refactoring Strategy:** Write missing upcasters. Test replay from beginning.

**Related Rules:** Upcast before deploying schema changes (05-rules.md)

---

### Anti-Pattern 4: Schema Registry Avoidance

**Category:** Governance

**Description:** No central schema registry; consumers rely on implicit event format.

**Why It Happens:** Small team, few consumers — "we know the format."

**Warning Signs:** Consumer format assumptions break; no automated schema validation.

**Why Is It Harmful:** Silent breakage. Manual debugging of schema mismatches.

**Preferred Alternative:** Use schema registry (confluent, JSON Schema, Avro) for event validation.

**Refactoring Strategy:** Adopt schema registry. Validate events against schema on produce and consume.

**Related Rules:** Use schema registry for event validation (05-rules.md)

---

### Anti-Pattern 5: Event Class Deletion

**Category:** Evolution

**Description:** Old event classes deleted after schema migration.

**Why It Happens:** "Old code" cleanup mentality; developer doesn't consider replay.

**Warning Signs:** Replay fails with "class not found"; old events can't be deserialized.

**Why Is It Harmful:** Historical events become unreadable. Full event sourcing benefit lost.

**Preferred Alternative:** Keep all event classes indefinitely. Use namespace/version in class names.

**Refactoring Strategy:** Restore deleted event classes. Implement versioned namespaces.

**Related Rules:** Never delete old event classes (05-rules.md)

---

### Anti-Pattern 6: Over-Versioning

**Category:** Governance

**Description:** New version for every minor field addition, causing version explosion.

**Why It Happens:** "Every change needs new version" policy applied too strictly.

**Warning Signs:** OrderPlacedV1 through OrderPlacedV12; most versions differ by one optional field.

**Why Is It Harmful:** Class proliferation. Version matrix complexity. Consumer confusion.

**Preferred Alternative:** Use additive (optional) fields within version. Version only when breaking changes occur.

**Refactoring Strategy:** Merge similar versions. Use optional fields for additions within version.

**Related Rules:** Version only for breaking changes (05-rules.md)
