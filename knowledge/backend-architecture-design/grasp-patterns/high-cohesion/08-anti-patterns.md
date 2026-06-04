# ECC Anti-Patterns — GRASP: High Cohesion

## Domain: Backend Architecture & Design | Subdomain: Design Patterns & Principles

### Anti-Pattern Inventory

1. **God Class / Low Cohesion** — Single class with unrelated responsibilities
2. **Utility Classes** — Logically grouped unrelated functions
3. **False High Cohesion** — Methods share fields but perform unrelated operations
4. **Over-Splitting** — Classes split too finely, destroying meaningful cohesion
5. **Mixed Responsibility Model** — Eloquent model handling persistence, business logic, formatting
6. **No Cohesion Awareness** — No measurement or review of class cohesion

### Related Rules
- Keep classes functionally cohesive (05-rules.md)
- Measure and review cohesion (05-rules.md)
- Group related responsibilities (05-rules.md)
