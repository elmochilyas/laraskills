# Tagged Bindings — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **KU:** Tagged Bindings
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | Tagged bindings vs dedicated registry class | Grouping multiple service implementations | Architecture; complexity; dynamism |
| 2 | Lazy vs eager resolution of tagged services | Iterating tagged collection | Performance; memory; correctness |
| 3 | Tag interface vs tag concrete class | What to pass to `tag()` | Polymorphism; flexibility |

---

## Decision 1: Tagged Bindings vs Dedicated Registry Class

### Decision Context
Multiple services of the same type need to be collected and processed together. Choose between `tag()`/`tagged()` and a dedicated registry class.

### Decision Criteria
- **Number of services**: <20 → tags are fine; 20+ → registry class may be better
- **Need runtime dynamism** (add/remove at runtime)? Yes → registry class; No → tags
- **Complex grouping logic** (filtering, ordering, conditional resolution)? Yes → registry class; No → tags
- **Cross-provider registration**: Yes → tags (any provider can tag); No → either

### Decision Tree
```
Grouping multiple service implementations?
├── Fewer than 20 services
│   ├── All services known at registration time
│   │   └── Use TAGS — simple, built-in, lazy resolution
│   ├── Need to add/remove services at runtime
│   │   └── Use REGISTRY CLASS — tags are static
│   └── Services registered across multiple providers
│       └── Use TAGS — any provider can tag services
├── 20+ services
│   ├── Simple iteration (all services, same order)
│   │   └── TAGS still work but consider registry for clarity
│   ├── Complex ordering, filtering, or conditional selection
│   │   └── Use REGISTRY CLASS — better encapsulation of logic
│   └── Services need priority-based ordering
│       └── REGISTRY CLASS with priority sorting
├── Registration-time only (no runtime changes)
│   └── TAGS are ideal — declarative, no extra class
└── Need to iterate tagged services in SPECIFIC ORDER
    ├── Order can be controlled by registration order
    │   └── TAGS respect registration order
    ├── Need explicit priority or sorting
    │   └── REGISTRY CLASS with sort() method
    └── Some services should be excluded per-request
        └── REGISTRY CLASS with filter() method
```

### Rationale
Tags are the simplest solution for collecting services at registration time. They require no extra class, support lazy resolution, and work across multiple service providers. A dedicated registry class is warranted when you need runtime modifications, complex ordering, filtering, or when the number of services grows large enough that the grouping logic itself deserves its own abstraction.

### Default
Use tags as the default for grouping services. Reach for a registry class only when tags prove insufficient (runtime changes, complex ordering, 20+ services).

### Risks
- Using tags when runtime changes needed → can't modify tag membership after registration
- Registry class when tags would work → unnecessary abstraction and boilerplate
- Tag name collisions across packages → use namespaced tag names

### Related Rules/Skills
- Use Descriptive, Namespaced Tag Names
- Skill: Group and Resolve Services via Tags

---

## Decision 2: Lazy vs Eager Resolution

### Decision Context
Iterating a tagged collection. Decide whether to resolve services lazily (on iteration) or eagerly (convert to array first).

### Decision Criteria
- **All services always used?** Yes → eager is fine (no waste); No → lazy saves resolution
- **Iteration may break early?** Yes (find matching handler) → lazy; No (process all) → either
- **Need to iterate multiple times?** Yes → cache collection; No → lazy is fine
- **Need to count, sort, or filter collection?** Eager resolution (conversion) may be needed

