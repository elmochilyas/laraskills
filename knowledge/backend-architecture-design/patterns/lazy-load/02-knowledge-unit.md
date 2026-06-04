# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Lazy Load pattern in PHP/Laravel context
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Lazy Load defers object initialization until the object is actually needed, avoiding the cost of loading data that may never be used. In Laravel, Eloquent relationship lazy loading is the primary manifestation: `$user->posts` doesn't query the database until the relationship is accessed. The pattern is essential for performance but dangerous without awareness—the N+1 query problem is the primary consequence of naive lazy loading.

---

# Core Concepts

- Deferred initialization: object holds placeholder, loads data on first access
- Lazy relationship: Eloquent relationship loaded on demand
- Proxy object: placeholder that stands in for the real object
- Ghost: real object with no data yet, loads on first property access
- Virtual Proxy: object with same interface, loads underlying on first method call

---

# Mental Models

- **Library Book Cover**: Shows title, but you open it to read contents
- **On-Demand Streaming**: Video buffers as you watch, not before
- **Just-in-Time Manufacturing**: Parts arrive when needed, not stored

---

# Internal Mechanics

Eloquent uses `__get()` magic method to intercept property access. When `$user->posts` is accessed, the model checks if the relationship was already loaded (`relationLoaded()`). If not, it instantiates the relationship instance and executes the query. The loaded relation is cached in `$this->relations` array. Subsequent access returns cached result without query.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Lazy Loading (Eloquent) | On-demand relationship loading | No unused data loaded | N+1 query problem |
| Ghost Object | Object with deferred state | Transparent to client | Complex proxy generation |
| Virtual Proxy | Full proxy object | Complete control | More code, indirect access |
| Lazy Initialization (Value Holder) | Defer expensive computation | Avoids unnecessary work | First access pays full cost |

---

# Architectural Decisions

- Use lazy loading: as default for Eloquent relationships (convenience)
- Use eager loading: when you KNOW relationships will be accessed
- Use lazy eager loading: `load()` when you discover need after initial query
- Use lazy loading for: optional/Occasionally accessed relationships
- Avoid lazy loading: in lists/collections where multiple models will access same relation → N+1
- Use dedicated lazy load patterns for: expensive computations, large configuration, API calls

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Only loads what's needed | N+1 if unaware | Devastating query explosion |
| Simple syntax ($user->posts) | Hidden queries | Developer unaware of DB impact |
| On-demand relationship discovery | Can't batch optimize | Inefficient for multiple same-type loads |
| Lazy DTOs/computation | First access latency | User-perceived delay |

---

# Performance Considerations

- N+1 query problem: 1 query for parent + N queries for N children
- Eager loading: 2 queries (parent + join) regardless of N
- Lazy eager loading: 1 parent query + 1 subsequent join query
- Proxy object overhead: negligible for Eloquent, non-trivial for Doctrine proxy generation
- Memory: lazy loaded objects are held in memory after loading

---

# Production Considerations

- Always eager load relationships in lists (use `with()`)
- Monitor DB query count per request (Telescope, Clockwork)
- Use `load()` for conditional eager loading
- Use `loadCount()` for counts without loading collection
- Detect N+1 with Laravel's `Model::preventLazyLoading()` in development
- Set `Model::preventLazyLoading(false)` in production but monitor

---

# Common Mistakes

- **N+1 in loops**: `foreach($users as $user) { $user->posts }` → N+1 queries
- **Lazy loading in serialization**: `toArray()` or `toJson()` triggers lazy load for included relations
- **Conditional lazy loading in views**: Blade template accesses relation → unpredictable queries
- **Lazy loading disabled globally**: removes guard, production N+1 undetected
- **Not using `load()`**: eager-loading after initial query is better than lazy for collections

---

# Failure Modes

- **N+1 query explosion**: 100 users → 101 queries instead of 2
- **Hidden query overhead**: 20 lazy loads × 10 ms each = 200ms hidden latency
- **Memory blow**: lazy loading entire collection then calling toArray → all loaded at once
- **Disconnected environment**: lazy loading fails when DB connection lost mid-request

---

# Ecosystem Usage

- **Eloquent Relationships**: `hasMany()`, `belongsTo()`, `belongsToMany()`, etc. — all lazy by default
- **Eloquent Attribute Casting**: `$user->profile_picture` may lazy-load from disk
- **Spatie/Laravel-MediaLibrary**: lazy loading of media conversions
- **LazyCollection**: `Illuminate\Support\LazyCollection` — lazy iteration over large datasets
- **PHP 8.1 Lazy Objects**: `lazy_load()` attribute for virtual proxies

---

# Related Knowledge Units

**Prerequisites**: Eloquent relationships | **Related**: Proxy pattern (lazy proxy variant), N+1 detection strategies, Eager loading, LazyCollection vs Collection | **Advanced**: Doctrine proxy generation, Ghost objects with PHP 8.1, Lazy loading vs explicit loading tradeoffs

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

