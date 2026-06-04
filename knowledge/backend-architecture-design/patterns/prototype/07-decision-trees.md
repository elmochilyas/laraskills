# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Prototype pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Clone vs constructor (new instance)
* Decision 2: Shallow clone vs deep clone
* Decision 3: Prototype registry vs ad-hoc cloning

---

# Architecture-Level Decision Trees

---

## Decision: Clone vs Constructor (New Instance)

---

## Decision Context

Choose between cloning an existing object (`clone`) and constructing a new instance (`new`) for creating object copies.

---

## Decision Criteria

* performance considerations: clone is ~50-100ns vs constructor + initialization (reflection, DB queries, etc.)
* architectural considerations: clone preserves runtime state; constructor creates from scratch
* security considerations: clone may copy sensitive state from prototype; constructor starts clean
* maintainability considerations: clone requires `__clone()` implementation for proper deep copy; constructor uses normal init

---

## Decision Tree

Is object construction expensive (DB query, API call, file parsing, reflection)?
↓
YES → Clone (avoid repeating expensive initialization)
    ↓
    Example: cloning a cached configuration object, a parsed document tree, or a hydrated entity
    ↓
    Does the prototype have mutable state that should NOT be shared?
    YES → Deep clone (implement `__clone()` to deep-copy mutable properties)
        ↓
        Clone + `__clone()` → cost of deep clone is proportional to object graph size
        Still cheaper than constructor if initialization hits I/O
        NO → Shallow clone is safe (mutable state is intentionally shared or all properties are immutable)
    NO → Does the object need slight variations from a base template?
        YES → Clone + modify (clone a base template, then adjust specific properties)
            ↓
            Example: newsletter template → clone for each campaign with different subject/body
            ↓
            Does each clone need different state for most properties?
            YES → Constructor with named arguments (Builder pattern may be better)
                ↓
            Clone is efficient when most state is shared, few properties differ
            NO → Direct constructor (`new`) — simplest option
NO → Is the object a Value Object (immutable, compared by value)?
    YES → Constructor or named constructor (value objects are typically created, not cloned)
    ↓
    Value objects should be constructed with their value, not cloned from another VO
    NO → Constructor (no benefit from cloning for cheap construction)

---

## Rationale

Clone is a performance optimization — use it when construction is measurably expensive and you need many similar objects. For cheap construction (most DTOs, value objects), `new` is simpler and clearer. Clone shines for prototypes with expensive initialization (hydrated entities, parsed configurations, compiled templates).

---

## Recommended Default

**Default:** Constructor (`new`) for most objects. Clone only when constructor is measurably expensive (I/O, reflection) and you need multiple similar instances.
**Reason:** `new` is simpler, clearer, and always correct. Clone adds `__clone()` maintenance and deep-copy correctness concerns.

---

## Risks Of Wrong Choice

Clone without `__clone()`: shared mutable state causes unpredictable mutations. Constructor where clone would be faster: repeated expensive initialization in hot paths. Clone for cheap objects: no benefit, adds maintenance cost of `__clone()`.

---

## Related Rules

- Rule 1: Use clone only when constructor is measurably expensive
- Rule 2: Always implement `__clone()` for objects with mutable reference properties

---

## Related Skills

- Implement `__clone()`
- Identify Clone Opportunities
- Use Prototype for Expensive Objects

---

## Decision: Shallow Clone vs Deep Clone

---

## Decision Context

Choose whether `clone` should create a shallow copy (references shared) or a deep copy (all referenced objects recursively cloned).

---

## Decision Criteria

* performance considerations: shallow clone is ~50-100ns; deep clone cost scales with object graph size
* architectural considerations: shallow clone risks unintended shared state; deep clone ensures isolation
* security considerations: shallow clone may expose prototype's internal objects to mutation via clone
* maintainability considerations: deep clone requires maintaining `__clone()` as the object graph evolves

---

## Decision Tree

Does the object contain mutable object references (not primitives, not value objects)?
↓
YES → Consider deep clone (shallow clone shares mutable references — unintended side effects)
    ↓
    Check each property:
    → Is it a Value Object (immutable, compared by value)? → Shallow copy is safe
    → Is it an Entity with identity? → Clone decision depends on intent
    → Is it a Collection/array of objects? → Deep clone needed or the clone shares the same collection
    ↓
    Does the cloned object need to mutate these references independently?
    YES → Deep clone (each clone gets its own copy of referenced objects)
        ↓
        `function __clone() { $this->items = array_map(fn($i) => clone $i, $this->items); $this->config = clone $this->config; }`
        ↓
        Is the recursive graph deep or circular?
        YES → Consider serialization/deserialization approach or iterative deep clone
            ↓
            `$deepClone = unserialize(serialize($object));` — works but has edge cases (closures, resources)
            Consider a dedicated deep clone library or service
            NO → Manual `__clone()` implementation for finite depth
        NO → Shallow clone (shared references are acceptable — read-only or intentionally shared)
    NO → Are the references read-only after construction (shared but never mutated)?
        YES → Shallow clone is safe (clone reads shared state but never writes)
        ↓
        Example: clone of a configuration object where referenced config arrays are read-only
        NO → Shallow clone (no mutable references — all primitives, immutables, or shared read-only)
