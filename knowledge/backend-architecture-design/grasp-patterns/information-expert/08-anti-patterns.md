# ECC Anti-Patterns — GRASP: Information Expert

## Domain: Backend Architecture & Design | Subdomain: Design Patterns & Principles

### Anti-Pattern Inventory

1. **Anemic Domain Model** — Logic in services that belongs on model owning the data
2. **Fat Model** — Too much logic on model, violating single responsibility
3. **Wrong Expert** — Responsibility assigned to class without needed information
4. **Cross-Object Logic in Service** — Logic operating on single object placed in service
5. **Data Class** — Model as data holder without any behavioral methods
6. **Logic Duplication** — Same data operation repeated across services instead of on model

### Related Rules
- Assign responsibility to class with the data (05-rules.md)
- Rich domain model over anemic (05-rules.md)
- Logic on model for single-object operations (05-rules.md)
