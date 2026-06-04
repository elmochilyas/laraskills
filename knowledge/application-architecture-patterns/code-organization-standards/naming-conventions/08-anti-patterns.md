# ECC Anti-Patterns — Naming Conventions

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Code Organization Standards |
| **Knowledge Unit** | Feature-based naming conventions for classes and files |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Generic Suffix Abuse
2. Inconsistent Suffix Usage
3. God Class Naming
4. Role-Obscuring Names

---

## Repository-Wide Anti-Patterns

- God Services
- Fat Controllers

---

## Anti-Pattern 1: Generic Suffix Abuse

### Category
Code Organization

### Description
Using `Manager`, `Helper`, `Handler`, or `Processor` as class suffixes. These names don't communicate architectural role — a `DataManager` could be a service, a repository, a utility, or anything. Responsibility is impossible to infer.

### Warning Signs
- `Manager`, `Helper`, `Handler`, `Processor` classes exist
- Multiple classes with these suffixes have unrelated responsibilities
- Developers can't describe what a `Helper` does differently from a `Manager`

### Why It Is Harmful
Class responsibility is unclear from the name. New developers must read the implementation to understand its role. Code review cannot catch misplaced logic based on name alone.

### Preferred Alternative
Use role-indicating suffixes: `Service` for orchestration, `Action` for single operations, `UseCase` for business workflows, `DTO` for data transfer.

### Related Rules
Refer to naming rules documented in skills.

---

## Anti-Pattern 2: Inconsistent Suffix Usage

### Description
The same pattern is named differently across the codebase — `UserCreation`, `CreateUserAction`, `UserCreateService` used interchangeably. No documented convention.

### Why It Happens
No team naming standard. Different developers prefer different patterns.

### Warning Signs
- Multiple naming styles for the same pattern type
- Developers can't predict what a new class will be called
- Code review debates naming instead of logic

### Preferred Alternative
Pick one pattern per role: Verb-Noun for actions (`CreateUser`), {Domain}Service for services, past-tense for events.

### Related Skills
- Apply Naming Conventions for Classes and Files (COS-08/06-skills.md)

---

## Anti-Pattern 3: God Class Naming

### Description
A class named `UserService` now handles invoices, payments, and notifications. The name is misleading — it suggests user-related functionality only, but the class has grown beyond its original scope.

### Why It Happens
Feature creep. Adding methods to an existing service instead of splitting.

### Warning Signs
- Class name doesn't match its actual responsibilities
- `UserService` contains billing and notification methods
- `InvoiceController` handles user profile updates

### Preferred Alternative
Rename classes to match their actual responsibility or split them. `UserService` should handle only user operations; billing operations belong in `BillingService`.

### Related Skills
- Apply Naming Conventions for Classes and Files (COS-08/06-skills.md)
