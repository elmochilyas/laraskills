# Skill: Orchestrate Business Operations with Use Cases and DTOs
## Purpose
Design and implement the Application layer — coordinating domain objects to fulfill user goals through single-purpose Use Cases, specific input/output DTOs, transaction management, and authorization — while keeping business rules in the Domain layer.
## When To Use
- Clean Architecture or Hexagonal Architecture with explicit use case separation
- Each application operation has distinct orchestration logic needing transaction management
- Multiple delivery mechanisms (HTTP + CLI + Queue) needing to trigger the same operations
## When NOT To Use
- Simple CRUD with minimal orchestration — traditional service layer is simpler
- Three-layer architecture where services handle both orchestration and business logic
- Small projects where use case classes create too much overhead
## Prerequisites
- LAP-05 Domain layer with entities, value objects, and domain services
- LAP-04 Dependency Rule — Application can depend on Domain, but not on Infrastructure
- Repository interfaces defined in Domain layer
- Event bus interface defined in Domain layer (if dispatching domain events)
## Inputs
- User request data (validated by Presentation layer Form Requests)
- Authenticated user context
- Application DTO mapping the request to use case input
## Workflow
1. Identify a user goal (one per use case): "Create Invoice", "Cancel Order", "Process Refund" — each maps to one business operation
2. Create an input DTO class per use case with `readonly` properties for exactly the fields that operation needs — no shared fat DTOs
3. Create the use case class with a single public method (`execute()` or `handle()`) accepting the input DTO
4. Inject dependencies via constructor: repository interfaces (Domain), domain services, application services, event bus — never inject Infrastructure classes
5. Place `DB::transaction()` boundary inside the use case, wrapping all repository calls that must be atomic
6. Move external API calls (payment, email, HTTP) AFTER the transaction commit — API calls cannot be rolled back
7. Perform authorization checks BEFORE starting the transaction — fail fast, avoid holding locks for auth
8. Delegate business decisions to Domain entities/services — use case should not contain `if` statements about business rules
9. Log use case entry, exit, timing, and result for audit trail
10. Create output DTO with exactly what the caller needs — return it from the use case
## Validation Checklist
- [ ] Each use case has a single public method representing one user goal
- [ ] Input DTO is specific to the use case (not shared fat DTO)
- [ ] No business rule `if` statements in use cases (delegated to Domain)
- [ ] `DB::transaction()` is in the use case, not in Controller or Repository
- [ ] External API calls after transaction commit, not within
- [ ] Authorization checked before transaction, not within
- [ ] Dependencies are interfaces from Domain, not Infrastructure implementations
- [ ] Use case logs entry, exit, timing, and result
- [ ] Use case does not call another use case directly
- [ ] Output DTO is returned with only needed fields
## Common Failures
- **Business logic in use cases:** Use case checks invoice status instead of calling `$invoice->canBePaid()`. Fix: delegate all business rules to Domain entities.
- **Fat DTOs:** Single DTO shared across create, update, cancel — full of nullable fields. Fix: specific DTO per use case.
- **Transactions in controllers:** Controller wraps `DB::transaction()`. Fix: move to use case so all delivery mechanisms share transaction boundaries.
- **Use case calling use case:** Opaque dependency chain. Fix: extract shared orchestration into Application Service.
- **No DTO validation:** DTO accepts invalid data because "Form Request already validated." Fix: validate at every layer boundary.
## Decision Points
- **Use Case vs Application Service:** Single operation with distinct orchestration = Use Case. Shared coordination logic across use cases = Application Service.
- **Command vs Query separation:** Writes return void/simple ID, reads return data without side effects. Keep read and write DTOs separate.
- **Transaction scope:** Single aggregate root = simple transaction. Multiple aggregates = consider eventual consistency or saga pattern.
## Performance Considerations
- Use case dispatch and DTO construction add minimal overhead (<1ms)
- For high-volume read endpoints, consider direct query DTOs without full use case orchestration
- No significant performance impact from Application layer itself — monitor database/API performance in orchestrated operations
## Security Considerations
- Authorization checks in use cases (via Domain interface to authorization service)
- Input DTOs carry already-authenticated user context
- Log use case execution for audit trail of business operations
- Validate at every layer boundary — don't assume Presentation validated everything
## Related Rules (from 05-rules.md)
- One Use Case Per User Goal
- No Business Rules in Use Cases
- Specific DTOs Per Use Case
- Transaction Boundaries in Application Layer
- Use Cases Do Not Call Other Use Cases
- Log Use Case Entry and Exit
- Validate at Every Layer Boundary
## Related Skills
- Domain Layer Modeling (LAP-05)
- Infrastructure Adapters (LAP-07)
- Presentation Layer Controllers (LAP-08)
- Transaction Boundaries (LAP-11)
## Success Criteria
- Each use case contains zero business rule logic (verified by architecture tests)
- Input DTOs are specific per use case with no unused nullable fields
- All database transactions scoped in use cases, not in controllers or repositories
- External API calls always happen after transaction commit
- Use cases are independently testable with mocked Domain interfaces
