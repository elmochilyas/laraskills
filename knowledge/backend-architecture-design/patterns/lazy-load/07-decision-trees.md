# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Lazy Load pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Lazy vs eager loading for Eloquent relationships
* Decision 2: N+1 prevention strategy — eager loading vs lazy eager loading vs disabled lazy loading
* Decision 3: Custom lazy loading — proxy vs ghost vs value holder

---

# Architecture-Level Decision Trees

---

## Decision: Lazy vs Eager Loading for Eloquent Relationships

---

## Decision Context

Choose whether to load related models lazily (on access) or eagerly (with the parent query).

---

## Decision Criteria

* performance considerations: eager loading executes 2 queries total; lazy loading executes 1 + N queries
* architectural considerations: eager loading is explicit; lazy loading is transparent but dangerous
* security considerations: eager loading may expose unrelated data; lazy loading loads on demand
* maintainability considerations: eager loading is visible in code; lazy loading hides query cost

---

## Decision Tree

Is the relationship accessed for every parent record in a collection?
↓
YES → Eager load (use `with()` — prevents N+1)
    ↓
    Are you accessing the relationship inside a Blade view or loop?
    YES → Definitely eager load (views often trigger N+1 without visible query code)
    ↓
    Will every parent record need the relationship?
    YES → Eager load (no lazy loading benefit — every record needs it)
    NO → Conditional eager load (`load()` after initial query if needed)
    NO → Lazy load is acceptable (not all parents need the relationship)
↓
Is the relationship only accessed conditionally (based on a runtime check)?
YES → Lazy eager loading: `$model->load('relation')` when condition is met
NO → Is the relationship accessed once for a single parent record?
    YES → Lazy load is fine (single query, no N+1 risk)
    ↓
    Is this relationship nested 3+ levels deep ($user->posts->comments->author)?
    YES → Nested eager load: `with('posts.comments.author')`
    NO → Lazy load is fine for single-level access

---

## Rationale

Lazy loading is the default in Eloquent — relationships are lazy-loaded on access. This is efficient when the relationship is rarely accessed. However, in loops or collections, lazy loading causes the N+1 problem. Eager loading with `with()` is the prevention strategy. Use lazy loading for single-record access; use eager loading for collections.

---

## Recommended Default

**Default:** Eager load (`with()`) for relationships accessed in collections or views. Lazy load for single-record access or rarely-accessed relationships.

**Reason:** Eager loading prevents N+1 queries on collections. Lazy loading is efficient for relationships that are rarely accessed. The default should be intentional, not accidental.

---

## Risks Of Wrong Choice

Lazy loading in loops: N+1 queries, performance disaster. Eager loading everything: unneeded data fetched for every request, memory waste. Lazy loading in serialization: `toArray()` triggers lazy loads unpredictably.

---

## Related Rules

- Rule 1: Eager load relationships accessed in loops or views to prevent N+1
- Rule 2: Use `load()` for conditional eager loading after initial query

---

## Related Skills

- Apply Eager Loading
- Detect N+1 Queries

---

## Decision: N+1 Prevention Strategy — Eager Loading vs Lazy Eager Loading vs Disabled Lazy Loading

---

## Decision Context

Choose how to prevent N+1 queries across the application.

---

## Decision Criteria

* performance considerations: eager loading solves N+1 but may over-fetch; disabled lazy loading fails fast
* architectural considerations: disabled lazy loading forces explicit loading decisions
* security considerations: explicit loading prevents accidental data exposure through lazy loading
* maintainability considerations: disabled lazy loading is strict but can be noisy; eager loading is standard

---

## Decision Tree

Is the team large (>5 devs) or frequently changing?
↓
YES → Consider disabling lazy loading entirely (strict = prevents N+1 mistakes)
    ↓
    Enable `Model::$snakeAttributes = false` for strict mode
    Use `$model->relation` will throw ModelNotFoundException, forcing `with()` or `load()`
    ↓
    Does this cause too much friction in development?
    YES → Enable lazy loading with N+1 detection (Laravel Debugbar, Telescope queries)
    NO → Keep lazy loading disabled (strict prevention is worth it)
    ↓
    Disable via `Model::preventLazyLoading()` in AppServiceProvider
    NO → Use eager loading as standard practice, lazy loading for intentional cases
