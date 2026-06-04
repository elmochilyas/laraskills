# Chain of Responsibility pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** GoF Behavioral Patterns
- **Knowledge Unit:** Chain of Responsibility
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand callables and closures in PHP
- [ ] Know Laravel middleware and Pipeline component
- [ ] Familiar with Decorator pattern for comparison

## Implementation Checklist
- [ ] Handlers implement a common interface
- [ ] Each handler decides to process or pass to next handler
- [ ] `$next($passable)` called for chaining (or short-circuit by returning early)
- [ ] Pipeline used for ordered processing of passable objects
- [ ] Middleware registered with correct order (global → route groups → route)
- [ ] Handlers are stateless where possible

## Verification Checklist
- [ ] Handler doesn't modify passable in unexpected ways
- [ ] Return types consistent across all handlers
- [ ] `$next()` not forgotten (chain silently terminates if missed)
- [ ] Heavy logic in frequently-skipped handler doesn't cause performance issues
- [ ] Handlers don't depend on previous handlers' side effects
- [ ] Short-circuit path tested (early response returns correctly)

## Security Checklist
- [ ] Auth/security middleware placed earlier in chain
- [ ] Input validation middleware applied before business logic
- [ ] Rate limiting middleware applied at correct level
- [ ] Handlers don't leak sensitive data in responses

## Performance Checklist
- [ ] Each handler adds function call overhead + potential I/O
- [ ] Pipeline: O(n) for n handlers
- [ ] Laravel middleware: 5-15 per request typical
- [ ] Short-circuiting used for performance optimization
- [ ] Each middleware adds ~0.1-2ms depending on logic

## Production Readiness Checklist
- [ ] Middleware order documented and reviewed
- [ ] Custom pipeline handlers covered by tests
- [ ] Handler registration clear and maintainable
- [ ] Performance impact of chain measured

## Common Mistakes to Avoid
- [ ] Handler modifying passable in unexpected ways (subsequent handlers see modified state)
- [ ] Handler return type inconsistency (response vs modified passable)
- [ ] Forgetting to call `$next($passable)` (chain silently terminates)
- [ ] Heavy logic in frequently-skipped handler (pay cost of early rejection anyway)
- [ ] Handler depending on previous handler's side effects (implicit coupling)
