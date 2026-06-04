# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Data Mapper pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Data Mapper vs Active Record selection
* Decision 2: Mapper granularity — entity-specific vs generic mapping
* Decision 3: Mapping approach — auto-mapping vs manual mapping

---

# Architecture-Level Decision Trees

---

## Decision: Data Mapper vs Active Record Selection

---

## Decision Context

Choose between Data Mapper (persistence-ignorant domain objects) and Active Record (self-persisting models).

---

## Decision Criteria

* performance considerations: Data Mapper adds hydration and mapping overhead; Active Record is zero-cost
* architectural considerations: Data Mapper separates domain from persistence; Active Record couples them
* security considerations: Data Mapper can filter fields during mapping; Active Record exposes all model data
* maintainability considerations: Data Mapper requires mapping layer maintenance; Active Record is simpler

---

## Decision Tree

Does the domain need to be completely persistence-ignorant (zero knowledge of DB or ORM)?
↓
YES → Data Mapper (domain objects are plain PHP with no persistence awareness)
    ↓
    Does the team have the infrastructure budget (mappers, repositories, identity map, UoW)?
    YES → Full Data Mapper with Doctrine or custom implementation
    ↓
    Budget includes: mapper classes or auto-mapping, identity map, Unit of Work
    NO → Data Mapper is high-cost — consider if persistence ignorance is worth the investment
    NO → Is the domain model complex with deep inheritance or polymorphic associations?
        YES → Data Mapper handles these well; Active Record struggles
        ↓
        Are rich domain behaviors (state machines, rules engine) central to the application?
        YES → Data Mapper (Active Record's coupling would contaminate domain logic)
        NO → Active Record (simpler persistence for moderate domain complexity)
    NO → Simple domain: Active Record is almost always the right choice
↓
Is the team experienced with Data Mapper patterns (Doctrine, Hibernate)?
YES → Data Mapper is feasible (learning curve is significant)
NO → Active Record is significantly easier to adopt

---

## Rationale

Data Mapper provides complete separation between domain and persistence at significant infrastructure cost. Active Record (Eloquent) is simpler and faster to develop. The decision hinges on whether the domain layer must be persistence-ignorant and whether the team can sustain the mapping infrastructure. For most Laravel apps, Active Record is the pragmatic choice.

---

## Recommended Default

**Default:** Active Record (Eloquent). Data Mapper only for complex domains with deep inheritance, polymorphic associations, or strict persistence ignorance requirements.

**Reason:** Active Record is simpler, faster to develop, and matches Eloquent's native pattern. Data Mapper adds significant complexity (mapping, identity map, UoW) that is rarely justified.

---

## Risks Of Wrong Choice

Data Mapper for simple CRUD: massive over-engineering, mapping overhead with no benefit. Active Record for complex domain: SRP violation, domain logic entangled with persistence, testing difficulty. Mixing both patterns: inconsistent persistence approach.

---

## Related Rules

- Rule 1: Data Mapper provides complete persistence ignorance at the cost of mapping infrastructure
- Rule 3: Active Record is the default for Laravel; use Data Mapper only when the domain demands it

---

## Related Skills

- Implement Data Mapper
- Use Doctrine ORM with Laravel
- Choose Active Record vs Data Mapper

---

## Decision: Mapper Granularity — Entity-Specific vs Generic Mapping

---

## Decision Context

Choose whether to create a mapper per entity or use a generic/reflective mapper for all entities.

---

## Decision Criteria

* performance considerations: reflective mappers add introspection overhead; entity-specific mappers are optimized
* architectural considerations: entity-specific mappers are explicit; generic mappers are DRY
* security considerations: entity-specific mappers control per-entity field access; generic mappers have uniform rules
* maintainability considerations: entity-specific mappers create more files; generic mappers are harder to customize

---

## Decision Tree

Do entities have different mapping rules (different fields, relations, hydration logic)?
↓
YES → Entity-specific mappers (each entity has its own mapping logic)
    ↓
    Is the mapping complex (joins, embedded values, inheritance)?
    YES → Entity-specific mapper handles each entity's unique mapping
    ↓
    Create `UserMapper`, `OrderMapper`, etc. each with entity-specific `hydrate()` and `dehydrate()`
    NO → Entity-specific but simple: difference is just field list, not mapping logic
    ↓
    Can a base mapper handle most entities, with specific overrides for exceptions?
    YES → Base mapper with entity-specific overrides (best of both)
    NO → All entities have identical mapping structure
        YES → Generic/reflective mapper (one mapper for all entities)
        ↓
        Use attributes or configuration to define field-to-column mapping
        Generic mapper reads attributes, hydrates entities, dehydrates to arrays
        ↓
        Is the reflective overhead acceptable?
        YES → Generic mapper (DRY, less code)
        NO → Base mapper with entity-specific field list (typed, optimized)

---

## Rationale

Entity-specific mappers provide per-entity control at the cost of more mapper classes. Generic/reflective mappers reduce duplication but are harder to customize for edge cases. The right approach is a base mapper that handles common mapping with entity-specific overrides for unique cases.

---

## Recommended Default

**Default:** Base mapper with entity-specific field configuration. Entity-specific mappers only for entities with truly unique mapping logic.

**Reason:** A base mapper eliminates duplication while allowing per-entity customization. Full entity-specific mappers create unnecessary file count for entities with standard mapping.

---

## Risks Of Wrong Choice

Entity-specific for every entity: massive file count, duplicated mapping patterns. Generic reflective mapper with edge cases: fighting against the generic approach for every exception. Mixing generic and specific inconsistently: developers don't know where to add mapping logic.

---

## Related Rules

- Rule 4: Use a base mapper with entity-specific field configuration — not one mapper per entity

---

## Related Skills

- Design Entity Mappers
- Implement Reflective Mapper

---

## Decision: Mapping Approach — Auto-Mapping vs Manual Mapping

---

## Decision Context

Choose how to map between domain objects and database rows — automatic (reflection/attributes) or manual (explicit hydrator methods).

---

## Decision Criteria

* performance considerations: auto-mapping (reflection) is slower; manual mapping is fastest
* architectural considerations: auto-mapping is declarative; manual mapping is imperative and testable
* security considerations: auto-mapping may accidentally expose or set unintended fields
* maintainability considerations: auto-mapping is less code; manual mapping is explicit and debuggable

---

## Decision Tree

How many entities need mapping?
↓
FEW (<10 entities) → Manual mapping is viable (10 mapper files, each small)
MANY (10+ entities) → Auto-mapping saves significant code
    ↓
    Is performance critical (1000+ hydrations per request)?
    YES → Manual mapping (auto-mapping reflection overhead may be significant)
    ↓
    Benchmark to confirm — auto-mapping with cached metadata may be fast enough
    NO → Auto-mapping (less code, fewer bugs)
↓
Is the mapping simple (field → property, 1:1 mapping)?
YES → Auto-mapping (attributes like `#[Column('user_name')]` are sufficient)
    ↓
    Use PHP 8+ attributes to define field-column mapping on domain object properties
    NO → Is the mapping complex (computed fields, value objects, embedded entities)?
        YES → Manual mapping (auto-mapping can't handle complex transformations)
        ↓
        Value objects need `fromDb()` / `toDb()` methods
        Embedded entities need recursive hydration
        Both require explicit mapping logic
        NO → Auto-mapping is sufficient

---

## Rationale

Auto-mapping reduces boilerplate for simple 1:1 field-to-column mapping. Manual mapping is required for complex transformations (value objects, embedded entities, computed fields). The pragmatic approach is to use auto-mapping for standard fields and manual overrides for edge cases.

---

## Recommended Default

**Default:** Auto-mapping with PHP 8+ attributes for standard fields. Manual mapping overrides for value objects, embedded entities, and computed fields.

**Reason:** Auto-mapping eliminates repetitive hydrator code. Manual overrides handle the edge cases that auto-mapping can't express. Hybrid approach provides the best balance of code reduction and expressiveness.

---

## Risks Of Wrong Choice

Auto-mapping for complex objects: mapping bugs, missing transformations, accidental data exposure. Manual mapping for every entity: massive boilerplate, duplicated patterns, high maintenance. No mapping at all: manually setting properties everywhere, scattered mapping logic.

---

## Related Rules

- Rule 5: Use auto-mapping (attributes) for standard mapping; manual for complex transformations
- Rule 6: Keep mapping logic in the mapper — not scattered across domain objects

---

## Related Skills

- Implement Auto-Mapping with Attributes
- Design Manual Mapper
