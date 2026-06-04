# ECC Anti-Patterns — GRASP: Low Coupling

## Domain: Backend Architecture & Design | Subdomain: Design Patterns & Principles

### Anti-Pattern Inventory

1. **Coupling via Global State** — Static facades, singletons, service locator
2. **Content Coupling** — Direct property access on external class internals
3. **High Efferent Coupling** — Class depending on too many other classes
4. **No Interface Boundaries** — Concrete class dependencies throughout codebase
5. **Circular Dependencies** — Classes depending on each other
6. **Data Coupling Ignored** — Passing entire objects when single field needed

### Related Rules
- Minimize inter-class dependencies (05-rules.md)
- Use interfaces at boundaries (05-rules.md)
- Inject dependencies, not create them (05-rules.md)
