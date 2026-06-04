# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Identity Map pattern in PHP/Laravel context
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Identity Map ensures each database row is loaded only once per transaction, returning the same in-memory object instance for repeated queries on the same record. In Laravel, Eloquent implements a key-based identity map: loading a model by primary key (`find()`, `findOrFail()`) returns the same instance if already loaded. The pattern prevents object duplication (multiple instances representing the same DB row), saves memory, and enables consistent in-memory state.

---

# Core Concepts

- Instance cache: maps ID → object instance
- Same identity guarantee: subsequent loads return same instance
- Scope: typically per-request or per-transaction
- Key-based: identity map keyed by table name + primary key
- Fresh vs cached: `fresh()` bypasses identity map

---

# Mental Models

- **Deduplication**: Identity map deduplicates object instances
- **Object Registry**: Central registry of loaded objects by type and ID
- **Singleton per Row**: Each DB row has at most one PHP object instance in memory

---

# Internal Mechanics

Eloquent's identity map lives in `$this->relations` and `Illuminate\Database\Eloquent\Builder`. When `find(1)` is called, the model checks if ID 1 was already loaded. If yes, returns cached instance; if no, queries DB, caches, returns. Queries that don't use ID (e.g., `where('email', 'x')`) bypass the map. `fresh()` forces a DB reload and returns a new instance. `refresh()` updates the existing instance from DB.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Key-based (Eloquent) | Simple ID-based cache | Automatic, no setup | Only works for primary key lookups |
| Query-based (Doctrine) | Full identity management | Works for all queries | Complex, stateful |
| Scope-based (Per request) | Request-scoped map | Predictable lifecycle | Cross-request problems in Octane |

---

# Architectural Decisions

- Rely on Eloquent's identity map for: consistent model state within a request
- Use `fresh()` when: you need guaranteed latest DB state
- Use `refresh()` when: you want to update existing instance from DB
- Consider: identity map only covers same instance—different queries for same row may return different objects
- Octane: identity map persists across requests unless models are cleared

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Same object instance for same DB row | Only primary key lookups use identity map | where('email') loads duplicate instance |
| Consistent in-memory state | Stale data if DB updated externally | Need fresh() for updated data |
| Memory efficient (no duplicates) | Memory holding references prevents GC | Identity map prevents garbage collection of references |

---

# Performance Considerations

- Identity map hit: O(1) array lookup—negligible
- Prevents duplicate object construction (saves memory + CPU)
- Memory: identity map holds references for request lifetime
- Large datasets: identity map grows with number of unique loaded rows
- Octane: unbounded identity map growth across requests

---

# Production Considerations

- Explicitly clear identity map in long-running processes
- Use `refresh()` before operations on previously loaded models that may have changed
- Monitor memory growth from identity map in Octane
- `forgetInstance()` for container, but not for Eloquent identity map—different systems

---

# Common Mistakes

- Assuming identity map covers all queries → where() queries return new instances
- Not refreshing model after external DB change → stale data served
- Identity map prevents read-after-write consistency within same request
- Cloned model references same identity → clone vs identity confusion
- Octane: identity map growth → memory leak

---

# Failure Modes

- **Stale identity**: model loaded early, DB updated externally, identity map returns old instance → stale data served
- **Memory leak**: identity map grows unbounded in Octane → OOM after many requests
- **Detached modification**: two requests load same model, both modify, first save overwrites second → lost update
- **Clone identity confusion**: cloned model shares identity map reference → modifying clone modifies original

---

# Ecosystem Usage

- **Eloquent ORM**: `$this->exists`, `$this->wasRecentlyCreated`, `find()` identity map
- **Doctrine ORM**: full identity map per EntityManager (all queries, not just primary key)
- **Laravel Cache**: identity map concept applied to `Cache::remember()` — different scope (cross-request)
- **In-memory caches**: application-level identity maps for reference data

---

# Related Knowledge Units

**Prerequisites**: Object identity, ORM basics | **Related**: Unit of Work (uses identity map for change tracking), Repository (may maintain identity map), Lazy Load (identity map used in proxy hydration) | **Advanced**: Identity map in long-running processes, Doctrine vs Eloquent identity map comparison

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

