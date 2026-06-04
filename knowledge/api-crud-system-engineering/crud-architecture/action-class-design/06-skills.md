# Skill: Design Action Classes for Business Operations

## Purpose
Create single-purpose action classes that encapsulate one business operation per class, with DTO input, no HTTP dependencies, transactional writes, and stateless design.

## When To Use
- Discrete CRUD operations with business logic beyond a single `Model::create()` call
- Operations needing independent testability
- Same operation callable from HTTP, CLI, and queue entry points

## When NOT To Use
- Trivial operations without business logic (simple `Model::create()` with no conditionals)
- Operations spanning multiple domains requiring cross-cutting orchestration (use service instead)

## Prerequisites
- DTO design for typed input contracts
- Laravel container auto-resolution
- PHP 8.0+ constructor property promotion

## Inputs
- Business operation specification
- Required dependencies (repositories, services)

## Workflow
1. Name the action as `[Verb][Entity]Action`: `CreateUserAction`, `UpdateProfileAction`, `CancelOrderAction`
2. Define one public method: `execute(Dto $dto)` or `__invoke(Dto $dto)` — pick one convention and use consistently
3. Accept a typed DTO as the primary parameter — never `$request`, arrays, or loose scalars
4. Declare dependencies via constructor injection with PHP 8.0+ property promotion
5. Never import HTTP-related classes (`Illuminate\Http\Request`, `Response`)
6. Keep actions stateless — all request-specific data arrives through method parameters, never mutable properties
7. Wrap write operations in `DB::transaction()` by default
8. Pass the authenticated user explicitly as a parameter — never call `auth()->user()` inside
9. Place in `app/Actions/{Domain}/` organized by domain subdirectory

## Validation Checklist
- [ ] Exactly one public method per action class
- [ ] DTO as single primary input parameter
- [ ] No HTTP dependencies imported
- [ ] Stateless — no per-request mutable properties
- [ ] Write operations wrapped in `DB::transaction()`
- [ ] Authenticated user passed explicitly, not via `auth()->user()`
- [ ] Action name follows `[Verb][Entity]Action` convention
- [ ] No service provider binding needed (concrete class auto-resolution)

## Common Failures
- Multi-purpose action doing more than one thing — violates single responsibility
- Action without DTO — uses `$request->validated()` directly
- Business logic in controller with action as pass-through
- Action with multiple public methods (it becomes a service, not an action)
- Mutable state causing cross-request data leaks under Octane

## Decision Points
- `execute()` vs `__invoke()` convention — pick one consistently across codebase
- Action vs Service — single operation = action, multiple related operations = service
- Transaction boundary — wrap all writes in transaction, skip for read-only operations

## Performance Considerations
- Action resolution cost ~0.01ms (container auto-resolution)
- Composition of 4 actions adds ~0.04ms — negligible vs DB queries
- OpCache eliminates autoloading cost

## Security Considerations
- Actions receive already-authorized data; authorization happens in controller or Gate
- Never pass actor implicitly via `auth()->user()` — pass explicitly
- Transactional actions prevent partial inconsistent state

## Related Rules
- One Public Method Per Action
- DTO as Single Input Parameter
- No HTTP Dependencies in Actions
- Stateless Action Design
- Write Operations Wrapped in Transactions
- Name Actions as Verb + Entity + Action
- Prefer Concrete Class Resolution Over Service Provider Binding
- Skip Actions Only for Trivial Operations
- Pass Authenticated User Explicitly

## Related Skills
- DTO Design — for action input contracts
- Controller-DTO-Action Flow — for wiring actions in controllers
- Transactional Actions — for database transaction patterns

## Success Criteria
- Each action performs exactly one business operation with one public method
- Actions are independently testable without HTTP scaffolding
- Write operations are transactional with no partial state
- Actions can be called from HTTP controllers, CLI commands, and queue jobs
- No HTTP dependencies exist in any action class
