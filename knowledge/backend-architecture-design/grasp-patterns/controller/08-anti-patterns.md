# ECC Anti-Patterns — GRASP: Controller

## Domain: Backend Architecture & Design | Subdomain: Design Patterns & Principles

### Anti-Pattern Inventory

1. **Fat Controller** — Controller handling business logic, validation, and persistence
2. **Controller as Only Entry Point** — No application service layer; all logic in controllers
3. **Controller Doing Multiple Use Cases** — Single controller method handling multiple operations
4. **Controller Coupled to Infrastructure** — Controller calling Eloquent, Mail, Queue directly
5. **No Controller (Logic in Routes)** — Business rules in route closures
6. **Controller View Logic** — Controller formatting data for view (belongs to presenter)

### Related Rules
- Keep controllers thin (05-rules.md)
- Controller delegates to service layer (05-rules.md)
- Controller handles HTTP concerns only (05-rules.md)
