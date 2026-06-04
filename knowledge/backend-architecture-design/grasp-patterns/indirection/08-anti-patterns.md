# ECC Anti-Patterns — GRASP: Indirection

## Domain: Backend Architecture & Design | Subdomain: Design Patterns & Principles

### Anti-Pattern Inventory

1. **Over-Indirection** — Too many indirection layers for simple operations
2. **Incomplete Indirection** — Indirection applied inconsistently, some paths direct, some indirect
3. **Indirection Without Abstraction** — Mediation layer that doesn't actually decouple
4. **Performance Penalty** — Indirection layers causing unnecessary object creation
5. **Hidden Indirection** — Indirection not documented; developers unaware of mediation
6. **Circular Indirection** — Indirection through layers that reference each other

### Related Rules
- Use indirection at meaningful boundaries (05-rules.md)
- Document indirection layers (05-rules.md)
- Balance indirection with simplicity (05-rules.md)
