# Decorator pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** GoF Structural Patterns
- **Knowledge Unit:** Decorator
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand composition vs inheritance
- [ ] Know Interface Segregation Principle
- [ ] Familiar with Chain of Responsibility pattern for comparison
- [ ] Know Laravel middleware and Pipeline as decorator examples

## Implementation Checklist
- [ ] Decorator implements same interface as component it decorates
- [ ] Decorator accepts decorated component via constructor
- [ ] Decorator delegates to wrapped component (calls parent method)
- [ ] Decorator adds behavior before or after delegation
- [ ] Multiple decorators compose correctly (decorator wrapping decorator)
- [ ] Decorator doesn't modify wrapped component's state

## Verification Checklist
- [ ] Decorator doesn't change the interface (would need Adapter instead)
- [ ] Decorator delegates to parent (doesn't silently swallow behavior)
- [ ] Decorator ordering produces correct results (logging after caching vs before)
- [ ] Exceptions from decorator include cleanup (partially executed stack doesn't leak state)
- [ ] Decorator lifetimes compatible (no memory leaks in long-running processes)

## Security Checklist
- [ ] Decorator doesn't bypass security controls in wrapped component
- [ ] Decorator ordering respects security middleware placement
- [ ] Exception handling in decorator doesn't leak sensitive data

## Performance Checklist
- [ ] Each decorator adds one method call + one delegation — O(n) for n decorators
- [ ] Deep decoration stacks (10+) measurable in hot paths
- [ ] Pipeline uses callable arrays — avoids class overhead but less IDE support
- [ ] Decorator allocation: N decorators = N objects for each wrapped instance

## Production Readiness Checklist
- [ ] Decorator used where dynamic behavior composition is needed
- [ ] Class explosion avoided (subclassing alternative is worse)
- [ ] Decorator order documented for complex stacks
- [ ] Container `extend()` used for framework service decoration

## Common Mistakes to Avoid
- [ ] Decorator modifying wrapped component's state (unpredictable with shared instances)
- [ ] Decorator ordering assumptions (logging after caching misses cache hits)
- [ ] Throwing exceptions from decorator without cleanup (partially executed stack leaks state)
- [ ] Decorator wrapping decorator with incompatible lifetime (memory leaks)
- [ ] Not delegating to parent (decorator silently swallows behavior)
