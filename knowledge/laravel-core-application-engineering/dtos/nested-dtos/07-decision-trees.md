# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** Nested DTOs
**Generated:** 2026-06-03

---

# Decision Inventory

* Eager Construction vs Lazy/Proxy for Nested DTOs
* Full Nesting vs Flattening Strategy
* Factory Chaining vs Caller-Side Construction

---

# Architecture-Level Decision Trees

---

## Decision 1: Eager Construction vs Lazy/Proxy for Nested DTOs

---

## Decision Context

Whether all child DTOs in a nested tree should be constructed eagerly when the parent is built, or lazily via proxies/lazy loading.

---

## Decision Criteria

* Whether the DTO tree is immutable (readonly)
* Whether some child data is expensive to compute and rarely accessed
* Whether all children are accessed in normal usage patterns
* Whether the project uses spatie/laravel-data with `#[Lazy]` properties

---

## Decision Tree

Is the DTO tree declared with readonly classes?
↓
YES → Eager construction required — readonly prevents post-construction assignment of children
NO → Are some child data expensive to compute (API calls, heavy computations) AND rarely accessed?
    YES → Consider lazy loading via spatie `#[Lazy]` or a proxy pattern — but prefer eager for readonly
    NO → Eager construction — simpler, predictable, no lazy loading surprises
NO → Is the DTO tree used in all code paths that access the parent?
    YES → Eager construction — children are always needed anyway
    NO → Is the lazy child data a deep relation only needed in detail views?
        YES → Consider separate DTOs for list vs detail views instead of lazy loading
        NO → Eager construction is still recommended for readonly systems
NO → Does spatie/laravel-data `#[Lazy]` apply?
    YES → Lazy is available — use sparingly for genuinely expensive rarely-accessed properties
    NO → Eager construction is the default and recommended approach

---

## Rationale

Eager construction ensures a fully immutable tree with no lazy loading surprises. Lazy breaks readonly semantics (properties must be settable after construction) and adds complexity. In readonly DTO systems — which should be the default for Laravel — eager construction is the only valid option. Lazy loading is only viable with non-readonly DTOs or spatie's `#[Lazy]` attribute.

---

## Recommended Default

**Default:** Eager construction for all nested DTOs in readonly systems; lazy only for genuinely expensive rarely-accessed properties via spatie `#[Lazy]`
**Reason:** Eager construction produces a predictable immutable tree. Lazy loading adds complexity and breaks readonly guarantees.

---

## Risks Of Wrong Choice

* Lazy in readonly system: Cannot assign children after parent construction — runtime error
* Eager for expensive rarely-accessed data: Wasted construction cost for unused child data
* Lazy without readonly: Unpredictable N+1 style issues in service layer

---

## Related Rules

* Construct Nested DTOs Bottom-Up (05-rules.md)
* Prevent Circular References — Use Scalar IDs Instead of Parent Objects (05-rules.md)
* Eager-Load All Eloquent Relations Before Passing Models to Nested Factories (05-rules.md)

---

## Related Skills

* Skill: Construct and Serialize Nested DTO Trees

---

## Decision 2: Full Nesting vs Flattening Strategy

---

## Decision Context

Whether to use full nested DTO structures or flatten child properties into the parent DTO.

---

## Decision Criteria

* Whether the consumer (API client, service) needs the full nested structure
* Nesting depth (target: 3-4 levels max)
* Whether the same entity is represented differently in list vs detail views
* Whether serialization performance matters for large collections

---

## Decision Tree

How deep is the nesting?
↓
1-2 levels → Full nesting is fine — manageable depth, clear structure
3-4 levels → Evaluate: does the consumer need ALL levels for this view?
    YES (detail view, full representation) → Full nesting appropriate
    NO (list view, summary) → Flatten child properties into parent for simpler output
5+ levels → Flatten or split required — deep nesting is always wrong
NO → Is this a list view or a detail view?
    List → Flatten child properties into parent — consumers need summary data
    Detail → Full nesting acceptable — consumers need hierarchical structure
NO → Is serialization performance critical (1000+ items)?
    YES → Flatten — nested serialization is O(total nodes), flattened is O(items)
    NO → Full nesting is acceptable

---

## Rationale

Deeply nested DTOs reduce readability, increase construction complexity, and slow serialization. List views should flatten child data into parent properties. Detail views benefit from natural nesting. Using separate DTOs for list vs detail views (both at appropriate nesting levels) is the recommended pattern.

---

## Recommended Default

**Default:** Flatten for list views (2 levels max); full nesting for detail views (3-4 levels max); separate DTOs per view
**Reason:** List consumers need summary data, not full hierarchies. Detail consumers need the full structure. Separate DTOs match each use case exactly.

---

## Risks Of Wrong Choice

* Deep nesting (5+ levels): Serialization overhead, complex factories, hard-to-navigate output
* Full nesting in list view: Over-fetching data, consumers must navigate unnecessary depth
* Flattening detail view: Losing meaningful hierarchy, bloat in the parent DTO

---

## Related Rules

* Limit DTO Nesting Depth to a Maximum of 3-4 Levels (05-rules.md)
* Use Nullable Child DTOs for Optional Relationships (05-rules.md)

---

## Related Skills

* Skill: Construct and Serialize Nested DTO Trees

---

## Decision 3: Factory Chaining vs Caller-Side Construction

---

## Decision Context

Whether each DTO level owns its construction by delegating to child factories, or the caller manually constructs child DTOs and passes them to the parent.

---

## Decision Criteria

* Whether the DTO library (spatie/laravel-data) handles nesting automatically
* Number of consumers that construct the DTO tree
* Whether construction logic differs per consumer
* Whether each DTO level has transformation logic

---

## Decision Tree

Does the DTO tree use spatie/laravel-data with `DataCollection`?
↓
YES → Factory chaining is automatic — the package handles nested construction via `#[DataCollectionOf]`
NO → Does the parent DTO have a `fromArray()` factory method?
    YES → Implement factory chaining: parent factory calls child `fromArray()` internally
        Are there multiple consumers of this DTO tree?
            YES → Factory chaining required — centralizes construction logic, prevents duplication
            NO → Factory chaining still recommended — single construction path is consistent
    NO → Does the parent DTO delegate child construction to the caller?
        YES → Caller-side construction — each call manually maps child data:
            Is the DTO consumed by a single caller?
                YES → Acceptable for single-use, but factory chaining is still cleaner
                NO → Multiple callers duplicate mapping logic — switch to factory chaining
    NO → Always use factory chaining — each DTO level owns its own construction

---

## Rationale

Factory chaining ensures that each level of the DTO tree encapsulates its own construction logic. The parent calls `ChildDto::fromArray()` without knowing how children are constructed. This centralizes construction at each level, making the tree easy to modify (change a child, update only that child's factory) and easy to test (test each level's factory independently). Caller-side construction duplicates mapping logic across every consumer.

---

## Recommended Default

**Default:** Always use factory chaining — each DTO's `fromArray()` delegates to child `fromArray()` methods
**Reason:** Factory chaining centralizes construction at each level, prevents duplication across consumers, and makes the tree independently testable.

---

## Risks Of Wrong Choice

* Caller-side construction: Duplicate mapping logic across every consumer, inconsistent null handling
* Missing factory on parent: No single entry point for construction, callers must know the tree structure
* Factory on child but not parent: Parent exposes raw child data instead of typed DTOs

---

## Related Rules

* Use Factory Chaining — Each DTO Level Owns Its Own Construction (05-rules.md)
* Construct Nested DTOs Bottom-Up (05-rules.md)

---

## Related Skills

* Skill: Construct and Serialize Nested DTO Trees

