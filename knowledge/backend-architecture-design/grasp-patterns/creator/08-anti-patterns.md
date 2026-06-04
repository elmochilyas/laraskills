# ECC Anti-Patterns — GRASP: Creator

## Domain: Backend Architecture & Design | Subdomain: Design Patterns & Principles

### Anti-Pattern Inventory

1. **Creator Scattered** — Object creation logic scattered across unrelated classes
2. **Wrong Creator Assignment** — Class creates objects it shouldn't own
3. **No Factory for Complex Creation** — Complex creation logic in constructor
4. **Factory for Simple Creation** — Factory for objects that could be created inline
5. **Creator Coupling** — Creator class coupled to created class's internal details
6. **Constructor Doing Too Much** — Object creation also initializes heavy dependencies

### Related Rules
- Assign creation to containing/using class (05-rules.md)
- Use factories for complex creation (05-rules.md)
- Keep creation logic focused (05-rules.md)
