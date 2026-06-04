# Skill: Design Use Case Classes in Laravel

## Purpose
Encapsulate each application operation in a single-purpose Use Case class with a single public method, naming the class for the business operation it performs, orchestrating Domain objects through port interfaces without containing business rules itself.

## When To Use
- Clean Architecture or Hexagonal Architecture
- Need clear separation between orchestration and business rules
- Each endpoint represents a specific business operation
- Application has multiple delivery mechanisms (HTTP, CLI, queue)

## When NOT To Use
- Simple CRUD where controllers directly call models
- Three-layer architecture where Service classes handle orchestration
- Use case is a single Repository call with no orchestration

## Prerequisites
- Domain layer with business objects
- Port interfaces for Infrastructure dependencies
- DTO or Request/Response objects for input/output

## Inputs
- List of business operations (from domain analysis)
- Domain objects involved in each operation
- Port interfaces needed for each use case
- Input/output data contracts

## Workflow
1. **Identify use cases from business operations.** Work with domain experts to list every distinct end-to-end business operation. Name them in imperative business language (`CreateInvoice`, `CancelSubscription`).

2. **Create a single-purpose Use Case class.** Each use case receives exactly one public method: `__invoke()`, `handle()`, or `execute()`. The method name should be generic; the class name describes the operation.

3. **Accept DTO or primitives as input.** The public method accepts a DTO or primitive arguments. Never accept `Request` or other HTTP-specific objects. Convert input to Domain objects inside the use case.

4. **Inject ports via constructor, not method.** All dependencies (repository interfaces, queue interfaces, gateways) are injected through the constructor. This makes dependencies explicit and testable.

5. **Orchestrate, don't implement business rules.** The use case method creates Domain objects, calls their behavior methods, and uses port interfaces for persistence and side effects. Business rules stay IN the Domain objects.

6. **Manage transaction boundaries.** The use case controls whether the operation is transactional. Use `DB::transaction()` or a Unit of Work in the use case method. Keep transaction scope narrow.

7. **Return a DTO or void.** The public method returns a result DTO or `void`. Include only data needed by the caller (e.g., created entity ID, success status). Never return Domain objects directly.

## Validation Checklist
- [ ] Use case class name describes the business operation
- [ ] Single public method exists (execute, handle, __invoke)
- [ ] Method accepts DTO or primitives, not HTTP Request
- [ ] Port interfaces injected via constructor
- [ ] Use case orchestrates, does not implement business rules
- [ ] Transaction management is explicit
- [ ] Return type is DTO or void
- [ ] No HTTP-specific imports (Request, Response, Redirect)
- [ ] Use case is testable without Laravel HTTP bootstrap
- [ ] Tests cover happy path, validation failure, and domain exception

## Common Failures
- **Fat use case.** Orchestration plus business rules — move business rules to Domain objects.
- **Request object in signature.** Use case accepts `Illuminate\Http\Request` — pass a DTO or primitives instead.
- **Returning Domain objects.** Use case returns Entity or Aggregate — return a DTO with only needed data.
- **Use case as CRUD wrapper.** `CreateUser` that just calls `User::create()`. Ensure each use case adds business value.
- **Missing validation.** Use case assumes input is already validated — validate at the entry point, but also use Domain validation.

## Decision Points
- **__invoke vs execute vs handle?** `__invoke` for single-method classes that feel like callables; `execute` for clarity; consistency within project matters more than choice.
- **Action vs Service vs UseCase naming?** Use corresponding subdomain naming convention. `CreateInvoiceAction`, `CreateInvoiceUseCase`, or `CreateInvoiceService` — be consistent.
- **DTO per use case vs shared DTOs?** DTO per use case for loose coupling; shared DTOs for closely related operations.

## Performance Considerations
- Single-use-case classes use negligible memory — no concern.
- Transaction scope optimization: keep transactions as short as possible within the use case to avoid database lock contention.
- No measurable performance impact from class-based use case encapsulation.

## Security Considerations
- Authorization check: use case should verify caller has permission via a port interface to an authorization service.
- Input validation happens at entry point (Form Request), but Domain objects also validate their own invariants.
- Use case should not log sensitive input data.

## Related Rules
- Rule: Use Case Has Single Public Method (LAP-11/05-rules.md)
- Rule: Use Case Orchestrates, Domain Implements (LAP-11/05-rules.md)
- Rule: No HTTP Imports in Use Case (LAP-11/05-rules.md)
- Rule: Inject Ports via Constructor (LAP-11/05-rules.md)
- Rule: Transaction Management in Use Case (LAP-11/05-rules.md)
- Rule: Return DTO or Void (LAP-11/05-rules.md)
- Rule: Validate at Entry Point (LAP-11/05-rules.md)
- Rule: Use Case Testable Without HTTP (LAP-11/05-rules.md)

## Related Skills
- Apply Clean Architecture Layers (LAP-02/06-skills.md)
- Design Service Classes (SLP-01/06-skills.md)
- Apply Hexagonal Architecture Ports and Adapters (LAP-03/06-skills.md)
- Bind Interfaces to Implementations in Service Providers (LAP-09/06-skills.md)

## Success Criteria
- Each business operation has a dedicated Use Case class with one public method.
- Use case orchestrates Domain objects without containing business rules.
- Use case is testable without HTTP or database bootstrap.
- Use case returns DTO or void, never Domain objects or HTTP-specific types.