NO → Shallow clone (all properties are primitives, strings, or immutable objects)
    ↓
    PHP `clone` performs shallow copy by default
    No `__clone()` implementation needed
    ↓
    Does the object have array properties containing objects?
    YES → Arrays contain object references — cloned object's array points to same objects
        ↓
        If those objects are mutated → unintended side effects
        Consider deep clone for array properties
        NO → Shallow clone is completely safe

---

## Rationale

Shallow clone is the default and covers 80% of cases. Deep clone is needed when cloned objects must operate independently. The key insight: if your object has mutable references that the clone will modify, deep clone is required. Value objects (immutable) are safe to share.

---

## Recommended Default

**Default:** Shallow clone for objects with only primitive/immutable properties or read-only shared references. Deep clone when the clone will independently modify referenced mutable objects.
**Reason:** Deep clone has ongoing maintenance costs — only pay it when isolation is required.

---

## Risks Of Wrong Choice

Shallow clone when deep needed: modifying a reference in the clone unexpectedly modifies the original. Deep clone always: performance overhead and `__clone()` maintenance for objects that don't need it. Serialize/unserialize deep clone: fails on closures, resources, and some internal objects.

---

## Related Rules

- Rule 3: Deep clone mutable references in `__clone()` only if clones need independent state
- Rule 4: Value objects and read-only shared state are safe for shallow cloning

---

## Related Skills

- Implement Shallow Clone
- Implement Deep Clone in `__clone()`
- Use Serialization for Deep Clone

---

## Decision: Prototype Registry vs Ad-Hoc Cloning

---

## Decision Context

Choose between maintaining a central registry of prototype objects (cloned on demand) and creating clones ad-hoc from locally available instances.

---

## Decision Criteria

* performance considerations: registry lookup is O(1); ad-hoc requires constructing or accessing a prototype each time
* architectural considerations: registry centralizes prototype management; ad-hoc distributes prototypes across callers
* security considerations: registry is a single point to audit prototypes; ad-hoc prototypes may come from untrusted sources
* maintainability considerations: registry provides a single place to register/manage prototypes; ad-hoc is simpler but duplicates

---

## Decision Tree

Are the same prototypes used across multiple, unrelated parts of the application?
↓
YES → Prototype Registry (central registration, consistent access)
    ↓
    Registry class holds an array of prototype instances keyed by identifier
    ↓
    Example: `$registry->get('newsletter.default')->clone()->withSubject('Sale!')`
    ↓
    Does the registry need to support runtime registration of new prototypes?
    YES → Dynamic registry (`register()`, `unregister()` methods)
        ↓
        Useful for plugin systems, package integrations, dynamic configuration
        Example: plugins register their email templates in the registry on boot
        NO → Static registry (prototypes defined at configuration time)
            ↓
        Prototypes are defined in service provider or configuration
        Example: `EmailTemplateRegistry` populated from config file
    NO → Does the prototype vary per request context?
        YES → Registry with contextual resolution (factory creates prototype per context)
            ↓
            Registry stores factory closures, not instances
            Each `get()` resolves a fresh prototype from the factory
            NO → Ad-hoc cloning (caller has a prototype instance, clones it locally)
                ↓
                Simpler: caller holds a reference and calls `$prototype->clone()`
                Example: repository cached a hydrated entity, clones it for each consumer
                NO → Direct construction (`new`) — clone not needed

---

## Rationale

Prototype Registry is valuable when the same prototype templates are shared across the application — it prevents each caller from needing its own prototype instance. Ad-hoc cloning is simpler when each caller already has access to a prototype (e.g., from a repository or factory result). Start ad-hoc, extract registry when you see prototype management duplicated across the codebase.

---

## Recommended Default

**Default:** Ad-hoc cloning from locally available prototype instances. Prototype Registry only when the same prototypes are consumed by multiple independent callers across the application.
**Reason:** Registry adds indirection and maintenance overhead. Ad-hoc cloning is simpler when each caller already has prototype access.

---

## Risks Of Wrong Choice

No registry with shared prototypes: each caller reconstructs or stores its own prototype — duplication, inconsistency. Registry for single-caller use: unnecessary abstraction layer. Registry with mutable prototypes: `get()` returns the same instance, not a clone — callers mutate the shared prototype.

---

## Related Rules

- Rule 5: Registry should always `clone` before returning — never return the prototype itself
- Rule 6: Extract registry only when prototypes are shared across 3+ independent callers

---

## Related Skills

- Implement Prototype Registry
- Implement Ad-Hoc Clone
- Design Prototype Registry with Factories
