# Lazy Load pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** Enterprise Patterns
- **Knowledge Unit:** Lazy Load
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Eloquent relationships and their loading behavior
- [ ] Know the N+1 query problem and its causes
- [ ] Familiar with eager loading vs lazy loading tradeoffs

## Implementation Checklist
- [ ] Eager loading used (`with()`, `load()`) when relationships are known to be needed
- [ ] N+1 detection in place (Clockwork, Laravel Debugbar, or custom query logger)
- [ ] `load()` used for post-query eager loading instead of lazy loading in loops
- [ ] Lazy eager loading (`load()` on collection) preferred over lazy loading in views
- [ ] Serialization (`toArray()`, `toJson()`) accounts for lazy loaded relations

## Verification Checklist
- [ ] No N+1 queries in production (checked via query monitoring)
- [ ] Blade templates don't trigger unexpected lazy loads
- [ ] API responses don't trigger N+1 during serialization
- [ ] Lazy loading not disabled globally (would mask N+1 in production)
- [ ] Lazy loading used intentionally where eager loading is wasteful

## Security Checklist
- [ ] Lazy loaded relations don't expose unauthorized data
- [ ] Relationship access control applied (model-level authorization)

## Performance Checklist
- [ ] N+1 query problem: 1 query for parent + N queries for N children
- [ ] Eager loading: 2 queries (parent + join) regardless of N
- [ ] Lazy eager loading: 1 parent query + 1 subsequent join query
- [ ] Memory: lazy loaded objects held in memory after loading

## Production Readiness Checklist
- [ ] Query monitoring active in production
- [ ] N+1 alert configured
- [ ] Eager loading strategy documented per endpoint
- [ ] `LazyCollection` used for memory-efficient processing of large datasets

## Common Mistakes to Avoid
- [ ] N+1 in loops (`foreach($users as $user) { $user->posts }`)
- [ ] Lazy loading in serialization (`toArray()` triggers lazy loads)
- [ ] Conditional lazy loading in views (unpredictable queries)
- [ ] Lazy loading disabled globally (masks production N+1)
- [ ] Not using `load()` (eager-loading after query is better than lazy for collections)
