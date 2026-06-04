# Identity Map pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** Enterprise Patterns
- **Knowledge Unit:** Identity Map
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand object identity vs database row identity
- [ ] Know ORM basics and Eloquent's internal hydration
- [ ] Familiar with how `find()` vs `where()` return instances

## Implementation Checklist
- [ ] Eloquent identity map used correctly (primary key lookups return same instance)
- [ ] `find()` and `findOrFail()` used where identity map benefit is needed
- [ ] `fresh()` or `refresh()` called when stale data is detected
- [ ] Model `clone` handled correctly (clone vs identity awareness)
- [ ] Octane: identity map growth monitored and managed

## Verification Checklist
- [ ] Same row loaded twice via `find()` returns same object instance
- [ ] `where()` queries return new instances (not cached in identity map)
- [ ] Model refreshed after external DB change
- [ ] Read-after-write consistency within same request works
- [ ] Cloned models don't share identity with original

## Security Checklist
- [ ] Stale data via identity map doesn't serve outdated authorization state
- [ ] `fresh()` used when current authorization/permission state required

## Performance Checklist
- [ ] Identity map hit: O(1) array lookup — negligible
- [ ] Prevents duplicate object construction (saves memory + CPU)
- [ ] Identity map holds references for request lifetime
- [ ] Octane: unbounded identity map growth monitored (memory leak risk)

## Production Readiness Checklist
- [ ] Identity map behavior understood by whole team
- [ ] `fresh()` used in long-running processes to avoid stale data
- [ ] Octane-specific identity map management in place
- [ ] No assumptions that identity map covers all queries

## Common Mistakes to Avoid
- [ ] Assuming identity map covers all queries (`where()` returns new instances)
- [ ] Not refreshing model after external DB change (stale data served)
- [ ] Identity map prevents read-after-write consistency within same request
- [ ] Cloned model references same identity (clone vs identity confusion)
- [ ] Octane: identity map growth → memory leak
