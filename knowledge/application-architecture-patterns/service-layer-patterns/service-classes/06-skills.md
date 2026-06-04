# Skill: Design Service Classes Grouping Operations by Entity

## Purpose
Create service classes as the default location for business logic in Laravel, grouping related operations by entity/domain, with each method returning data (not HTTP responses), and managing transactions for multi-write operations.

## When To Use
- Always — service classes should be the default location for business logic
- Whenever you don't know where to put business logic, put it in a service class

## When NOT To Use
- Prototype-stage applications where speed is more important than structure
- Controllers that are already thin (delegating to model methods)

## Prerequisites
- Understanding of dependency injection in Laravel
- Default `app/Services/` directory

## Inputs
- List of business operations per entity/domain
- Existing controller code containing business logic

## Workflow
1. **Create service classes grouping by entity or domain.** Name after the entity (`UserService`, `OrderService`) — not by operation type (`CreateService`, `UpdateService`). This keeps related operations together.

2. **Give each method one business operation responsibility.** `register()`, `changePassword()`, `suspend()` — not `doUserStuff()`. One complete business operation per method.

3. **Return data, not HTTP responses.** Services return models, collections, DTOs, or primitives. Response formatting (`response()->json(...)`) belongs in the controller. This preserves reusability from CLI/queue contexts.

4. **Limit constructor dependencies to 5 or fewer.** A service with 6+ dependencies is doing too much. Split into multiple services or extract actions.

5. **Wrap multi-write operations in `DB::transaction()`.** Single-write operations don't need explicit transactions. Multi-write operations must be atomic.

6. **Delegate implementation to models, events, and jobs.** Services orchestrate — they don't implement. Delegate domain logic to models, side effects to events, async work to jobs.

7. **Avoid anemic services.** Don't extract logic to a service if it simply wraps a model method without adding orchestration value. Only extract when coordination is needed.

## Validation Checklist
- [ ] Services grouped by entity/domain, not by operation type
- [ ] Methods return data (models/DTOs), not HTTP responses
- [ ] Constructor dependencies ≤ 5 per service
- [ ] Multi-write operations wrapped in transactions
- [ ] No god service classes (> 30 methods)
- [ ] No anemic services (logicless model wrappers)
- [ ] No deep service-to-service call chains
- [ ] Services orchestrate, delegating work to models/events/jobs

## Common Failures
- **God service class.** 40 methods covering unrelated domains — split by domain.
- **Anemic service.** Methods that just call model methods without adding value.
- **Service returning responses.** Method returns `response()->json(...)` — couples business logic to HTTP.
- **Service-to-service deep call chains.** Opaque call graphs where a change in a leaf service breaks multiple upstream callers.

## Decision Points
- **Service vs Action vs Use Case?** Service for general grouping by entity; Action for single-operation leaf nodes; Use Case for multi-step orchestration with DTOs.
- **Entity-based vs Domain-based services?** Entity-based (`UserService`) for clear entity ownership; domain-based (`BillingService`) when operations span multiple entities.

## Performance Considerations
- Service resolution via container is negligible — one resolution per request.

## Security Considerations
- Authorization belongs in policies/form requests, not services.
- Services receive already-authenticated context.

## Related Rules
- Rule: Prefer Service Classes (SLP-01/05-rules.md)
- Rule: One Responsibility Per Method (SLP-01/05-rules.md)
- Rule: Return Data, Not HTTP Responses (SLP-01/05-rules.md)
- Rule: Limit Dependencies to Five (SLP-01/05-rules.md)
- Rule: Wrap Multi-Write Operations in Transactions (SLP-01/05-rules.md)
- Rule: Avoid God Service Classes (SLP-01/05-rules.md)
- Rule: Avoid Anemic Services (SLP-01/05-rules.md)
- Rule: Delegate to Models, Events, Jobs (SLP-01/05-rules.md)

## Related Skills
- Design Action Classes (SLP-02/06-skills.md)
- Thin Controllers (SLP-03/06-skills.md)
- Build Service-Action-Repository Pyramid (SLP-04/06-skills.md)
- Design Use Case Classes (LAP-11/06-skills.md)

## Success Criteria
- Business logic resides in service classes, not in controllers or models.
- Each method performs one complete business operation and returns data.
- Multi-write operations are transactional.
- No god services or anemic services exist.
