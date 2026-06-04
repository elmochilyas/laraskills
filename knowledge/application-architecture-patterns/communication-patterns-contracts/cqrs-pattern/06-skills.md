# Skill: Implement CQRS with Segregated Read and Write Models

## Purpose
Default to segregated read/write models within the same database (not full CQRS). Use imperative naming for commands. Never return domain objects from queries. Keep commands synchronous when user waits. Use the command bus over direct service calls. Authorize commands and queries separately.

## When To Use
- Complex domain logic where read and write models differ
- Performance optimization — read models denormalized for specific queries
- Audit/history tracking — commands provide explicit record

## When NOT To Use
- Simple CRUD where reads and writes are nearly identical
- Small applications where CQRS overhead outweighs benefits

## Prerequisites
- Domain events basics (CPC-02)
- Command patterns (SLP-04)

## Inputs
- Read model requirements
- Command definitions

## Workflow
1. **Default to segregated models, not full CQRS.** Segregated models within the same database provide CQRS benefits without the complexity of separate databases, eventual consistency, and cross-database transactions.

2. **Use imperative naming for commands.** Name commands in verb-noun format (`PlaceOrder`, `CancelInvoice`). Past tense (`OrderPlaced`) is for events, not commands.

3. **Never return domain objects from queries.** Queries return DTOs, read models, or plain arrays. Never return Eloquent models or entities — this couples presentation to domain internals.

4. **Keep commands synchronous when the user waits.** Execute commands the user awaits synchronously. Only queue commands that don't require immediate feedback.

5. **Use the command bus over direct service calls.** Route all commands through `Bus::dispatch()`. The command bus provides middleware, queuing, pipeline processing, and consistent mutation patterns.

6. **Authorize commands, authorize queries separately.** Apply authorization checks on commands for write access and on queries for read access. Never assume command authorization is sufficient for the corresponding query.

## Validation Checklist
- [ ] Commands use imperative naming via command bus
- [ ] Queries return DTOs (not domain objects/entities)
- [ ] Read and write models are separate classes
- [ ] Read models are optimized for specific queries
- [ ] CQRS not applied to simple CRUD operations
- [ ] Commands and queries authorized separately

## Common Failures
- **CQRS for simple CRUD.** Separating when reads and writes are nearly identical — waste.
- **Domain objects in queries.** Returning entities to presentation — couples presentation to domain.
- **CQRS without command bus.** Using service methods directly — commands are implicit, harder to trace.

## Decision Points
- **Segregated models vs full CQRS?** Segregated models (same DB) as default. Full CQRS (separate DBs) only when read/write performance requirements diverge significantly.
- **Sync vs queued command?** Sync if user waits for result. Queue if deferred execution is acceptable.

## Performance Considerations
- Write model: validated, routed through command bus — adds microseconds per write.
- Read model: optimized queries, no domain logic — significantly faster for complex queries.
- Full CQRS: eventual consistency between read/write databases.

## Security Considerations
- Commands should authorize the operation. Queries should authorize access to data. Different permissions may apply.

## Related Rules
- Rule: Default to segregated models, not full CQRS (CPC-08/05-rules.md)
- Rule: Use imperative naming for commands (CPC-08/05-rules.md)
- Rule: Never return domain objects from queries (CPC-08/05-rules.md)
- Rule: Keep commands synchronous when the user waits (CPC-08/05-rules.md)
- Rule: Use the command bus over direct service calls (CPC-08/05-rules.md)
- Rule: Authorize commands, authorize queries separately (CPC-08/05-rules.md)

## Related Skills
- Design Domain Events (CPC-02/06-skills.md)
- Implement Event Sourcing (CPC-09/06-skills.md)
- Optimize Read Models (MMD-14/06-skills.md)
- Implement Read Model Optimization (MMD-14/06-skills.md)

## Success Criteria
- Segregated read/write models in the same database — no separate read databases.
- Commands use imperative verb-noun naming and go through the command bus.
- Queries return only DTOs/read models — no Eloquent models crossing the query boundary.
- User-facing commands are synchronous; only deferrable commands are queued.
- Commands have write authorization; queries have separate read authorization.
