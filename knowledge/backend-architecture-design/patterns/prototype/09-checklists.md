# Prototype pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** GoF Creational Patterns
- **Knowledge Unit:** Prototype
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand PHP object references and `clone` keyword
- [ ] Know `__clone()` magic method for deep copy
- [ ] Understand shallow vs deep copy semantics

## Implementation Checklist
- [ ] `__clone()` implemented to deep-clone mutable reference properties
- [ ] Cloned objects don't share mutable state with originals
- [ ] Prototype registry or factory for managing prototype instances
- [ ] Event handlers/observers detached or re-bound after clone
- [ ] Closures re-bound correctly (closure-bound `$this` references updated)

## Verification Checklist
- [ ] Deep clone works correctly — no unintended shared mutable state
- [ ] Cloned object doesn't share event handlers/observers with original (unless intentional)
- [ ] Eloquent model clone behaves correctly (doesn't share PDO connection)
- [ ] Closure `$this` bindings updated for cloned objects
- [ ] Clone performance vs constructor evaluated (clone should be faster)

## Security Checklist
- [ ] Cloned objects don't inherit authorization state from original
- [ ] Clone doesn't bypass security checks (authorization re-evaluated for clone)
- [ ] Sensitive data in original not accidentally shared with clone

## Performance Checklist
- [ ] Clone significantly faster than constructor + initialization (no reflection, no DB)
- [ ] Shallow clone: ~50-100ns vs constructor call + initialization
- [ ] Deep clone: cost depends on object graph size
- [ ] PHP 8.1+ lazy objects: native proxy support, no custom classes needed

## Production Readiness Checklist
- [ ] Prototype used where object construction is expensive
- [ ] Clone overrides reviewed for correctness
- [ ] Performance benefit of clone measured and confirmed
- [ ] Team understands shallow vs deep copy for all objects

## Common Mistakes to Avoid
- [ ] Forgetting to deep-clone mutable objects in `__clone()` (unintended shared state)
- [ ] Cloning objects with event handlers (cloned object fires same handlers as original)
- [ ] Cloning Eloquent models (clone shares PDO connection; doesn't duplicate DB state)
- [ ] Cloning objects with closures (closure-bound `$this` still references original)
