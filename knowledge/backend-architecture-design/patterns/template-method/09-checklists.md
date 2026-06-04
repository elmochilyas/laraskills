# Template Method pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** GoF Behavioral Patterns
- **Knowledge Unit:** Template Method
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand inheritance and abstract classes
- [ ] Know the Liskov Substitution Principle
- [ ] Familiar with the Hollywood Principle (don't call us, we'll call you)

## Implementation Checklist
- [ ] Template method defined in base class with algorithm skeleton
- [ ] Template method declared `final` (subclass can't override algorithm structure)
- [ ] Hook methods provided at variation points (protected, optional override)
- [ ] Abstract methods used for required variation points
- [ ] Base class provides sensible defaults for optional hooks
- [ ] Number of abstract methods balanced (not too many, not too few)

## Verification Checklist
- [ ] Template method is `final` (subclass hasn't overridden algorithm order)
- [ ] Number of abstract methods isn't burdensome for subclasses
- [ ] Hooks are adequate (subclasses don't need to copy entire class)
- [ ] Template method isn't too long (algorithm structure is clear)
- [ ] Subclasses don't violate LSP (strengthening preconditions)

## Security Checklist
- [ ] Template method doesn't expose internal implementation details
- [ ] `final` methods prevent security bypass through overriding
- [ ] Subclasses can't alter security-sensitive algorithm steps

## Performance Checklist
- [ ] Template method call: standard virtual method dispatch — no overhead
- [ ] Hook methods: empty method calls from parent cost ~nanoseconds
- [ ] Deep inheritance: each level adds method resolution cost (negligible in PHP)
- [ ] Reflection-based frameworks (Laravel): additional overhead from container resolution

## Production Readiness Checklist
- [ ] Inheritance hierarchy depth is manageable
- [ ] Template Method pattern preferred over Strategy for fixed algorithm with variant steps
- [ ] Composition considered before inheritance
- [ ] Template Method used when algorithm structure is invariant

## Common Mistakes to Avoid
- [ ] Template method not declared `final` (subclass can override and break algorithm order)
- [ ] Too many abstract methods (subclass implementation burden)
- [ ] Too few hooks (subclasses forced to copy whole class to add behavior)
- [ ] Template method too long (hard to understand algorithm structure)
- [ ] Subclass violating LSP by strengthening preconditions (breaks caller expectations)
