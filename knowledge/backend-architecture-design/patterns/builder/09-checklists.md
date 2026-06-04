# Builder pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** GoF Creational Patterns
- **Knowledge Unit:** Builder
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand PHP 8 named arguments and constructor promotion
- [ ] Know fluent interface pattern
- [ ] Familiar with DTO construction patterns

## Implementation Checklist
- [ ] Builder provides fluent methods for setting optional parameters
- [ ] `build()` method validates and creates the final object
- [ ] Sensible defaults provided for optional parameters
- [ ] Builder prevents invalid object states (validation in `build()`)
- [ ] Builder is reusable (not consumed after single use) or documented as single-use
- [ ] Immutable builder returns new instance from each setter (or mutation clearly documented)

## Verification Checklist
- [ ] Builder prevents creating objects with invalid/incomplete state
- [ ] Builder is cohesive (single product type, not multiple responsibilities)
- [ ] Reasonable defaults exist for all optional parameters
- [ ] Mutable builder reused after `build()` doesn't affect already-built object
- [ ] Builder doesn't create objects with inconsistent state (e.g., URL without API key)

## Security Checklist
- [ ] Builder validates input before creating object
- [ ] Builder doesn't expose internal state through getters
- [ ] Created objects have proper initialization (no uninitialized properties)

## Performance Checklist
- [ ] Builder allocation vs direct construction: negligible for most use cases
- [ ] Immutable builder allocates intermediate objects on each method call
- [ ] Query Builder (Eloquent): builds SQL string with internal state mutations
- [ ] Test data builders: acceptable cost (test environment only)

## Production Readiness Checklist
- [ ] Builder used where object has many optional parameters
- [ ] Builder not overused (factory or direct constructor sufficient for simple cases)
- [ ] Builder methods well-named and chainable
- [ ] Team familiar with builder convention

## Common Mistakes to Avoid
- [ ] Builder that allows invalid object states (`build()` must guard)
- [ ] Builder with too many responsibilities (separate builders per product type)
- [ ] Not providing defaults (caller must set every parameter)
- [ ] Mutable builder reused after `build()` (mutations affect already-built object)
- [ ] Builder creating objects with inconsistent state (e.g., service URL without API key)
