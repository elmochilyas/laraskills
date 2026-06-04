# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** Immutable Casting
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Fresh Instance vs Cached Reference in Cast `get()`
* Decision 2: Defensive Copy vs Shared Mutable Reference for Complex Types
* Decision 3: Immutable Cast vs Mutable Cast for Arrays/Collections

---

# Architecture-Level Decision Trees

---

## Decision 1: Fresh Instance vs Cached Reference in Cast `get()`

---

## Decision Context

Choose whether a custom cast's `get()` method should return a fresh instance on every read or cache and return the same mutable reference.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the cast return a mutable type (array, Collection, object that could be modified)?
↓
YES → Return a fresh instance on every `get()` call (prevents shared mutation)
NO → Does the cast return an immutable type (readonly value object, scalar)?
    YES → Cached reference is safe (immutability prevents mutation)
    NO → Return fresh instance (defensive against unknown mutability)
→ In both cases: is performance profiling showing allocation overhead?
    YES → Consider caching only after profiling confirms it's a bottleneck
    NO → Return fresh instance (default safe behavior)

---

## Rationale

Returning the same mutable reference from `get()` multiple times means a mutation by one consumer affects all other consumers who read the attribute earlier. Fresh instances prevent this at the cost of allocation overhead, which is negligible for typical use.

---

## Recommended Default

**Default:** Return a fresh instance from `get()` for all mutable types. Cached reference only for immutable types or when profiling confirms allocation is a bottleneck.
**Reason:** Defensive against mutation bugs. The allocation cost is negligible for most applications.

---

## Risks Of Wrong Choice

* Cached mutable reference: one consumer's mutation silently affects others, intermittent bugs
* Fresh instance for every read: allocation overhead (negligible in practice for normal use)

---

## Related Rules

* Return new instances from `get()` for mutable types (`05-rules.md`)

---

## Related Skills

* Implement an Immutable Custom Cast (`06-skills.md` Skill 1)

---

## Decision 2: Defensive Copy vs Shared Mutable Reference for Complex Types

---

## Decision Context

Choose whether to return a defensive copy of a complex type (array, object, Collection) or share the same reference from a cast.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the returned value an array or Collection that could be modified by callers?
↓
YES → Return a fresh copy (clone or new instance) on every read
NO → Is the returned value a mutable object with modification methods?
    YES → Return a defensive copy (clone or fresh instance)
    NO → Is the returned value a readonly value object or scalar?
        YES → Shared reference is safe (cannot be mutated)
        NO → Return defensive copy (safe default)

---

## Rationale

Defensive copies prevent consumers from accidentally modifying the model's internal state through a returned reference. The cost is a clone or fresh allocation per read, which is negligible for most use cases.

---

## Recommended Default

**Default:** Return a defensive copy for all mutable complex types. Share references only for immutable types.
**Reason:** Defensive copies prevent the most common class of casting bugs: in-place mutation of shared references.

---

## Risks Of Wrong Choice

* Shared mutable reference: consumer modifies the returned value, model state is corrupted, data integrity violation on next save
* Excess defensive copies: allocation and memory overhead (only significant for thousands of reads per request)

---

## Related Rules

* Clone mutable objects before returning (`05-rules.md`)

---

## Related Skills

* Implement an Immutable Custom Cast (`06-skills.md` Skill 1)

---

## Decision 3: Immutable Cast vs Mutable Cast for Arrays/Collections

---

## Decision Context

Choose whether to implement a custom cast that returns immutable copies or one that returns directly references for array/collection attributes.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the attribute accessed by multiple consumers that should not interfere?
↓
YES → Immutable Cast (fresh instance on every read)
NO → Is performance the highest priority for this attribute?
    YES → Mutable Cast (shared reference, highest performance)
    NO → Immutable Cast (defensive against future refactoring that adds consumers)
→ In both cases: is the attribute a JSON array on a frequently-saved model?
    YES → Consider dirty detection impact; immutable may be safer
    NO → Evaluate based on mutation risk tolerance

---

## Rationale

Immutable casts prevent mutation bugs at the cost of allocation overhead. Mutable casts are faster but risk one consumer's changes silently affecting others. For typical web applications with moderate attribute access, immutable casts are the safer default.

---

## Recommended Default

**Default:** Immutable cast for arrays and collections. Mutable cast only when profiling confirms the allocation overhead is a bottleneck.
**Reason:** Preventing mutation bugs is more valuable than micro-optimizations. Immutability is the safer default.

---

## Risks Of Wrong Choice

* Mutable cast: mutation bugs, data integrity issues, debugging difficulty
* Immutable cast with performance requirements: excessive allocation in hot loops, GC pressure

---

## Related Rules

* Document the immutability contract (`05-rules.md`)
* Test that mutations don't persist (`05-rules.md`)

---

## Related Skills

* Implement an Immutable Custom Cast (`06-skills.md` Skill 1)
