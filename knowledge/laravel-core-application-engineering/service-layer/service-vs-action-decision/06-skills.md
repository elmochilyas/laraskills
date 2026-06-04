# Skill: Decide Between a Service Class and an Action Class

## Purpose
To determine whether a business operation should be implemented as a service method (grouped with related operations) or extracted to a dedicated action class, based on the operation's characteristics.

## When To Use
- When adding a new business operation to the codebase
- When reviewing whether an existing method should be extracted to an action
- When splitting a god service into focused services and actions

## When NOT To Use
- Operations that obviously fit one pattern (e.g., a single reusable complex operation → action; a shared-dependency group → service) — skip the full process
- Trivial CRUD operations that don't need either pattern

## Prerequisites
- Understanding of the service class design pattern
- Understanding of the action class design pattern (single-method, single-responsibility classes)
- Knowledge of the operation's callers, complexity, and dependency profile

## Inputs
- Operation description or method signature
- Number of lines / complexity estimate
- List of entry points that will call the operation
- List of dependencies the operation requires
- Whether other operations share those same dependencies

## Workflow
1. Evaluate the operation: is it a single, isolated business operation (one thing, clearly named) or a multi-step workflow?
2. If it is a multi-step workflow → use a **service** for orchestration (this is not an action candidate). Delegate each step to actions.
3. If it is a single operation, check if it meets extraction criteria: 30+ lines of logic, called from multiple entry points (HTTP + CLI + queue), needs an isolated test class, or requires clear merge isolation for team ownership.
4. If any extraction criterion is met → use an **action class**. Create a single-method class named `{Verb}{Entity}Action` (e.g., `RegisterUserAction`).
5. If no extraction criterion is met, check if the operation shares 2+ dependencies with other operations on the same entity/capability.
6. If it shares dependencies → add it as a **method on an existing service class**.
7. If it shares no dependencies and is simple → keep it as a **private method** in the service, or if truly trivial, inline it in the controller (but only if no reuse is expected).
8. Verify the dependency direction: services may call actions, but actions must never call services.

## Validation Checklist
- [ ] Multi-step workflows are in service orchestration methods, not actions
- [ ] Complex operations (30+ lines) are extracted to action classes
- [ ] Operations called from multiple entry points are in action classes
- [ ] Operations sharing dependencies with others are grouped in a service
- [ ] No action class calls or depends on a service class
- [ ] No service class exceeds 15 methods (extract to actions where needed)
- [ ] The decision is documented if unusual (e.g., action kept in service for team convention)
- [ ] Both patterns coexist in the codebase — not exclusively one or the other

## Common Failures
- Using actions for every operation (file proliferation, no organization)
- Using services for every operation (god services with 40+ methods)
- Actions calling services (inverted dependency direction)
- Keeping complex operations (50+ lines) buried in a service method
- Extracting to action prematurely when a service method would suffice
- Orchestration logic living in controllers because no service was created

## Decision Points
- Multi-step workflow? → Service orchestrates, individual steps are actions
- Single operation 30+ lines? → Extract to action
- Called from HTTP + CLI + queue? → Extract to action
- Needs isolated test class? → Extract to action
- Shares dependencies with other operations? → Keep as service method
- Simple, one caller, no shared deps? → Keep as service private method or inline
- Service reached 15 methods? → Split service or extract operations to actions

## Performance Considerations
- Action classes add a file per operation — negligible overhead
- Service grouping reduces constructor dependency duplication
- Both patterns resolve via the container with equivalent performance
- The decision is about maintainability, not runtime performance

## Security Considerations
- Both services and actions must not receive raw `Request` objects
- Authorization should be checked before calling either pattern
- Actions' single responsibility makes authorization easier to reason about

## Related Rules
- **Rule 1**: Use Services and Actions Complementarily
- **Rule 2**: Default to Services, Extract to Actions
- **Rule 3**: Services May Call Actions; Actions Must Not Call Services
- **Rule 4**: Use Actions for Single Complex or Reused Operations
- **Rule 5**: Use Services for Related Operations with Shared Dependencies
- **Rule 6**: Split Services with 15+ Methods
- **Rule 7**: Use Actions Inside Services for Orchestration

## Related Skills
- Design a Service Class
- Orchestrate a Multi-Step Workflow in a Service Method

## Success Criteria
- Each business operation uses the appropriate pattern based on objective criteria
- Services group related operations with shared dependencies
- Actions encapsulate complex or reused individual operations
- No inverted dependencies (actions never call services)
- Both patterns are present in the codebase, used where each is strongest
