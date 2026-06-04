# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Unit of Work pattern in PHP/Laravel context
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Unit of Work maintains a list of objects affected by a business transaction and coordinates the writing out of changes and the resolution of concurrency problems. In Laravel, Eloquent's change tracking system is a Unit of Work implementation — it auto-detects dirty attributes on models and issues appropriate INSERT/UPDATE/DELETE statements during `save()`. The pattern ensures transactional integrity, batches database operations, and simplifies client code by eliminating explicit `save()` calls on every object.

---

# Core Concepts

- Change tracking: monitors new, dirty, and removed objects
- Transaction coordination: flushes all changes in one transaction
- Identity preservation: same object identity across operations
- Commit: writes all pending changes to database
- Rollback: discards pending changes

---

# Mental Models

- **Shopping Cart**: You add/remove items (tracked changes), check out (commit)
- **Paper Trail**: UoW records everything that changed, then applies all at once
- **Transaction Manager**: Coordinates multiple DB writes as a single unit

---

# Internal Mechanics

Eloquent's UoW (`Illuminate\Database\Eloquent\Concerns\HasAttributes`) tracks original attribute values vs current values. When `save()` is called, it compares current vs original, builds UPDATE/INSERT based on what changed. The model's `syncOriginal()` resets the original values after successful save. The UoW is per-model-instance, not a global UoW like Doctrine's.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Eloquent implicit UoW | Per-model change tracking | Automatic, zero-config | Scope: single model, not transaction-wide |
| Doctrine UoW | Full transaction-wide UoW | Complete change set management | Heavyweight for simple use cases |
| Manual UoW | Explicit change registration | Full control | Error-prone, manual management |

---

# Architectural Decisions

- Eloquent UoW is sufficient for: most Laravel applications
- Use Doctrine UoW for: complex domains with many interrelated objects
- Use DB Transaction for: multiple model UoW coordination
- Avoid manual UoW: Eloquent handles most cases
- Consider DB::transaction() for: atomic operations across multiple models

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Automatic change detection | Only tracks current model instance | Cross-model atomicity requires DB::transaction |
| Clean client code (no explicit save tracking) | Implicit behavior can surprise | Changes saved unexpectedly via model references |
| Reduced DB roundtrips (batch updates) | Memory: retains original values | Stale originals if model modified externally |

---

# Performance Considerations

- Eloquent UoW stores original attribute values → memory per loaded model
- Diff computation on save: cheap (array comparison) for typical models
- Batch updates: Eloquent issues one UPDATE per model, not bulk UPDATE
- Large datasets: track many models → memory pressure
- `refresh()` or `fresh()` to release UoW tracking for long-lived processes

---

# Production Considerations

- DB::transaction() wraps multi-model operations for atomicity
- Monitor `save()` performance for large batch operations
- Consider `upsert()` for bulk operations to bypass UoW
- Octane: Eloquent models with tracked changes persist across requests → stale originals
- `refresh()` models after save to reset UoW tracking

---

# Common Mistakes

- Relying on Eloquent UoW for cross-model atomicity → partial saves if exception mid-way
- Not wrapping multi-model changes in DB::transaction() → partial persistence
- Long-lived model instances with stale originals → incorrect updates (missing or extra changes)
- Modifying model after `save()` expecting re-track → original still reflects post-save state
- UoW bypass: using raw queries with Eloquent models → changes not tracked

---

# Failure Modes

- **Stale original values**: model loaded in one request, saved in another → unexpected changes
- **Partial save without transaction**: first model saves, second fails → inconsistent state
- **Detached entity**: modifying model that isn't tracked → changes silently ignored
- **Concurrent modification**: two requests load same model, both save → lost updates

---

# Ecosystem Usage

- **Eloquent ORM**: per-model UoW via `$this->original` vs `$this->attributes` comparison
- **Doctrine ORM**: full Unit of Work — tracks all managed entities across multiple repositories
- **Laravel's DB::transaction()**: wraps multiple operations, but not a UoW — just transaction boundary
- **Cashier/other packages**: use UoW through Eloquent

---

# Related Knowledge Units

**Prerequisites**: ORM basics, Transactions | **Related**: Identity Map (maintains identity during UoW), Active Record (UoW integration), Data Mapper (UoW in full ORMs) | **Advanced**: Doctrine UoW internals, Event-sourced aggregate UoW, Long-running Unit of Work patterns

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

