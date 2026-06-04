# Layer Supertype pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** Enterprise Patterns
- **Knowledge Unit:** Layer Supertype
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand inheritance and abstract classes
- [ ] Know Template Method pattern
- [ ] Familiar with base class vs interface design tradeoffs

## Implementation Checklist
- [ ] Framework supertypes used correctly (Model, FormRequest, Command, ServiceProvider)
- [ ] Custom base classes created only when shared behavior exists across types
- [ ] Base classes don't accumulate unrelated methods (god object anti-pattern)
- [ ] Domain supertype is framework-agnostic (no Laravel dependencies in domain)
- [ ] Composition preferred over inheritance where appropriate

## Verification Checklist
- [ ] No deep inheritance chains (supertype → abstract → concrete)
- [ ] Base class methods are cohesive (related to single concern)
- [ ] Subtypes not forced to implement irrelevant methods
- [ ] Protected methods don't create hidden coupling
- [ ] Framework supertype only extended when framework behavior needed

## Security Checklist
- [ ] Base class doesn't introduce security vulnerabilities inherited by all subtypes
- [ ] Method visibility correctly restricts access (protected vs public)
- [ ] Framework supertype security features understood (MassAssignment, etc.)

## Performance Checklist
- [ ] Layer supertype methods inherited — no performance penalty
- [ ] Heavy base class (like Model) evaluated for unnecessary bloat
- [ ] Trait methods compiled into class — same performance as class methods

## Production Readiness Checklist
- [ ] Custom base classes documented for team reference
- [ ] Inheritance hierarchy complexity managed
- [ ] Composition alternatives evaluated before adding inheritance
- [ ] Framework upgrade impact on supertypes assessed

## Common Mistakes to Avoid
- [ ] Creating deep inheritance chains (hard to navigate)
- [ ] Base class accumulating unrelated methods (god object anti-pattern)
- [ ] Extending framework supertype when not needed (carrying unused behavior)
- [ ] Custom domain supertype with framework dependencies (couples domain to framework)
- [ ] Base class changing behavior of subtype via protected methods (hidden coupling)
