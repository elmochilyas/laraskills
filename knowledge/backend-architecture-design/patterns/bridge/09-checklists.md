# Bridge pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** GoF Structural Patterns
- **Knowledge Unit:** Bridge
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Adapter pattern and when Bridge is appropriate instead
- [ ] Know Interface Segregation Principle
- [ ] Familiar with when abstraction and implementation vary independently

## Implementation Checklist
- [ ] Abstraction interface defined independently of implementation interface
- [ ] Implementor interface decoupled from abstraction (not leaking implementor concepts)
- [ ] Concrete implementations can vary without affecting abstraction
- [ ] New abstractions can use existing implementations (and vice versa)
- [ ] Bridge + Strategy combinations keep indirection manageable

## Verification Checklist
- [ ] Bridge not used where Adapter suffices (single abstraction, single implementation)
- [ ] Abstraction interface doesn't leak implementor concepts
- [ ] Implementor interface not too specific (new implementations can conform)
- [ ] Not every class has an abstraction layer (over-bridging)
- [ ] Abstraction and implementation can evolve independently

## Security Checklist
- [ ] Implementor implementations don't bypass security controls
- [ ] Bridge doesn't introduce additional attack surface
- [ ] Abstraction hides security-sensitive implementation details

## Performance Checklist
- [ ] Bridge adds one level of indirection per method call
- [ ] Cost negligible for I/O-bound operations
- [ ] Bridge + Strategy combination adds two indirections
- [ ] PHP object allocation for bridge instances is cheap

## Production Readiness Checklist
- [ ] Bridge only used where independent variation exists in both abstraction and implementation
- [ ] N×M class explosion actually prevented (class count minimized)
- [ ] ADRs document why Bridge was chosen over simpler alternatives
- [ ] Team understands when Bridge is appropriate

## Common Mistakes to Avoid
- [ ] Bridge used where Adapter suffices (single abstraction + implementation to translate)
- [ ] Abstraction interface leaking implementor concepts (abstraction depends on implementation details)
- [ ] Implementor interface too specific (new implementations can't conform)
- [ ] Over-bridging: every class gets an abstraction layer (premature abstraction)
