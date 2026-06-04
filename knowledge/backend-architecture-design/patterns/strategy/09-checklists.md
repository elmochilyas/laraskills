# Strategy pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** GoF Behavioral Patterns
- **Knowledge Unit:** Strategy
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Interface Segregation Principle
- [ ] Know polymorphism and composition
- [ ] Familiar with Template Method pattern for comparison

## Implementation Checklist
- [ ] Strategy interface defines algorithm contract
- [ ] Concrete strategies encapsulate individual algorithms
- [ ] Context class accepts strategy via constructor or setter
- [ ] Strategy selection logic centralized (factory or configuration)
- [ ] Strategies are interchangeable at runtime
- [ ] Common logic extracted (not duplicated across strategies)

## Verification Checklist
- [ ] Strategy interface isn't too specific (new algorithms can conform)
- [ ] Strategy methods have no unexpected side effects
- [ ] Strategy selection logic isn't scattered across codebase
- [ ] Strategies tested in combination with context (not just in isolation)
- [ ] Strategies don't share mutable state

## Security Checklist
- [ ] Strategy selection based on safe input (not user-controlled directly)
- [ ] Strategies respect authorization boundaries
- [ ] Strategy doesn't bypass security controls

## Performance Checklist
- [ ] Strategy overhead: one method call delegation — negligible
- [ ] Strategy construction: per-request or singleton (stateless)
- [ ] Closure strategies: avoid capturing large scope in memory-constrained environments
- [ ] Singleton strategy classes for stateless algorithms

## Production Readiness Checklist
- [ ] Strategy pattern applied where algorithm varies (not prematurely)
- [ ] Strategies well-named for domain concepts
- [ ] New strategies can be added without modifying context
- [ ] Strategy documentation for team understanding

## Common Mistakes to Avoid
- [ ] Strategy interface too specific (new algorithms can't conform)
- [ ] Strategy methods with side effects (same algorithm, different results)
- [ ] Strategy selection logic spread across codebase (hard to change)
- [ ] Strategies duplicating common logic (extract base class but prefer composition)
- [ ] Not testing strategies in combination with context (works alone, fails in context)
