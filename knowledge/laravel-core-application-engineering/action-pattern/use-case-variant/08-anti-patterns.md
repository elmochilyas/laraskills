# ECC Anti-Patterns — Use Case Variant

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Action Pattern |
| **Knowledge Unit** | Use Case Variant |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Use Case with Framework Imports (Broken Agnosticism)
2. Use Case When Action Would Suffice (Premature Portability)
3. Use Case with Eloquent Models as Output (Broken Output Contract)
4. Use Case Without DTO (Array Input in a Use Case)
5. Use Case as the Only Pattern (Denying Simpler Alternatives)

---

## Repository-Wide Anti-Patterns

- Overengineering (use case for simple CRUD)
- Premature Abstraction (interface for every use case)
- Fat Controllers (no use case or action pattern at all)
- Business Logic in Models (bypassing the use case layer)

---

## Anti-Pattern 1: Use Case with Framework Imports

### Category
Architecture

### Description
A class named `XxxUseCase` that imports `Illuminate\Support\Facades\DB`, `Illuminate\Http\Request`, or calls `auth()->user()` inside its `execute()` method, violating the zero-framework-import rule that defines the pattern.

### Why It Happens
Developers treat "use case" as a synonym for "action" without understanding the framework-agnostic requirement. They add Laravel imports out of habit.

### Warning Signs
- `use Illuminate\` imports in the use case file
- Facade calls (`\DB::`, `\Cache::`, `\Mail::`) in the execute method
- `request()`, `auth()`, `session()` helper calls
- The use case cannot be tested without Laravel's container

### Why It Is Harmful
The defining characteristic of a Use Case is framework agnosticism. Framework imports silently couple domain logic to Laravel, negating the portability and interface-testability benefits that justify the Use Case's overhead.

### Real-World Consequences
The use case must run from a queue worker in a separate process that does not boot Laravel. Every framework import breaks the worker. The team must either refactor the use case or run Laravel in the worker (defeating the purpose).

### Preferred Alternative
Implement dependencies as interfaces injected via constructor. Use pure PHP. Zero `Illuminate` imports.

### Refactoring Strategy
1. Identify all `Illuminate` imports, facade calls, and Laravel helpers in the use case.
2. Create interfaces for each framework dependency.
3. Inject interfaces via constructor.
4. Replace facade calls with injected interface methods.
5. Create Laravel adapters that implement the interfaces.
6. Add Pest architecture test forbidding `Illuminate` imports in use cases.

### Detection Checklist
- [ ] Grep for `use Illuminate` in `App\UseCases\` files
- [ ] Grep for `\DB::`, `\Cache::`, `\Mail::` in use case execute methods
- [ ] Check if use case can be instantiated without Laravel boot

### Related Rules
- Rule: Enforce Zero Framework Imports in Use Case Business Logic

### Related Skills
- Skill: Create a Pragmatic Use Case (DTO Input, Eloquent Output)

### Related Decision Trees
- Decision: Full Hexagonal vs Pragmatic Laravel Use Case

---

## Anti-Pattern 2: Use Case When Action Would Suffice

### Category
Architecture | Maintainability

### Description
Creating a full Use Case with DTO input, typed result, and interface-bound dependencies for a simple single-entry-point operation that will never need framework portability.

### Why It Happens
Over-engineering driven by Clean Architecture enthusiasm. The developer creates a use case for every operation because "it's the right way."

### Warning Signs
- Every operation has a DTO, use case interface, and repository interface — 4 files per operation
- The application has no CLI, queue, or multi-platform requirements
- Adding a simple "create user" feature requires creating 4 files
- The team spends more time on boilerplate than on business logic

### Why It Is Harmful
Boilerplate overhead for no benefit. The DTO, interface, and use case ceremony add 3 files per operation. Developer productivity decreases. Simpler patterns (actions, services) would provide the same structure with less ceremony.

### Real-World Consequences
A team of 5 spends 30% of its time creating and maintaining DTOs and interfaces for operations that are only called from HTTP. Feature delivery slows down.

### Preferred Alternative
Use an Action (no DTO requirement, no interface requirement) for single-entry-point operations. Graduate to Use Case only when framework portability is actually needed.

### Refactoring Strategy
1. Identify use cases that are only called from HTTP controllers.
2. Replace the use case with an action class (remove interface requirement).
3. Remove the DTO if the action can use individual parameters.
4. Remove the interface if there is only one implementation.
5. Keep the use case only for operations that need multi-platform portability.

### Detection Checklist
- [ ] Is the use case called from only one entry point (HTTP)?
- [ ] Would an action provide equivalent structure with less ceremony?
- [ ] Does the application need framework portability?

### Related Rules
- Rule: Apply the Three-Tier Decision Framework to Each Operation Individually

### Related Skills
- Skill: Choose the Right Pattern for a Business Operation

### Related Decision Trees
- Decision: Service vs Action vs Use Case
