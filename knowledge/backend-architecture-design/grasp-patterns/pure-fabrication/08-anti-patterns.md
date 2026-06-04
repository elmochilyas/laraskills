# ECC Anti-Patterns — GRASP: Pure Fabrication

## Domain: Backend Architecture & Design | Subdomain: Design Patterns & Principles

### Anti-Pattern Inventory

1. **No Pure Fabrication** — Forcing responsibilities onto domain classes that don't own the data
2. **Fabrication Overuse** — Creating service classes for operations that belong on domain objects
3. **Anemic Domain + Fat Services** — All logic in pure fabrication services, domain objects empty
4. **Fabrication Naming** — Vague names like "Manager", "Service", "Helper"
5. **Fabrication with Too Many Responsibilities** — Service class doing unrelated operations
6. **Domain Logic in Fabrication** — Business rules that belong in domain objects placed in services

### Related Rules
- Use pure fabrication for cross-cutting concerns (05-rules.md)
- Domain logic belongs in domain objects (05-rules.md)
- Name fabrications by specific responsibility (05-rules.md)
