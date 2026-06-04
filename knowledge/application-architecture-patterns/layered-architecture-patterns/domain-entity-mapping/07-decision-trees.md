# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** Mapping between domain entities and Eloquent models
**Generated:** 2026-06-03

---

# Decision Inventory

* Explicit mapper class vs inline mapping in Repository
* Bidirectional testing strategy for mappers
* Handling mapping of deep object graphs (aggregates with relationships)

---

# Architecture-Level Decision Trees

---

## Explicit Mapper Class vs Inline Mapping in Repository

---

## Decision Context

Mapping between domain entities and Eloquent models can happen in a dedicated mapper class or inline within the repository implementation. The choice affects testability, reusability, and separation of concerns.

---

## Decision Criteria

* performance considerations — no significant difference
* architectural considerations — explicit mapper separates concerns; inline is simpler
* security considerations — mapper can control field exposure
* maintainability considerations — explicit mapper is independently testable; inline is more compact

---

## Decision Tree

Mapping organization?
↓
Multiple repositories need the same mapping logic?
YES → Explicit mapper class — reusable across repositories
NO → Is mapping complex (computed fields, nested objects, type conversions)?
    YES → Explicit mapper class — testable in isolation
    NO → Is the mapping bidirectional with roundtrip concerns?
        YES → Explicit mapper class — easier to test roundtrip
        NO → Inline in repository — simpler for straightforward mapping

---

## Rationale

Explicit mapper classes provide independent testability and reusability across repositories. Inline mapping is acceptable when the mapping is simple (field-to-field copy) and only used in one repository. Complex mapping with computed fields, nested objects, or conditional logic benefits from dedicated mappers.

---

## Recommended Default

**Default:** Explicit mapper class in Infrastructure layer for each aggregate root
**Reason:** Mappers with roundtrip tests prevent mapping bugs. Explicit mappers are testable in isolation and reusable across repositories. The file overhead is justified by the safety benefit.

---

## Risks Of Wrong Choice

Inline mapping without tests is fragile — a missed field or wrong conversion causes data corruption. Explicit mappers for trivial field-to-field mapping add ceremony without value.

---

## Related Rules

- Rule: Maintain Mappers in Infrastructure Layer (LAP-10/05-rules.md)
- Rule: Write Bidirectional Mapper Tests (LAP-10/05-rules.md)

---

## Related Skills

- Map Domain Entities to Eloquent Models (LAP-10/06-skills.md)
- Apply Infrastructure Layer Adapters (LAP-07/06-skills.md)

---

## Bidirectional Testing Strategy for Mappers

---

## Decision Context

Mappers convert in both directions: domain → Eloquent (write) and Eloquent → domain (read). Roundtrip testing verifies that converting domain→Eloquent→domain produces the same object. Asymmetric mapping causes data corruption.

---

## Decision Criteria

* performance considerations — roundtrip tests add test execution time
* architectural considerations — roundtrip tests verify data integrity
* security considerations — roundtrip failures can cause silent data corruption
* maintainability considerations — roundtrip tests must be maintained alongside mapper changes

---

## Decision Tree

Mapper testing approach?
↓
Does the mapper convert in both directions?
YES → Write roundtrip tests: domain → Eloquent → domain must be equal
NO → Mapping is one-directional (read-only or write-only)?
    YES → Test each direction independently with assertions
    NO → Test the single direction with expected output assertions

---

## Rationale

Roundtrip testing is the only reliable way to verify bidirectional mapping correctness. A mapper that converts domain entity to Eloquent model and back should produce an identical domain entity. Differences in timezone handling, floating point precision, or null value representation cause silent corruption.

---

## Recommended Default

**Default:** Write roundtrip tests for all bidirectional mappers
**Reason:** Roundtrip tests catch asymmetry bugs (timezone, precision, null handling) that unidirectional tests miss. They verify that the mapping preserves the domain entity's state through the persistence cycle.

---

## Risks Of Wrong Choice

Missing roundtrip tests allows asymmetric mapping bugs into production — data reads back different from what was written. Over-testing roundtrip for trivial mappings adds test maintenance without benefit.

---

## Related Rules

- Rule: Write Bidirectional Mapper Tests (LAP-10/05-rules.md)
- Rule: Avoid Partial Mapping (LAP-10/05-rules.md)

---

## Related Skills

- Map Domain Entities to Eloquent Models (LAP-10/06-skills.md)
- Apply Infrastructure Layer Adapters (LAP-07/06-skills.md)

---

## Handling Mapping of Deep Object Graphs (Aggregates with Relationships)

---

## Decision Context

Mapping aggregates with nested relationships (Order → LineItems → Product) creates cascading mapper dependencies and performance concerns. Lazy loading during mapping causes N+1 problems.

---

## Decision Criteria

* performance considerations — eager loading required before mapping; mapping deep graphs allocates many objects
* architectural considerations — aggregate mapping boundaries must respect transactional consistency
* security considerations — no direct security impact
* maintainability considerations — deep graph mapping is complex and fragile

---

## Decision Tree

Object graph depth?
↓
Aggregate has nested relationships (Order with LineItems)?
YES → Eager load ALL relationships before mapping
    ↓
    Does the aggregate cross aggregate root boundaries?
        YES → Split — map each aggregate root separately; reference by ID
        NO → Map the full aggregate in one mapper — use DTO as intermediate
NO → Single entity with no relationships — simple mapper

---

## Rationale

Deep object graph mapping must eagerly load all relationships before mapping begins to prevent N+1 queries. Aggregates crossing aggregate root boundaries should be split — each aggregate root maps separately, with other aggregates referenced by ID.

---

## Recommended Default

**Default:** Eager load all relationships before mapping; split mappers per aggregate root
**Reason:** Lazy loading during mapping creates N+1 performance issues. Each aggregate root should have its own mapper; child aggregates within the same root can be mapped inline.

---

## Risks Of Wrong Choice

Lazy loading during mapping causes N+1 queries that are hard to detect. Single giant mappers crossing aggregate boundaries create complex dependencies.

---

## Related Rules

- Rule: Use Eager Loading Explicitly Before Mapping (LAP-10/05-rules.md)
- Rule: Avoid Partial Mapping (LAP-10/05-rules.md)

---

## Related Skills

- Map Domain Entities to Eloquent Models (LAP-10/06-skills.md)
- Design Repository Contracts (SLP-15/06-skills.md)
