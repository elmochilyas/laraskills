# Skill: Design Use Case Classes with DTO Contracts

## Purpose
Create single-intent Use Case classes that bridge the gap between actions (too granular) and services (too broad). Each use case receives typed input DTOs, orchestrates domain objects through repository interfaces, manages transaction boundaries, and returns output DTOs — with no framework imports.

## When To Use
- Complex business operations with distinct intents
- Multiple delivery mechanisms (HTTP + CLI + queue) need the same logic
- Following Clean Architecture patterns

## When NOT To Use
- Simple CRUD (service methods suffice without use case ceremony)
- Application is prototype stage

## Prerequisites
- DTO pattern for input/output contracts
- Domain repository interfaces
- Understanding of Clean Architecture Application layer

## Inputs
- Identified business intents (user goals)
- Input and output data shapes
- Repository interfaces needed

## Workflow
1. **Create one use case per business intent.** Each use class has a single `execute(InputDto): OutputDto` method. Name after the business operation: `RegisterUserUseCase`, `ProcessCheckoutUseCase`.

2. **Keep business logic in domain entities, not use cases.** Use cases orchestrate — they coordinate domain objects, call repository interfaces, and manage side effects. Domain rules belong in entities or domain services.

3. **Manage transaction boundaries in the use case.** Wrap multi-write operations in `DB::transaction()`. The use case defines the unit of work boundary.

4. **Use case must not call other use cases.** If two use cases share logic, extract to a domain service or shared action. This keeps each use case independently executable and testable.

5. **Use cases must have no framework imports.** No `Illuminate\Http\Request`, `Facades\DB`, `Facades\Auth`. Depend only on repository interfaces and DTOs.

6. **Use cases depend on domain repository interfaces, not on Eloquent models.** This is the Dependency Inversion Principle — Application layer defines what it needs, Infrastructure provides it.

7. **Log use case execution with timing.** Use cases are the right level for business-level observability. Log which use cases execute, how long they take, and whether they succeed.

## Validation Checklist
- [ ] Each use case has single business intent
- [ ] Use case has input and output DTOs
- [ ] No framework imports in use case
- [ ] No business logic in use case (only orchestration)
- [ ] Use case doesn't call other use cases
- [ ] Use case manages transaction boundaries
- [ ] Use case depends on repository interfaces, not Eloquent
- [ ] Use case execution is logged with timing

## Common Failures
- **Business logic in use cases.** Domain rules in use case execute method — scatter domain logic.
- **Framework coupling in use case.** `use Illuminate\Support\Facades\DB` — prevents use from CLI/queue.
- **Giant use cases.** One use case does everything — register user, create workspace, set up billing.
- **Use case calling use case.** Couples business intents — extract shared logic to domain services.

## Decision Points
- **Use Case vs Service vs Action?** Use Case for complete business intents with DTO contracts; Service for grouping related operations; Action for single leaf-node operations.

## Performance Considerations
- Use case resolution adds one more layer of indirection — negligible for most applications.
- Logging overhead: keep logs concise and use async logging for high-throughput use cases.

## Security Considerations
- No security logic in use cases. Authorization in policies/form requests.
- Use cases receive already-authenticated context.

## Related Rules
- Rule: Business Logic in Domain, Not Use Cases (SLP-06/05-rules.md)
- Rule: Use Case Must Not Call Other Use Cases (SLP-06/05-rules.md)
- Rule: Use Cases Manage Transactions (SLP-06/05-rules.md)
- Rule: Log Use Case Execution (SLP-06/05-rules.md)
- Rule: No Framework Imports (SLP-06/05-rules.md)
- Rule: Single Business Intent (SLP-06/05-rules.md)
- Rule: Depend on Repository Interfaces (SLP-06/05-rules.md)

## Related Skills
- Implement DTOs (SLP-05/06-skills.md)
- Design Service Classes (SLP-01/06-skills.md)
- Design Action Classes (SLP-02/06-skills.md)
- Apply Clean Architecture Layers (LAP-02/06-skills.md)

## Success Criteria
- Each use case represents one business intent with typed DTO contracts.
- Use cases orchestrate without containing business logic or framework imports.
- Use case execution is logged with timing for business observability.
- Use cases depend on repository interfaces, not on Eloquent.
