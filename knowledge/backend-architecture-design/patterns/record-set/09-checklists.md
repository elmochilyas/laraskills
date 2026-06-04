# Record Set pattern (Laravel Collection) — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** Enterprise Patterns
- **Knowledge Unit:** Record Set
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand PHP arrays and array functions
- [ ] Know Laravel Collection API (filter, map, reduce, sort, etc.)
- [ ] Understand the difference between Collection and LazyCollection

## Implementation Checklist
- [ ] DB-side filtering (`where()`) preferred over Collection filtering for large datasets
- [ ] LazyCollection used for processing large datasets (memory O(1))
- [ ] Collection chain methods used for data transformation (not raw loops)
- [ ] Higher-order messages used for concise collection operations
- [ ] Collection macros created for reusable collection logic
- [ ] Immutability respected — chains don't modify original collection

## Verification Checklist
- [ ] No loading entire dataset into Collection when DB could filter
- [ ] Collection method chains are readable and have no side effects
- [ ] LazyCollection used where appropriate (memory efficiency)
- [ ] Immutability maintained — original collection not mutated
- [ ] Performance benchmarks match expectations for data volume

## Security Checklist
- [ ] Data in collections properly sanitized before output
- [ ] Sensitive fields filtered from collections before serialization
- [ ] Collection `only()` or `except()` used for field filtering

## Performance Checklist
- [ ] Collection: all operations on loaded array — memory O(n)
- [ ] LazyCollection: processes one item at a time — memory O(1)
- [ ] 100k items Collection: ~50MB memory; LazyCollection: ~1MB
- [ ] Sorting in Collection vs DB: prefer DB sorting for large datasets

## Production Readiness Checklist
- [ ] Collection usage optimized for data volume
- [ ] LazyCollection used for large exports/reports
- [ ] Memory limits account for Collection memory usage
- [ ] Collection macros documented for team

## Common Mistakes to Avoid
- [ ] Loading entire dataset into Collection when DB could filter (memory bloat)
- [ ] Method chain too long with side effects (hard to debug)
- [ ] Using Collection where LazyCollection is appropriate (memory issues)
- [ ] Not understanding immutability (expecting chain to modify original)
- [ ] Assuming Collection operations are as optimized as DB (performance surprises)
