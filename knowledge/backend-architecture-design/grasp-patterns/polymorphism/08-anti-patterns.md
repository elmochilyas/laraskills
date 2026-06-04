# ECC Anti-Patterns — GRASP: Polymorphism

## Domain: Backend Architecture & Design | Subdomain: Design Patterns & Principles

### Anti-Pattern Inventory

1. **Switch/Case Over Polymorphism** — Type-based conditionals instead of polymorphic dispatch
2. **Premature Polymorphism** — Interface/abstract class before variation exists
3. **Polymorphism Without Behavior Variation** — Subclasses that don't actually differ in behavior
4. **Deep Inheritance Hierarchies** — Too many levels of abstract classes
5. **Type Testing** — `instanceof` checks instead of polymorphic methods
6. **God Interface** — Interface too large, forcing subclasses to implement irrelevant methods

### Related Rules
- Use polymorphism instead of conditionals (05-rules.md)
- Keep hierarchies shallow (05-rules.md)
- Design focused interfaces (05-rules.md)
