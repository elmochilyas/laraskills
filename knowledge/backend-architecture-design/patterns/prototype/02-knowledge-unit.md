# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Prototype pattern in PHP/Laravel context
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Prototype creates new objects by cloning existing instances rather than calling constructors. In PHP, the `clone` keyword provides native support, but shallow vs deep copy semantics require careful handling of reference properties. The pattern is useful when object construction is expensive, when you need copies of objects with slightly different state, or when you want to avoid subclassing for object creation.

---

# Core Concepts

- Cloning: `clone $object` creates a shallow copy with copied references
- `__clone()` magic method: allows customization of clone behavior (deep copy references)
- Shallow vs deep: references to other objects are shared (shallow) unless explicitly cloned in `__clone()`
- Prototype registry: a store of pre-configured prototype instances to clone from

---

# Mental Models

- **Object Templates**: Pre-built object instances used as blueprints for new objects
- **Copy Constructor Alternative**: PHP uses `clone` instead of copy constructors common in C++/Java
- **Performance Optimization**: Clone avoids constructor overhead for objects with expensive initialization

---

# Internal Mechanics

PHP's `clone` performs a shallow copy: all properties are copied by value. For object-typed properties, the reference (pointer) is copied, not the object itself. `__clone()` is called on the new copy after cloning completes, allowing manual deep copying of references. PHP 8 promotes readonly properties: cloned objects can have their properties changed in `__clone()` even if readonly.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Simple clone | Quick copy of existing object | Native PHP support, no boilerplate | Shallow copy by default |
| Deep clone via `__clone()` | Full independent copy | True isolation between copies | Manual implementation per class |
| Prototype Registry | Pre-configured prototypes | Fast object creation from templates | Registry must be populated |

---

# Architectural Decisions

- Use when: object construction is expensive (DB queries, API calls, file parsing)
- Use when: objects share most state but differ in few properties
- Use when: you need many similar objects with minor variations
- Avoid cloning of: DTOs/value objects (immutability makes construction cheap)
- Avoid cloning of: objects with external resource handles (DB connections, file handles)

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Avoids expensive construction | Must manage deep copy correctness | Bugs from shared references |
| Fast object creation | __clone() maintenance burden | Changes to class = update __clone() |
| Runtime configurable prototypes | Prototype registry complexity | What fills the registry? |

---

# Performance Considerations

- Clone is significantly faster than constructor + initialization (no reflection, no DB)
- Shallow clone: ~50-100ns vs constructor call + initialization
- Deep clone: cost depends on deep object graph size
- PHP 8.1+ fiber safety: clone is safe across fibers (no shared state per fiber)

---

# Production Considerations

- Ensure __clone() handles all object-typed properties
- Test cloned object independence: modifying clone should not affect original
- Be explicit about clone behavior in class docblocks
- Watch for accidentally shared state in deeply cloned graphs

---

# Common Mistakes

- Forgetting to deep-clone mutable objects in `__clone()` → unintended shared state
- Cloning objects with event handlers → cloned object fires same handlers as original
- Cloning Eloquent models → clone shares underlying PDO connection; doesn't duplicate DB state
- Cloning objects with closures → closure-bound `$this` still references original

---

# Failure Modes

- **Shared mutation**: cloned object modifies internal object that original also references
- **Cloned resource**: cloned object with open file handle → both instances close same file handle
- **Event duplication**: cloned entity fires observer events again in tests
- **Memory explosion**: deep clone of large object graph in hot path

---

# Ecosystem Usage

- **PHP Core**: `clone` keyword, `__clone()` magic method
- **Laravel Eloquent**: `$model->replicate()` — creates new model instance without original ID/timestamps (prototype-like behavior)
- **Collections**: `$collection->map()` with clone to transform items without modifying originals
- **DTOs**: Spatie Data objects clone when using `->from()` with partially applied transformations

---

# Related Knowledge Units

**Prerequisites**: PHP object references, `__clone()` magic method | **Related**: Builder (create vs clone), Immutability patterns, Value Objects | **Advanced**: Clone with readonly properties, Shallow vs deep copy strategies

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