### Decision Tree
```
How to iterate tagged services?
├── All tagged services will be used (process all)
│   ├── Sequential processing — all handlers run
│   │   └── Either lazy or eager — same total cost
│   └── Batch operation — all services must run
│       └── Either lazy or eager — no savings from lazy
├── Early break possible (find first matching handler)
│   ├── Handler matching condition
│   │   └── USE LAZY RESOLUTION — services after break are never resolved
│   ├── Chain of Responsibility pattern
│   │   └── USE LAZY RESOLUTION — stops at first handler that handles
│   └── Worst case: all services checked before match
│       └── Same cost as eager in worst case; potentially huge savings in best case
├── Multiple iterations over the same collection
│   ├── Iterate twice → each iteration resolves services again
│   │   └── CACHE the collection: $services = $this->app->tagged('tag')
│   └── Single iteration → no caching needed
│       └── Default lazy iteration is fine
└── Need array operations (count, filter, map, sort)
    ├── Collection methods that trigger eager resolution
    │   └── Be aware: methods like toArray(), sort(), filter() resolve all services
    ├── Use LazyCollection for memory-efficient processing of large sets
    │   └── tagged() returns regular Collection — wrap in LazyCollection if needed
    └── Small sets (<20 services) → eager resolution cost is negligible
```

### Rationale
The tagged collection returned by `tagged()` resolves services lazily — each service is resolved only when its position in the collection is accessed. This means early-breaking iterations (find the first matching handler) avoid resolving services that are never reached. Converting to an array or calling collection methods that inspect all items triggers eager resolution of all services.

### Default
Iterate lazily (default behavior). Cache the collection if iterating multiple times. Only convert to array eagerly when you need all services and iteration won't break early.

### Risks
- `toArray()` on tagged collection → resolves all services immediately
- Double iteration → resolves all services twice (cache the collection)
- Lazy iteration with side effects → unexpected behavior if services modify state during resolution

### Related Rules/Skills
- Leverage Lazy Resolution — Do Not Eagerly Resolve Tagged Services
- Cache the Tagged Collection if Iterated Multiple Times
- Skill: Group and Resolve Services via Tags

---

## Decision 3: Tag Interface vs Tag Concrete Class

### Decision Context
Calling `$app->tag()`. Decide whether to pass the interface or the concrete class name.

### Decision Criteria
- **Polymorphism needed?** Yes → tag interface; No concrete-only collection → tag interface anyway
- **Consumer depends on interface?** Yes → tag interface; No → still tag interface
- **Multiple concrete classes per interface?** Yes → tag interface (single entry covers all); No → tag interface anyway

### Decision Tree
```
What to pass to tag()?
├── Services share a COMMON INTERFACE
│   └── ALWAYS tag the INTERFACE
│   ├── Example: tag([ReportGenerator::class], 'reports.generators')
│   ├── Pro: all implementations are included automatically
│   ├── Pro: consumers depend on abstraction, not concrete
│   └── Pro: adding new implementation = just register binding, no need to tag again
├── Services do NOT share an interface
│   ├── They are logically grouped but unrelated classes
│   │   └── Tag CONCRETE CLASSES — no common abstraction
│   │   └── Consider: should they share an interface?
│   └── They represent a mixed collection (commands, listeners)
│       └── Tag CONCRETE CLASSES — appropriate for heterogeneous collections
├── NEW IMPLEMENTATIONS may be added later
│   ├── Tagging interface → new implementations automatically included
│   │   └── Tag INTERFACE — future-proof
│   └── Tagging concrete → each new implementation must be added to tag() call
│       └── Tag INTERFACE — less maintenance
└── Variadic constructor injection
    ├── Consumer type-hints the interface with variadic
    │   └── Tag INTERFACE — variadic injection resolves all tagged of that interface
    └── Consumer type-hints concrete class with variadic
        └── Would not work polymorphically — tag INTERFACE
```

### Rationale
Tagging interfaces follows the Dependency Inversion Principle — consumers depend on abstractions, and the container resolves all implementations of that abstraction. Tagging concrete classes couples the tag to specific implementations, making it harder to add new ones and preventing polymorphic iteration.

### Default
Always tag interfaces, not concrete classes. Only tag concrete classes when the collection is intentionally heterogeneous (no common interface).

### Risks
- Tagging concrete classes → new implementations not automatically included in the tag
- Tagging interface without registering bindings first → tagged() returns empty collection
- Tagging interface with only one binding → collection has one item (fine, but consider if tagging is needed at all)

### Related Rules/Skills
- Tag Interfaces, Not Concrete Classes
- Register Bindings Before Tagging Them
- Skill: Group and Resolve Services via Tags
