# Unit of Work pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** Enterprise Patterns
- **Knowledge Unit:** Unit of Work
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand ORM basics and database transactions
- [ ] Know how Identity Map relates to Unit of Work
- [ ] Familiar with Eloquent's change tracking system

## Implementation Checklist
- [ ] Multi-model changes wrapped in `DB::transaction()` for atomicity
- [ ] Eloquent change tracking relied on for single-model saves
- [ ] Long-lived model instances refreshed (`refresh()`) to reset change tracking
- [ ] Raw queries don't bypass Eloquent change tracking unexpectedly
- [ ] `refresh()` or `fresh()` called after saving to reset original state
- [ ] Batch updates consider Eloquent's per-model UPDATE behavior

## Verification Checklist
- [ ] Multi-model changes atomically persisted (or rolled back)
- [ ] Partial saves don't occur on exception mid-way
- [ ] Stale originals don't cause incorrect updates
- [ ] Model modifications after `save()` re-tracked correctly
- [ ] Raw queries with Eloquent models don't bypass change tracking

## Security Checklist
- [ ] Transaction rollback doesn't leak inconsistent state
- [ ] Concurrent transaction isolation levels appropriate
- [ ] No sensitive data in dirty attribute tracking

## Performance Checklist
- [ ] Eloquent UoW stores original attribute values (memory per model)
- [ ] Diff computation on save: cheap (array comparison) for typical models
- [ ] Batch updates: Eloquent issues one UPDATE per model (not bulk)
- [ ] Large datasets: track many models → memory pressure
- [ ] `refresh()`/`fresh()` releases UoW tracking for long-lived processes

## Production Readiness Checklist
- [ ] Transaction boundaries correctly scoped
- [ ] Long-running processes manage model freshness
- [ ] UoW behavior understood by development team
- [ ] Deadlock handling strategy in place for concurrent transactions

## Common Mistakes to Avoid
- [ ] Relying on Eloquent UoW for cross-model atomicity (partial saves on exception)
- [ ] Not wrapping multi-model changes in `DB::transaction()` (partial persistence)
- [ ] Long-lived model instances with stale originals (incorrect updates)
- [ ] Modifying model after `save()` expecting re-track (original reflects post-save)
- [ ] UoW bypass: using raw queries with Eloquent models (changes not tracked)
