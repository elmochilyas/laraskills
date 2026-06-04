# ECC Anti-Patterns — GRASP: Protected Variations

## Domain: Backend Architecture & Design | Subdomain: Design Patterns & Principles

### Anti-Pattern Inventory

1. **No Protection at Variation Points** — Unstable elements directly coupled to stable ones
2. **Over-Protection** — Wrapping stable elements in indirection unnecessarily
3. **Wrong Protection Mechanism** — Using inheritance when composition is more appropriate
4. **Leaky Abstraction** — Protection layer that exposes internals of the variance
5. **Protection Without Testing** — Abstraction layer not tested independently
6. **Static Protection** — Hardcoded protection that can't adapt to new variation types

### Related Rules
- Protect variation points with interfaces (05-rules.md)
- Choose minimal protection mechanism (05-rules.md)
- Test protection boundaries (05-rules.md)