↓
Is the application under active development with frequent schema changes?
YES → N+1 detection (Debugbar) during development, lazy loading enabled
NO → Eager loading standard + occasional N+1 detection runs

---

## Rationale

Laravel 8+ provides `Model::preventLazyLoading()` to disable lazy loading in development/testing, forcing developers to explicitly eager-load relationships. This is the strictest N+1 prevention strategy. Alternatively, enable lazy loading with N+1 detection tools (Debugbar, Telescope) to catch violations during development without the strict enforcement.

---

## Recommended Default

**Default:** Enable `preventLazyLoading()` in development and testing. In production, disable prevention but monitor with Telescope or query logging.

**Reason:** Strict prevention catches N+1 violations during development before they reach production. Production monitoring provides safety net without blocking requests.

---

## Risks Of Wrong Choice

No N+1 prevention: violations reach production unnoticed, gradual performance degradation. Strict prevention in production: `ModelNotFoundException` for legitimate lazy loading use cases. Over-eager loading everywhere: memory waste, unnecessary data transfer.

---

## Related Rules

- Rule 3: Disable lazy loading in development with `Model::preventLazyLoading()`
- Rule 4: Use eager loading as the default; lazy loading is the exception

---

## Related Skills

- Configure N+1 Prevention
- Detect N+1 with Debugbar

---

## Decision: Custom Lazy Loading — Proxy vs Ghost vs Value Holder

---

## Decision Context

Choose the implementation approach for custom lazy loading outside Eloquent relationships.

---

## Decision Criteria

* performance considerations: proxy creates subclass dynamically (Doctrine-style); ghost is simpler; value holder wraps
* architectural considerations: proxy requires code generation; ghost requires base class; value holder is explicit
* security considerations: proxy can intercept access; value holder is transparent
* maintainability considerations: value holder is simplest to understand; proxy is most transparent to consumers

---

## Decision Tree

Is the consumer code aware of lazy loading (does it need to request the value explicitly)?
↓
YES → Value Holder pattern (consumer explicitly calls `$holder->get()` or accesses loaded property)
    ↓
    Can the consumer accept an explicit lazy interface?
    YES → Value Holder with `LazyValueInterface::get()` — most transparent and maintainable
    NO → Ghost or Proxy (must be transparent to consumer)
NO → Does the consumer expect to access properties directly (like Eloquent relations)?
    YES → Ghost pattern (load on first property access via `__get()` magic)
    ↓
    Can the class extend a base class that implements ghost loading?
    YES → Ghost via base class with magic method interception
    NO → Proxy pattern (subclass with overridden accessors that trigger loading)
NO → Is the lazy loaded value expensive to compute but once-accessed?
    YES → Value Holder with memoization (simplest, most explicit)
    NO → Consider if lazy loading is needed at all

---

## Rationale

Ghost pattern (on-demand loading triggered by property access) is closest to Eloquent's model. Value Holder (explicit getter) is simpler but requires consumer awareness. Proxy (subclass that intercepts access) is the most transparent but requires code generation. For custom lazy loading in Laravel, Value Holder is recommended for its simplicity and explicitness.

---

## Recommended Default

**Default:** Value Holder pattern with `->get()` method and memoization. Ghost pattern only when transparent property access is required by existing consumer code.

**Reason:** Value Holder is explicit, simple to implement, and doesn't require magic methods or code generation. Ghost and Proxy add complexity that is rarely justified outside ORMs.

---

## Risks Of Wrong Choice

Proxy without code generation: manual subclass maintenance, fragile. Ghost with magic methods: hard to debug, hard to type hint, unexpected behavior. No memoization: expensive operation runs every time the value is accessed.

---

## Related Rules

- Rule 5: Use the Value Holder pattern for custom lazy loading outside Eloquent

---

## Related Skills

- Implement Value Holder Pattern
- Implement Ghost Pattern
